
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { SermonInput, AnalysisResult, GeneratedImages } from '../types';

// Define the response schema for structured output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    keyMoments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Título chamativo para o corte (estilo Reels/Shorts)." },
          timestamp: { type: Type.STRING, description: "Timestamp estimado plausível." },
          reasoning: { type: Type.STRING, description: "Por que este trecho viralizaria?" },
          hook: { type: Type.STRING, description: "Legenda visual para o vídeo." },
          estimatedContext: { type: Type.STRING, description: "Resumo do contexto." },
          viralScore: { type: Type.NUMBER, description: "Nota de 0 a 100 para potencial viral." },
          visualStyle: { type: Type.STRING, description: "Instrução de edição (ex: Zoom lento, Filtro P&B)." }
        },
        required: ["title", "timestamp", "reasoning", "hook", "estimatedContext", "viralScore", "visualStyle"]
      },
      description: "Lista de 3 a 5 momentos com alto potencial viral."
    },
    spotifyTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 títulos otimizados para SEO e Clique."
    },
    spotifyDescriptionSnippet: {
      type: Type.STRING,
      description: "Snippet SEO (Máx 120 chars)."
    },
    spotifyDescriptionBody: {
      type: Type.STRING,
      description: "Corpo da descrição com resumo e bullet points."
    },
    spotifyCTA: {
      type: Type.STRING,
      description: "Call to Action engajador."
    },
    spotifyPollQuestion: {
      type: Type.STRING,
      description: "Pergunta da enquete."
    },
    spotifyPollOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5 opções de resposta."
    },
    biblicalReferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de referências bíblicas."
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "10-15 Tags SEO."
    },
    marketingHooks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Frases curtas para Stories."
    }
  },
  required: ["keyMoments", "spotifyTitles", "spotifyDescriptionSnippet", "spotifyDescriptionBody", "spotifyCTA", "spotifyPollQuestion", "spotifyPollOptions", "biblicalReferences", "tags", "marketingHooks"]
};

export const analyzeSermonContent = async (input: SermonInput): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing via process.env.API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    CONTEXTO DO CONTEÚDO:
    Título: "${input.title}"
    Pregador: "${input.preacherName}"
    Texto Bíblico Base: "${input.bibleText || 'Não informado, inferir pelo título'}"
    Link: ${input.youtubeUrl}

    PERSONA:
    Você é o Diretor de Mídia Criativa (Creative Director) de uma grande organização cristã global (estilo Hillsong/Elevation). Você combina profundidade teológica com expertise em algoritmos de redes sociais (TikTok/Reels/Spotify).

    TAREFA:
    Analise este conteúdo. Como não temos o vídeo, use INFERÊNCIA AVANÇADA baseada no pregador, tema e texto bíblico para simular a estrutura mais provável da mensagem.

    DIRETRIZES ESTRATÉGICAS:

    1. **Momentos Chaves (Viral Cuts):**
       - O foco é RETENÇÃO. Identifique onde a mensagem sai da "explicação" e vai para a "aplicação emocional".
       - **Viral Score:** Seja criterioso. 90+ é apenas para momentos de "arrepiar".
       - **Visual Style:** Dê ordens para o editor de vídeo. Ex: "Corte seco", "Zoom in lento", "Texto cinético amarelo".
       - Se houver Texto Bíblico, o clímax deve estar conectado à revelação desse texto.

    2. **SEO & Copywriting (Spotify):**
       - **Títulos:** Use gatilhos de curiosidade + benefício claro. Evite "Parte 1", "Culto de Domingo".
       - **Snippet:** A primeira frase define o clique. Comece com uma pergunta ou uma afirmação polêmica/verdade dura.
       - **Tom de Voz:** Acessível, empático, mas com autoridade espiritual.

    3. **Enquete:**
       - Perguntas que geram debate ou auto-análise profunda. Nada de "Gostou da mensagem?".

    Gere o JSON estritamente conforme o schema.
  `;

  try {
    // UPDATED: Using gemini-3-flash-preview for faster analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.8, 
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No content generated from Gemini");
    }

    const data = JSON.parse(responseText) as AnalysisResult;
    return data;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// Helper function to generate one image
const generateImage = async (apiKey: string, base64Data: string, mimeType: string, promptText: string, aspectRatio?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  try {
    // Keeping gemini-3-pro-image-preview for high quality thumbnails (Flash doesn't support high-fidelity text rendering as well)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', 
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: promptText },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        // @ts-ignore
        imageConfig: aspectRatio ? { aspectRatio: aspectRatio } : undefined
      },
    });
    
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Failed to generate image");
  } catch (e) {
    console.error("Detailed Image Gen Error:", e);
    throw e;
  }
};

export const generateSermonImages = async (
  imageBase64: string, 
  mimeType: string,
  title: string, 
  preacher: string
): Promise<GeneratedImages> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  // PROMPT 1: YOUTUBE THUMBNAIL (16:9) - High CTR Strategy
  const thumbnailPrompt = `
    ROLE: Elite YouTube Thumbnail Designer.
    TASK: Create a high-contrast 16:9 thumbnail.
    
    INPUT IMAGE: Use the preacher's face from the input. Enhance detail (Upscale).
    TEXT TO OVERLAY: "${title}"
    
    COMPOSITION RULES (CRITICAL):
    1. **Rule of Thirds:** Place the Preacher distinctly on the RIGHT vertical third.
    2. **Negative Space:** Create a dark, moody void on the LEFT side specifically for the text.
    3. **Text Placement:** Render the text on the LEFT. Big, Condensed Font.
       - **Contrast:** White text on Dark background. Add a subtle drop shadow.
       - **Safety:** Do NOT let text overlap the preacher's face.
    4. **Lighting:** Apply "Rim Lighting" (Backlight) in Cyan or Orange on the preacher to separate them from the background.
    5. **Atmosphere:** Volumetric fog, cinematic depth field.

    OUTPUT: Photorealistic composite.
  `;

  // PROMPT 2: SPOTIFY COVER (1:1) - Professional Podcast Aesthetic
  const coverPrompt = `
    ROLE: Senior Art Director for Editorial Design (Time/Vogue).
    TASK: Create a 1:1 Podcast Cover Art.
    
    INPUT IMAGE: Preacher's portrait.
    TEXT TO OVERLAY: "${title}"
    
    COMPOSITION RULES (CRITICAL):
    1. **Centering:** Center the preacher's subject.
    2. **Magazine Layout:** 
       - Place the main Title text at the **TOP CENTER** (Header style) OR **BOTTOM CENTER**.
       - **Safe Zones:** Maintain a 15% padding from the edges. Ensure text does not cover the eyes.
    3. **Style:** 
       - "Double Exposure" subtle effect or High-Key Studio Lighting.
       - Clean, Minimalist typography. Sans-serif Geometric fonts.
       - Background: Solid matte color or smooth gradient. No visual clutter.

    OUTPUT: High-fashion, premium album art.
  `;

  const [thumbnail16_9, artwork1_1] = await Promise.all([
    generateImage(apiKey, imageBase64, mimeType, thumbnailPrompt, "16:9"),
    generateImage(apiKey, imageBase64, mimeType, coverPrompt, "1:1")
  ]);

  return { thumbnail16_9, artwork1_1 };
};

export const regenerateSingleImage = async (
  imageBase64: string,
  mimeType: string,
  title: string,
  type: 'thumbnail' | 'cover'
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  let prompt = "";
  let aspectRatio = "1:1";

  if (type === 'thumbnail') {
    aspectRatio = "16:9";
    prompt = `
      TASK: Redesign YouTube Thumbnail (16:9) - Version B (High Emotion).
      TEXT: "${title}"
      
      STYLE GUIDES:
      - Preacher on Right (Close up emotion).
      - Text on Left (Bold, Yellow or White).
      - Background: Dark Grunge or Bokeh City lights.
      - Effect: High Contrast, HDR style.
    `;
  } else {
    aspectRatio = "1:1";
    prompt = `
      TASK: Redesign Podcast Cover (1:1) - Version B (Minimalist).
      TEXT: "${title}"
      
      STYLE GUIDES:
      - Black and White portrait with Colored Text.
      - Typography: Swiss Design Style (Big, Bold, Grid-based).
      - Text placed strictly at the TOP.
      - Grainy texture overlay for "Film Look".
    `;
  }

  return generateImage(apiKey, imageBase64, mimeType, prompt, aspectRatio);
};
