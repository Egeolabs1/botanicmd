import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

// ⚠️ IMPORTANTE: Configure GEMINI_API_KEY (SEM prefixo VITE_) no Vercel Dashboard
// Esta variável NÃO será exposta no cliente, pois roda apenas no servidor
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Modelo Gemini
const MODEL_NAME = "gemini-3-pro-preview";

// Limites de segurança
const MAX_IMAGE_SIZE_BASE64 = 10 * 1024 * 1024; // 10MB em base64
const MAX_PROMPT_LENGTH = 5000;
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto

// Rate limiting simples (em produção, usar Redis ou Vercel Edge Config)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Função para verificar rate limiting
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  record.count++;
  return true;
}

// Função para obter identificador do cliente (IP)
function getClientIdentifier(req: VercelRequest): string {
  return req.headers['x-forwarded-for'] as string || 
         req.headers['x-real-ip'] as string || 
         'unknown';
}

// Função para configurar headers CORS
function setCORSHeaders(res: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  setCORSHeaders(res);

  // Tratar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientId = getClientIdentifier(req);
  if (!checkRateLimit(clientId)) {
    return res.status(429).json({ 
      error: 'Muitas requisições. Tente novamente em alguns instantes.' 
    });
  }

  // Validação de autenticação (opcional - pode ser desabilitada em modo demo)
  // Em produção, configure REQUIRE_AUTH=true no Vercel para exigir autenticação
  const authHeader = req.headers.authorization;
  const requireAuth = process.env.REQUIRE_AUTH === 'true'; // Por padrão NÃO requer auth (modo demo)
  
  if (requireAuth && (!authHeader || !authHeader.startsWith('Bearer '))) {
    return res.status(401).json({ 
      error: 'Autenticação necessária. Por favor, faça login.' 
    });
  }

  // Se token fornecido, validar com Supabase (opcional)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Em produção, validar token com Supabase
    // Por enquanto, apenas verifica se existe
    if (!token || token.length < 10) {
      return res.status(401).json({ 
        error: 'Token de autenticação inválido.' 
      });
    }
  }

  // Verifica se a API key está configurada
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    return res.status(500).json({ 
      error: 'Gemini API não configurada no servidor. Configure GEMINI_API_KEY no Vercel Dashboard (Settings → Environment Variables).' 
    });
  }

  try {
    const { action, ...params } = req.body;

    // Inicializa cliente Gemini
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    switch (action) {
      case 'analyzeImage': {
        const { base64Image, mimeType, language, prompt } = params;
        
        if (!base64Image || !mimeType) {
          return res.status(400).json({ error: 'Imagem inválida' });
        }

        // Validação de tipo MIME
        if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
          return res.status(400).json({ error: 'Tipo de imagem não permitido. Use JPEG, PNG, WebP ou GIF.' });
        }

        // Validação de tamanho da imagem base64
        // Base64 é ~33% maior que o arquivo original
        const base64Size = base64Image.length;
        if (base64Size > MAX_IMAGE_SIZE_BASE64) {
          return res.status(400).json({ error: 'Imagem muito grande. Tamanho máximo: 10MB.' });
        }

        // Validação de prompt
        if (prompt && typeof prompt === 'string' && prompt.length > MAX_PROMPT_LENGTH) {
          return res.status(400).json({ error: 'Prompt muito longo. Máximo: 5000 caracteres.' });
        }

        // Schema para análise de plantas (definido inline para evitar problemas de serialização)
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
            systemInstruction: `You are a helpful, accurate, and friendly gardening assistant. Respond in ${getLanguageName(language)}.`,
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: PLANT_SCHEMA,
            safetySettings: SAFETY_SETTINGS,
          },
        });

        const text = response.text;
        if (!text) {
          return res.status(500).json({ error: 'Model returned no data' });
        }

        return res.status(200).json({ data: JSON.parse(text) });
      }

      case 'generateText': {
        const { prompt, language, temperature = 0.3, responseMimeType, schemaType } = params;
        
        if (!prompt) {
          return res.status(400).json({ error: 'Prompt é obrigatório' });
        }

        // Validação de tipo e tamanho do prompt
        if (typeof prompt !== 'string') {
          return res.status(400).json({ error: 'Prompt deve ser uma string' });
        }

        if (prompt.length > MAX_PROMPT_LENGTH) {
          return res.status(400).json({ error: 'Prompt muito longo. Máximo: 5000 caracteres.' });
        }

        if (prompt.trim().length === 0) {
          return res.status(400).json({ error: 'Prompt não pode estar vazio' });
        }

        // Validação de temperatura
        if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
          return res.status(400).json({ error: 'Temperatura deve estar entre 0 e 1' });
        }

        // Define schemas baseado no tipo solicitado
        let responseSchema: any = undefined;
        
        if (schemaType === 'plant') {
          responseSchema = {
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
        } else if (schemaType === 'candidates') {
          responseSchema = {
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
        } else if (schemaType === 'blog') {
          responseSchema = {
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
        }

        const config: any = {
          systemInstruction: `You are a helpful, accurate, and friendly gardening assistant. Respond in ${getLanguageName(language)}.`,
          temperature: temperature,
          safetySettings: SAFETY_SETTINGS,
        };

        if (responseMimeType) {
          config.responseMimeType = responseMimeType;
        }

        if (responseSchema) {
          config.responseSchema = responseSchema;
        }

        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          config: config,
        });

        const text = response.text;
        if (!text) {
          return res.status(500).json({ error: 'Model returned no data' });
        }

        return res.status(200).json({ 
          data: responseMimeType === "application/json" ? JSON.parse(text) : text 
        });
      }

      default:
        return res.status(400).json({ error: 'Ação inválida' });
    }
  } catch (error: any) {
    // Log apenas em desenvolvimento, sem expor detalhes sensíveis
    if (process.env.NODE_ENV === 'development') {
      console.error('Gemini API Error:', error.message);
    }
    
    // Não expor detalhes do erro em produção
    return res.status(500).json({ 
      error: 'Erro ao processar requisição. Tente novamente mais tarde.'
    });
  }
}

function getLanguageName(lang: string): string {
  const map: Record<string, string> = {
    en: "English",
    pt: "Portuguese (Brazil)",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    zh: "Chinese (Simplified)",
    ru: "Russian",
    hi: "Hindi"
  };
  return map[lang] || "English";
}

