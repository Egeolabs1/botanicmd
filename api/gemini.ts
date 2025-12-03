import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

// ⚠️ IMPORTANTE: Configure GEMINI_API_KEY (SEM prefixo VITE_) no Vercel Dashboard
// Esta variável NÃO será exposta no cliente, pois roda apenas no servidor
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Modelo Gemini (usando modelo básico sempre disponível)
const MODEL_NAME = "gemini-pro";

// 🔒 Limites de segurança reforçados
const MAX_IMAGE_SIZE_BASE64 = 10 * 1024 * 1024; // 10MB em base64
const MAX_PROMPT_LENGTH = 5000;
const MAX_REQUESTS_PER_MINUTE = 3; // Reduzido de 10 para 3
const MAX_REQUESTS_PER_HOUR = 20; // Limite por hora
const MAX_REQUESTS_PER_DAY = 100; // Limite diário
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_HOUR = 60 * 60 * 1000; // 1 hora
const RATE_LIMIT_DAY = 24 * 60 * 60 * 1000; // 1 dia

// Rate limiting com múltiplas janelas (em produção, usar Redis ou Vercel Edge Config)
const rateLimitMap = new Map<string, { 
  minuteCount: number; 
  minuteReset: number;
  hourCount: number;
  hourReset: number;
  dayCount: number;
  dayReset: number;
}>();

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// 🔒 Função para verificar rate limiting com múltiplas janelas
function checkRateLimit(identifier: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Inicializar registro se não existir ou se todas as janelas expiraram
  if (!record || now > record.dayReset) {
    rateLimitMap.set(identifier, { 
      minuteCount: 1, 
      minuteReset: now + RATE_LIMIT_WINDOW,
      hourCount: 1,
      hourReset: now + RATE_LIMIT_HOUR,
      dayCount: 1,
      dayReset: now + RATE_LIMIT_DAY
    });
    return { allowed: true };
  }

  // Verificar limite diário
  if (record.dayCount >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, reason: 'Limite diário atingido (100 requisições/dia)' };
  }

  // Verificar limite por hora
  if (now <= record.hourReset && record.hourCount >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, reason: 'Limite por hora atingido (20 requisições/hora)' };
  }

  // Verificar limite por minuto
  if (now <= record.minuteReset && record.minuteCount >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, reason: 'Limite por minuto atingido (3 requisições/min)' };
  }

  // Resetar contadores se janelas expiraram
  if (now > record.minuteReset) {
    record.minuteCount = 0;
    record.minuteReset = now + RATE_LIMIT_WINDOW;
  }
  if (now > record.hourReset) {
    record.hourCount = 0;
    record.hourReset = now + RATE_LIMIT_HOUR;
  }

  // Incrementar contadores
  record.minuteCount++;
  record.hourCount++;
  record.dayCount++;

  return { allowed: true };
}

// Função para obter identificador do cliente (IP)
function getClientIdentifier(req: VercelRequest): string {
  return req.headers['x-forwarded-for'] as string || 
         req.headers['x-real-ip'] as string || 
         'unknown';
}

// Função para configurar headers CORS
function setCORSHeaders(res: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  
  // Se ALLOWED_ORIGIN não estiver configurado, aceita qualquer origem (modo compatibilidade)
  // ⚠️ MENOS SEGURO, mas permite funcionar sem configuração adicional
  const origin = allowedOrigin || '*';
  
  res.setHeader('Access-Control-Allow-Origin', origin);
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

  // 🔒 SEGURANÇA: Bloquear user-agents suspeitos (bots, scrapers)
  const userAgent = req.headers['user-agent'] || '';
  const suspiciousAgents = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
    'python-requests', 'axios', 'postman', 'insomnia',
    'headless', 'phantom', 'selenium'
  ];
  
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.log(`🚫 Bloqueado: User-Agent suspeito: ${userAgent}`);
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // 🔒 SEGURANÇA: Exigir User-Agent válido
  if (!userAgent || userAgent.length < 10) {
    console.log('🚫 Bloqueado: User-Agent ausente ou inválido');
    return res.status(400).json({ error: 'Requisição inválida' });
  }

  // 🔒 SEGURANÇA: Verificar Origin/Referer (proteção CSRF) - DESABILITADO TEMPORARIAMENTE
  // Comentado para permitir funcionamento sem ALLOWED_ORIGIN configurado
  /*
  const origin = req.headers.origin as string;
  const referer = req.headers.referer as string;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;

  if (process.env.NODE_ENV === 'production' && allowedOrigin && allowedOrigin !== '*') {
    const requestOrigin = origin || referer;
    if (requestOrigin) {
      const normalizeOrigin = (url: string) => {
        return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      };
      
      const normalizedRequest = normalizeOrigin(requestOrigin);
      const normalizedAllowed = normalizeOrigin(allowedOrigin);
      
      if (normalizedRequest !== normalizedAllowed) {
        console.log(`🚫 Bloqueado: Origin não permitida: ${requestOrigin} (esperado: ${allowedOrigin})`);
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
  }
  */

  // 🔒 Rate limiting com múltiplas janelas
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({ 
      error: rateLimitResult.reason || 'Muitas requisições. Tente novamente em alguns instantes.' 
    });
  }

  // 🔒 SEGURANÇA: Validação de autenticação (obrigatória por padrão)
  // Configure REQUIRE_AUTH=false no Vercel APENAS para modo demo/testes
  const authHeader = req.headers.authorization;
  const requireAuth = process.env.REQUIRE_AUTH !== 'false'; // Por padrão REQUER autenticação
  
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

  // 🔍 DEBUG: Log da chave API (apenas primeiros caracteres)
  console.log('🔑 GEMINI_API_KEY presente?', !!GEMINI_API_KEY);
  console.log('🔑 GEMINI_API_KEY length:', GEMINI_API_KEY?.length || 0);
  console.log('🔑 Primeiros 10 chars:', GEMINI_API_KEY?.substring(0, 10) || 'VAZIO');

  // Verifica se a API key está configurada
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    console.error('❌ GEMINI_API_KEY não configurada!');
    return res.status(500).json({ 
      error: 'Gemini API não configurada no servidor. Configure GEMINI_API_KEY no Vercel Dashboard (Settings → Environment Variables).' 
    });
  }

  try {
    console.log('📥 Requisição recebida - Action:', req.body?.action);
    const { action, ...params } = req.body;

    // Inicializa cliente Gemini
    console.log('🤖 Inicializando GoogleGenAI com modelo:', MODEL_NAME);
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
    // 🔍 DEBUG: Log completo do erro
    console.error('❌ Erro no Gemini API:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Retornar erro com mais detalhes para debug
    return res.status(500).json({ 
      error: 'Erro ao processar requisição',
      details: error.message,
      type: error.constructor.name
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

