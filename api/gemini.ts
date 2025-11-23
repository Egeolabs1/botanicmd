import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

// ⚠️ IMPORTANTE: Configure GEMINI_API_KEY (SEM prefixo VITE_) no Vercel Dashboard
// Esta variável NÃO será exposta no cliente, pois roda apenas no servidor
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Modelo Gemini
const MODEL_NAME = "gemini-3-pro-preview";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
        const { prompt, language, temperature = 0.3, responseMimeType, responseSchema } = params;
        
        if (!prompt) {
          return res.status(400).json({ error: 'Prompt é obrigatório' });
        }

        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          config: {
            systemInstruction: `You are a helpful, accurate, and friendly gardening assistant. Respond in ${getLanguageName(language)}.`,
            temperature: temperature,
            responseMimeType: responseMimeType || "text/plain",
            responseSchema: responseSchema,
            safetySettings: SAFETY_SETTINGS,
          },
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
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar requisição',
      details: error.code || error.status
    });
  }
}

function getLanguageName(lang: string): string {
  const map: Record<string, string> = {
    en: "English",
    pt: "Portuguese (Brazil)",
    fr: "French",
    de: "German",
    es: "Spanish",
    ru: "Russian",
    hi: "Hindi"
  };
  return map[lang] || "English";
}

