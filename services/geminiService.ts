
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
          title: { type: Type.STRING, description: "A catchy title for this specific clip/moment" },
          timestamp: { type: Type.STRING, description: "The estimated timestamp (e.g., '04:30 - 05:45') where this likely happens based on standard sermon structure" },
          reasoning: { type: Type.STRING, description: "Why this moment is likely to get high engagement" },
          hook: { type: Type.STRING, description: "A short caption hook for social media" },
          estimatedContext: { type: Type.STRING, description: "A brief summary of what likely happens in this segment" }
        },
        required: ["title", "timestamp", "reasoning", "hook", "estimatedContext"]
      },
      description: "List of 3-5 viral potential moments found in the analysis with timestamps."
    },
    spotifyTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 distinct SEO-optimized title options."
    },
    spotifyDescriptionSnippet: {
      type: Type.STRING,
      description: "SEO Snippet (Max 120 chars) for the beginning of the description."
    },
    spotifyDescriptionBody: {
      type: Type.STRING,
      description: "The main body of the show notes including takeaways. DO NOT include the CTA here."
    },
    spotifyCTA: {
      type: Type.STRING,
      description: "The specific Call to Action question for the comments."
    },
    spotifyPollQuestion: {
      type: Type.STRING,
      description: "A engaging question/title for the Spotify Poll based on the sermon topic."
    },
    spotifyPollOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5 options for a listener poll related to the sermon topic."
    },
    biblicalReferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of biblical references (Book Chapter:Verse)."
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 10-15 SEO keywords."
    },
    marketingHooks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 short promotional sentences."
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
    Contexto: ${input.title} por ${input.preacherName}. Link: ${input.youtubeUrl}.

    Aja como um especialista em SEO/PSO para podcasts evangélicos no Spotify. Use a transcrição inferida da pregação (baseada no tema, pregador e link) para gerar metadados otimizados para ranqueamento e descoberta.
    
    ATENÇÃO: Como você não pode assistir ao vídeo diretamente, utilize sua base de conhecimento sobre este pregador e temas bíblicos para inferir o conteúdo mais provável e estruturar a resposta.

    Tarefas de Geração de Conteúdo:

    1. Momentos Chaves (Vídeo):
       Identifique 3 a 5 momentos chaves para cortes (Reels/Shorts). 
       IMPORTANTE: Estime o TIMESTAMP (ex: 10:00) onde esse assunto provavelmente ocorre em uma pregação típica.

    2. Títulos de Episódio (Otimizados): 
       Crie 3 opções. O título deve ser conciso e focar em: Ação + Benefício + Keyword primária.

    3. Descrição Otimizada (Show Notes):
       - Snippet SEO (Máx 120 chars): Crie a primeira frase mais envolvente possível. Deve conter a Keyword primária.
       - Corpo da Descrição: Desenvolva o resumo, incluindo o nome do pregador. Liste os 3-5 principais takeaways em bullet points.
       - Chamada para Ação (CTA): Crie uma pergunta engajadora para o ouvinte responder nos comentários.

    4. Enquete Spotify:
       - Crie um Título (Pergunta) engajador para a enquete.
       - Crie 5 opções de resposta para a enquete sobre o tema.

    5. Referências Bíblicas: 
       Liste todas as referências bíblicas prováveis citadas nesta pregação.

    6. Gere tags SEO e frases curtas de marketing.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7,
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

export const generateSermonImages = async (
  imageBase64: string, 
  mimeType: string,
  title: string, 
  preacher: string
): Promise<GeneratedImages> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  // Helper function to generate one image
  const generateImage = async (promptText: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: imageBase64, mimeType: mimeType } },
            { text: promptText },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      console.warn("Image generation returned no data. Candidate:", response.candidates?.[0]);
      throw new Error("Failed to generate image");
    } catch (e) {
      console.error("Detailed Image Gen Error:", e);
      throw e;
    }
  };

  // Revised prompts: Focus on EDITING/ENHANCING rather than "Extracting/Generating from scratch"
  // which can trigger safety filters about generating people.

  const thumbnailPrompt = `
    Edit this image to create a professional YouTube Thumbnail.
    1. Keep the person in the image visible and prominent on the right side.
    2. Change the background to a dark, modern, abstract gradient (Deep Blue/Purple tones).
    3. Add the text "${title}" on the left side in big, bold, white font.
    4. Make it look high-contrast and cinematic.
  `;

  const coverPrompt = `
    Edit this image to create a square Podcast Cover Art.
    1. Center the person's face in a square 1:1 frame.
    2. Change the background to a clean, solid or gradient color.
    3. Add the text "${title}" clearly at the bottom or top.
    4. Ensure high legibility and professional finish.
  `;

  // Execute prompts in parallel
  const [thumbnail16_9, artwork1_1] = await Promise.all([
    generateImage(thumbnailPrompt),
    generateImage(coverPrompt)
  ]);

  return { thumbnail16_9, artwork1_1 };
};
