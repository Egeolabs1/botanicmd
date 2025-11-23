import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { PlantData, PlantCandidate, SupportedLanguage, BlogPost } from "../types";
import { fetchPlantImage } from "./imageService";

// ⚠️ IMPORTANTE: Configure a variável de ambiente GEMINI_API_KEY no arquivo .env.local
// O Vite usa import.meta.env para variáveis de ambiente (prefixo VITE_)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

// Valida se a API Key está configurada
if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
  console.error('❌ GEMINI_API_KEY não configurada. Configure no arquivo .env.local');
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;

try {
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } else {
    console.warn('⚠️ Gemini API Key não encontrada. Funcionalidades de IA não estarão disponíveis.');
  }
} catch (error) {
  console.error('Erro ao inicializar cliente Gemini:', error);
}

// Modelo Gemini
// Configurado para "gemini-3-pro-preview" - modelo avançado que requer conta de faturamento configurada no Google Cloud
// Este é o modelo mais poderoso disponível atualmente para análise de plantas
const MODEL_NAME = "gemini-3-pro-preview";

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

const PLANT_SCHEMA = {
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

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const analyzePlantImage = async (base64Image: string, mimeType: string, language: SupportedLanguage): Promise<PlantData> => {
  if (!ai) {
    throw new Error('Gemini API não está configurada. Configure a variável GEMINI_API_KEY no arquivo .env.local');
  }

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
    console.log(`Iniciando análise com modelo ${MODEL_NAME}...`);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        systemInstruction: `You are a helpful, accurate, and friendly gardening assistant. Respond in ${langName}.`,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: PLANT_SCHEMA,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const text = response.text;
    if (!text) {
      console.error("Response empty", response);
      throw new Error("Model returned no data.");
    }

    // Valida e faz parse da resposta
    let plantData: PlantData;
    try {
      plantData = JSON.parse(text) as PlantData;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Resposta inválida da IA. Tente novamente.");
    }

    // Valida campos obrigatórios
    if (!plantData.commonName || !plantData.scientificName || !plantData.description) {
      throw new Error("Resposta da IA incompleta. Campos obrigatórios faltando.");
    }

    return plantData;

  } catch (error: any) {
    console.error("Analysis error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      response: error.response
    });
    
    // Verifica se é erro de quota excedida (429)
    if (error.code === 429 || error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      const quotaError = error.message?.includes('free_tier') || error.message?.includes('FreeTier');
      if (quotaError) {
        throw new Error(
          `❌ O modelo "${MODEL_NAME}" não está disponível no plano gratuito da API Gemini.\n\n` +
          `Por favor, altere para um modelo compatível com o tier gratuito:\n` +
          `- gemini-1.5-flash (recomendado)\n` +
          `- gemini-1.5-pro\n\n` +
          `Ou configure um plano pago no Google AI Studio para usar modelos Pro.`
        );
      } else {
        const retryAfter = error.message?.match(/retry in ([\d.]+)s/)?.[1];
        throw new Error(
          `⚠️ Limite de requisições excedido.\n` +
          (retryAfter ? `Tente novamente em ${Math.ceil(parseFloat(retryAfter))} segundos.\n` : '') +
          `Visite: https://ai.dev/usage?tab=rate-limit para verificar seu uso.`
        );
      }
    }
    
    // Verifica se é erro de modelo não encontrado
    if (error.message?.includes('not found') || error.message?.includes('404') || error.code === 404) {
      throw new Error(`Modelo "${MODEL_NAME}" não está disponível. Por favor, verifique se o modelo está habilitado para sua conta ou tente novamente mais tarde.`);
    }
    
    // Verifica se é erro de API key
    if (error.message?.includes('API key') || error.message?.includes('401') || error.code === 401) {
      throw new Error('Chave de API inválida ou expirada. Verifique sua configuração no arquivo .env.local');
    }
    
    // Re-throw erros customizados
    if (error.message && !error.message.includes('Resposta') && !error.message.includes('Model')) {
      throw error;
    }
    
    throw new Error(`Falha ao analisar imagem: ${error.message || 'Erro desconhecido'}. Verifique se a foto está clara e contém uma planta.`);
  }
};

export const searchPlantOptions = async (query: string, language: SupportedLanguage): Promise<PlantCandidate[]> => {
  if (!ai) {
    console.warn('Gemini API não configurada. Retornando array vazio.');
    return [];
  }

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

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: CANDIDATES_SCHEMA,
        safetySettings: SAFETY_SETTINGS,
      }
    });
    
    const text = response.text;
    if(!text) return [];
    const json = JSON.parse(text);
    return json.candidates || [];
  } catch (e) {
    console.error("Error searching options:", e);
    return [];
  }
};

export const identifyPlantByName = async (plantName: string, language: SupportedLanguage): Promise<PlantData> => {
  if (!ai) {
    throw new Error('Gemini API não está configurada. Configure a variável GEMINI_API_KEY no arquivo .env.local');
  }

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
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      config: {
        systemInstruction: `You are a living botanical encyclopedia. Respond in ${langName}.`,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: PLANT_SCHEMA,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from model.");

    // Valida e faz parse da resposta
    let plantData: PlantData;
    try {
      plantData = JSON.parse(text) as PlantData;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Resposta inválida da IA. Tente novamente.");
    }

    // Valida campos obrigatórios
    if (!plantData.commonName || !plantData.scientificName || !plantData.description) {
      throw new Error("Resposta da IA incompleta. Campos obrigatórios faltando.");
    }

    return plantData;

  } catch (error: any) {
    console.error("Search by name error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    // Verifica se é erro de modelo não encontrado
    if (error.message?.includes('not found') || error.message?.includes('404') || error.code === 404) {
      throw new Error(`Modelo "${MODEL_NAME}" não está disponível. Verifique se está habilitado para sua conta.`);
    }
    
    if (error.message && !error.message.includes('Resposta') && !error.message.includes('No response')) {
      throw error; // Re-throw erros customizados
    }
    throw new Error(`Não foi possível encontrar informações sobre esta planta: ${error.message || 'Erro desconhecido'}`);
  }
};

export const askPlantExpert = async (plantContext: PlantData, question: string, language: SupportedLanguage): Promise<string> => {
  if (!ai) {
    return "Desculpe, o serviço de IA não está disponível no momento. Configure a variável GEMINI_API_KEY no arquivo .env.local";
  }

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
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      config: {
        safetySettings: SAFETY_SETTINGS,
      }
    });
    return response.text || "Sorry, I couldn't formulate a response.";
  } catch (error: any) {
    console.error("Chat error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    // Verifica se é erro de modelo não encontrado
    if (error.message?.includes('not found') || error.message?.includes('404') || error.code === 404) {
      return `Erro: Modelo "${MODEL_NAME}" não está disponível. Verifique se está habilitado para sua conta.`;
    }
    
    return `Sorry, an error occurred: ${error.message || 'Erro desconhecido'}`;
  }
};

export const generateBlogPost = async (language: SupportedLanguage): Promise<Omit<BlogPost, 'id' | 'date'>> => {
  if (!ai) {
    throw new Error('Gemini API não está configurada. Configure a variável GEMINI_API_KEY no arquivo .env.local');
  }

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
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      config: {
        temperature: 0.8, // Higher creativity
        responseMimeType: "application/json",
        responseSchema: BLOG_POST_SCHEMA,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Model returned no data.");

    const data = JSON.parse(text);
    
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
    console.error("Blog generation error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    // Verifica se é erro de modelo não encontrado
    if (error.message?.includes('not found') || error.message?.includes('404') || error.code === 404) {
      throw new Error(`Modelo "${MODEL_NAME}" não está disponível. Verifique se está habilitado para sua conta.`);
    }
    
    throw new Error(`Failed to generate blog post: ${error.message || 'Erro desconhecido'}`);
  }
};