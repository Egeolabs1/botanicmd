import { PlantData, PlantCandidate, SupportedLanguage, BlogPost } from "../types";
import { fetchPlantImage } from "./imageService";
import { Type } from "@google/genai";
import { z } from "zod";

// ⚠️ IMPORTANTE: A API Key agora é armazenada SEGURAMENTE no servidor (Vercel Edge Function)
// Configure GEMINI_API_KEY (SEM prefixo VITE_) no Vercel Dashboard
// Esta variável NÃO será exposta no cliente

// URL da API route (será /api/gemini no Vercel)
const API_URL = '/api/gemini';

// Modelo Gemini
const MODEL_NAME = "gemini-3-pro-preview";

// Schema de validação para PlantData usando Zod
const PlantDataSchema = z.object({
  commonName: z.string().min(1),
  scientificName: z.string().min(1),
  description: z.string().min(1),
  funFact: z.string(),
  toxicity: z.string(),
  propagation: z.string(),
  imageUrl: z.string().optional(),
  wateringFrequencyDays: z.number().int().min(0),
  care: z.object({
    water: z.string(),
    light: z.string(),
    soil: z.string(),
    temperature: z.string(),
  }),
  health: z.object({
    isHealthy: z.boolean(),
    diagnosis: z.string(),
    symptoms: z.array(z.string()),
    treatment: z.array(z.string()),
  }),
  medicinal: z.object({
    isMedicinal: z.boolean(),
    benefits: z.string(),
    usage: z.string(),
  }),
});

const getLanguageName = (lang: SupportedLanguage) => {
  const map: Record<SupportedLanguage, string> = {
    en: "English",
    pt: "Portuguese (Brazil)",
    fr: "French",
    de: "German",
    es: "Spanish",
    ru: "Russian",
    hi: "Hindi"
  };
  return map[lang] || "English";
};

// Schemas exportados para uso na API route
export const PLANT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING },
    scientificName: { type: Type.STRING },
    description: { type: Type.STRING },
    funFact: { type: Type.STRING, description: "A fun fact or historical fact." },
    toxicity: { type: Type.STRING, description: "Ex: Toxic to cats, safe for humans." },
    propagation: { type: Type.STRING, description: "Ex: Cuttings in water." },
    imageUrl: { type: Type.STRING, description: "Optional: Leave empty." },
    wateringFrequencyDays: { type: Type.INTEGER, description: "Integer representing ideal watering frequency in days (ex: 3 for every 3 days). Use 0 if variable." },
    care: {
      type: Type.OBJECT,
      properties: {
        water: { type: Type.STRING },
        light: { type: Type.STRING },
        soil: { type: Type.STRING },
        temperature: { type: Type.STRING },
      },
      required: ["water", "light", "soil", "temperature"]
    },
    health: {
      type: Type.OBJECT,
      properties: {
        isHealthy: { type: Type.BOOLEAN },
        diagnosis: { type: Type.STRING },
        symptoms: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        treatment: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["isHealthy", "diagnosis", "symptoms", "treatment"]
    },
    medicinal: {
      type: Type.OBJECT,
      properties: {
        isMedicinal: { type: Type.BOOLEAN },
        benefits: { type: Type.STRING, description: "List of health benefits if medicinal." },
        usage: { type: Type.STRING, description: "How to prepare or use (e.g., tea, poultice)." }
      },
      required: ["isMedicinal", "benefits", "usage"]
    }
  },
  required: ["commonName", "scientificName", "description", "funFact", "toxicity", "propagation", "wateringFrequencyDays", "care", "health", "medicinal"]
};

const BLOG_POST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    excerpt: { type: Type.STRING },
    content: { type: Type.STRING, description: "HTML formatted content (use h3, p, ul, li tags)" },
    category: { type: Type.STRING, description: "One of: Care Guides, Beginners, Science, Technology, Wellness, Design" },
    author: { type: Type.STRING },
    imageSearchQuery: { type: Type.STRING, description: "A specific plant name or botanical term to search for an image on Wikipedia (e.g. 'Monstera', 'Succulent', 'Soil')." }
  },
  required: ["title", "excerpt", "content", "category", "author", "imageSearchQuery"]
};

const CANDIDATES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          commonName: { type: Type.STRING },
          scientificName: { type: Type.STRING },
          imageUrl: { type: Type.STRING, description: "Leave empty, handled externally." }
        },
        required: ["commonName", "scientificName"]
      }
    }
  }
};

// Helper para fazer chamadas à API route
async function callGeminiAPI(action: string, params: any): Promise<any> {
  try {
    // Obter token de autenticação do Supabase se disponível
    const { supabase, isSupabaseConfigured } = await import('./supabase');
    let authToken: string | null = null;
    
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch (error) {
        // Se não conseguir obter sessão, continua sem token (modo demo)
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Adiciona token de autenticação se disponível
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    // Se for erro de rede (API route não encontrada), significa que está rodando localmente
    // ou a API route não foi deployada
    if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
      throw new Error(
        'API Gemini não configurada no servidor. Configure GEMINI_API_KEY no Vercel Dashboard (Settings → Environment Variables). ' +
        'Use o nome SEM prefixo VITE_ para manter a chave segura no servidor.'
      );
    }
    throw error;
  }
}

export const analyzePlantImage = async (base64Image: string, mimeType: string, language: SupportedLanguage): Promise<PlantData> => {
  if (!base64Image || !mimeType) {
    throw new Error('Imagem inválida. Verifique se o arquivo foi carregado corretamente.');
  }

  const langName = getLanguageName(language);
  const prompt = `
    You are an expert botanist and phytopathologist. Analyze this plant image.
    
    IMPORTANT: If the image is not clear or does not contain a plant, identify the object or return a generic friendly identification stating uncertainty. NEVER fail to answer.

    1. Identify the plant (common name and scientific name).
    2. Provide a brief description.
    3. List essential care (water, light, soil, temperature).
    4. Analyze plant health. Identify diseases, pests, or deficiencies.
    5. If problems exist, list symptoms and treatment step-by-step. If healthy, state it is healthy.
    6. Report toxicity (safe for pets/kids or toxic). Be specific.
    7. Report propagation method.
    8. Cite a fun or historical fact.
    9. Estimate watering frequency in days (number only) for an average tropical climate.
    10. Check for MEDICINAL properties. If the plant is known to be medicinal (like Aloe Vera, Chamomile, Mint), set isMedicinal=true, list benefits, and explain how to use/prepare it. If not, set isMedicinal=false.
    
    Respond in ${langName}.
  `;

  try {
    const plantData = await callGeminiAPI('analyzeImage', {
      base64Image,
      mimeType,
      language: langName,
      prompt,
    });

    // Validação de schema usando Zod
    try {
      const validatedData = PlantDataSchema.parse(plantData);
      return validatedData as PlantData;
    } catch (validationError) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro de validação de schema:", validationError);
      }
      throw new Error("Resposta da IA incompleta ou inválida. Campos obrigatórios faltando ou formato incorreto.");
    }

  } catch (error: any) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error("Analysis error:", error);
    }
    
    // Re-throw erros customizados
    if (error.message && !error.message.includes('Resposta') && !error.message.includes('HTTP')) {
      throw error;
    }
    
    throw new Error(`Falha ao analisar imagem: ${error.message || 'Erro desconhecido'}. Verifique se a foto está clara e contém uma planta.`);
  }
};

export const searchPlantOptions = async (query: string, language: SupportedLanguage): Promise<PlantCandidate[]> => {
  if (!query || query.trim() === '') {
    return [];
  }

  const langName = getLanguageName(language);
  const prompt = `
    User searched for: "${query}".
    List up to 4 plant variations or species matching this common name.
    For each, provide common name and scientific name.
    Respond in ${langName}.
  `;

  try {
    const response = await callGeminiAPI('generateText', {
      prompt,
      language: langName,
      temperature: 0.3,
      responseMimeType: "application/json",
      schemaType: 'candidates',
    });
    
    return response.candidates || [];
  } catch (e) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error("Error searching options:", e);
    }
    return [];
  }
};

export const identifyPlantByName = async (plantName: string, language: SupportedLanguage): Promise<PlantData> => {
  if (!plantName || plantName.trim() === '') {
    throw new Error('Nome da planta é obrigatório.');
  }

  const langName = getLanguageName(language);
  const prompt = `
    User wants info on plant known as: "${plantName}".
    
    As an expert botanist:
    1. Identify the most likely plant (common/scientific name).
    2. Provide detailed description.
    3. List essential care.
    4. For health, assume generic inquiry: set isHealthy=true, diagnosis="General Consultation", symptoms/treatment empty or general tips.
    5. Info on toxicity and propagation.
    6. Cite a fun fact.
    7. Estimate watering frequency in days.
    8. Check for medicinal properties (isMedicinal, benefits, usage).

    Respond in ${langName}.
  `;

  try {
    const plantData = await callGeminiAPI('generateText', {
      prompt,
      language: langName,
      temperature: 0.3,
      responseMimeType: "application/json",
      schemaType: 'plant',
    });

    // Validação de schema usando Zod
    try {
      const validatedData = PlantDataSchema.parse(plantData);
      return validatedData as PlantData;
    } catch (validationError) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro de validação de schema:", validationError);
      }
      throw new Error("Resposta da IA incompleta ou inválida. Campos obrigatórios faltando ou formato incorreto.");
    }

  } catch (error: any) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error("Search by name error:", error);
    }
    
    // Re-throw erros customizados
    if (error.message && !error.message.includes('Resposta') && !error.message.includes('HTTP')) {
      throw error;
    }
    
    throw new Error(`Não foi possível encontrar informações sobre esta planta: ${error.message || 'Erro desconhecido'}`);
  }
};

export const askPlantExpert = async (plantContext: PlantData, question: string, language: SupportedLanguage): Promise<string> => {
  if (!question || question.trim() === '') {
    return "Por favor, faça uma pergunta sobre a planta.";
  }

  const langName = getLanguageName(language);
  const contextString = JSON.stringify(plantContext);
  
  const prompt = `
    Plant Context (JSON): ${contextString}
    
    User Question: ${question}
    
    Instructions:
    You are a botanical expert chatting with the plant owner.
    Answer the question based on context.
    If unrelated to plants, politely decline.
    Be concise (max 3 short paragraphs) and practical.
    Respond in ${langName}.
  `;

  try {
    const response = await callGeminiAPI('generateText', {
      prompt,
      language: langName,
      temperature: 0.7,
    });
    
    return response || "Desculpe, não foi possível formular uma resposta.";
  } catch (error: any) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error("Chat error:", error);
    }
    return `Desculpe, ocorreu um erro: ${error.message || 'Erro desconhecido'}`;
  }
};

export const generateBlogPost = async (language: SupportedLanguage): Promise<Omit<BlogPost, 'id' | 'date'>> => {
  const langName = getLanguageName(language);
  const prompt = `
    Generate a high-quality, engaging blog post for a gardening app called BotanicMD.
    
    Topic: Choose a random, interesting topic relevant to indoor gardening, plant health, or botany (e.g., "How to repot", "Understanding pH", "Best plants for pets").
    
    Requirements:
    1. Creative Title.
    2. Engaging Excerpt (1-2 sentences).
    3. Content must be formatted in HTML (use <h3> for subheadings, <p> for paragraphs, <ul>/<li> for lists). NO <h1> or <h2>.
    4. Assign a Category (Care Guides, Beginners, Science, Wellness, Design).
    5. Assign a fictional expert Author name.
    6. Provide an 'imageSearchQuery': a specific single English keyword (e.g., 'Monstera', 'Soil', 'Watering Can', 'Fern') to find an image on Wikipedia.

    Respond in ${langName}.
  `;

  try {
    const data = await callGeminiAPI('generateText', {
      prompt,
      language: langName,
      temperature: 0.8,
      responseMimeType: "application/json",
      schemaType: 'blog',
    });
    
    // Fetch image based on the AI's suggestion
    let imageUrl = await fetchPlantImage(data.imageSearchQuery);
    
    // Fallback if no image found
    if (!imageUrl) {
       imageUrl = "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?q=80&w=1200&auto=format&fit=crop";
    }

    return {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      author: data.author,
      imageUrl: imageUrl
    };

  } catch (error: any) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error("Blog generation error:", error);
    }
    throw new Error(`Failed to generate blog post: ${error.message || 'Erro desconhecido'}`);
  }
};
