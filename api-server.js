// Servidor simples para API routes em desenvolvimento
// NOTA: Este servidor é apenas para desenvolvimento local
// Em produção, use o Vercel que processa automaticamente as API routes

import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = 3001;

// Configuração da API Gemini (mesma do api/gemini.ts)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-3-pro-preview";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function getLanguageName(lang) {
  const map = {
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

// Handler simplificado da API Gemini
async function handleGeminiAPI(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
      return res.status(500).json({ 
        error: 'Gemini API não configurada. Configure GEMINI_API_KEY ou VITE_GEMINI_API_KEY no arquivo .env.local' 
      });
    }

    const { action, ...params } = req.body;
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    if (action === 'analyzeImage') {
      const { base64Image, mimeType, language, prompt } = params;
      
      if (!base64Image || !mimeType) {
        return res.status(400).json({ error: 'Imagem inválida' });
      }

      // Schema simplificado (mesmo do api/gemini.ts)
      const PLANT_SCHEMA = {
        type: Type.OBJECT,
        properties: {
          commonName: { type: Type.STRING },
          scientificName: { type: Type.STRING },
          description: { type: Type.STRING },
          funFact: { type: Type.STRING },
          toxicity: { type: Type.STRING },
          propagation: { type: Type.STRING },
          imageUrl: { type: Type.STRING },
          wateringFrequencyDays: { type: Type.INTEGER },
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
              symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              treatment: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["isHealthy", "diagnosis", "symptoms", "treatment"]
          },
          medicinal: {
            type: Type.OBJECT,
            properties: {
              isMedicinal: { type: Type.BOOLEAN },
              benefits: { type: Type.STRING },
              usage: { type: Type.STRING }
            },
            required: ["isMedicinal", "benefits", "usage"]
          }
        },
        required: ["commonName", "scientificName", "description", "funFact", "toxicity", "propagation", "wateringFrequencyDays", "care", "health", "medicinal"]
      };

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: prompt }
          ]
        }],
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

    if (action === 'generateText') {
      const { prompt, language, temperature = 0.3, responseMimeType, schemaType } = params;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt é obrigatório' });
      }

      // Implementação simplificada - pode ser expandida conforme necessário
      const config = {
        systemInstruction: `You are a helpful, accurate, and friendly gardening assistant. Respond in ${getLanguageName(language)}.`,
        temperature: temperature,
        safetySettings: SAFETY_SETTINGS,
      };

      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
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

    return res.status(400).json({ error: 'Ação inválida' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Erro ao processar requisição',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Rota da API Gemini
app.post('/api/gemini', handleGeminiAPI);
app.options('/api/gemini', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`\n🔧 API Server rodando em http://localhost:${PORT}\n`);
});

