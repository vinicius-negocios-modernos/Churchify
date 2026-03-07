import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configuration ──────────────────────────────────────────────────────────

const RATE_LIMIT_MAX_CALLS_PER_DAY = 50;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface GenerateContentRequest {
  action: "analyze" | "generateImages";
  // For analyze
  title?: string;
  preacherName?: string;
  youtubeUrl?: string;
  transcript?: string;
  // For generateImages
  imageBase64?: string;
  mimeType?: string;
}

// ─── YouTube Transcript Extraction ──────────────────────────────────────────

function extractVideoId(url: string): string | null {
  const pattern =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

async function extractTranscript(
  videoUrl: string
): Promise<{ transcript: string; language: string } | null> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;

  try {
    // Fetch YouTube page to get caption tracks
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    const html = await response.text();

    // Extract captions data from ytInitialPlayerResponse
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) return null;

    let captionTracks: Array<{
      languageCode: string;
      kind?: string;
      baseUrl?: string;
    }>;
    try {
      captionTracks = JSON.parse(captionMatch[1]);
    } catch {
      return null;
    }

    // Prefer Portuguese, then auto-generated Portuguese, then first available
    const ptTrack =
      captionTracks.find((t) => t.languageCode === "pt" && !t.kind) ||
      captionTracks.find((t) => t.languageCode === "pt") ||
      captionTracks.find((t) => t.languageCode === "pt-BR") ||
      captionTracks[0];

    if (!ptTrack?.baseUrl) return null;

    // Fetch caption XML
    const captionResponse = await fetch(ptTrack.baseUrl);
    const captionXml = await captionResponse.text();

    // Parse XML to extract text (simple regex for timedtext XML)
    const textSegments =
      captionXml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
    const transcript = textSegments
      .map((seg) => {
        const textMatch = seg.match(/<text[^>]*>(.*?)<\/text>/s);
        return textMatch
          ? textMatch[1]
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\n/g, " ")
              .trim()
          : "";
      })
      .filter(Boolean)
      .join(" ");

    if (!transcript) return null;

    return { transcript, language: ptTrack.languageCode };
  } catch (error) {
    console.error("Transcript extraction failed:", error);
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function errorResponse(
  status: number,
  message: string,
  headers: Record<string, string> = corsHeaders
) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// ─── Analysis Schema (mirrors client-side schema) ───────────────────────────

const analysisSchema = {
  type: "OBJECT",
  properties: {
    keyMoments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: {
            type: "STRING",
            description:
              "A catchy title for this specific clip/moment",
          },
          timestamp: {
            type: "STRING",
            description:
              "The estimated timestamp (e.g., '04:30 - 05:45') where this likely happens",
          },
          reasoning: {
            type: "STRING",
            description: "Why this moment is likely to get high engagement",
          },
          hook: {
            type: "STRING",
            description: "A short caption hook for social media",
          },
          estimatedContext: {
            type: "STRING",
            description:
              "A brief summary of what likely happens in this segment",
          },
        },
        required: [
          "title",
          "timestamp",
          "reasoning",
          "hook",
          "estimatedContext",
        ],
      },
      description:
        "List of 3-5 viral potential moments found in the analysis with timestamps.",
    },
    spotifyTitles: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3 distinct SEO-optimized title options.",
    },
    spotifyDescriptionSnippet: {
      type: "STRING",
      description:
        "SEO Snippet (Max 120 chars) for the beginning of the description.",
    },
    spotifyDescriptionBody: {
      type: "STRING",
      description:
        "The main body of the show notes including takeaways. DO NOT include the CTA here.",
    },
    spotifyCTA: {
      type: "STRING",
      description:
        "The specific Call to Action question for the comments.",
    },
    spotifyPollQuestion: {
      type: "STRING",
      description:
        "A engaging question/title for the Spotify Poll based on the sermon topic.",
    },
    spotifyPollOptions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "5 options for a listener poll related to the sermon topic.",
    },
    biblicalReferences: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of biblical references (Book Chapter:Verse).",
    },
    tags: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of 10-15 SEO keywords.",
    },
    marketingHooks: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3 short promotional sentences.",
    },
  },
  required: [
    "keyMoments",
    "spotifyTitles",
    "spotifyDescriptionSnippet",
    "spotifyDescriptionBody",
    "spotifyCTA",
    "spotifyPollQuestion",
    "spotifyPollOptions",
    "biblicalReferences",
    "tags",
    "marketingHooks",
  ],
};

// ─── Main Handler ───────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    // ── 1. Verify JWT ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(401, "Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return errorResponse(500, "Server configuration error: missing API key");
    }

    // Create admin client to verify JWT and perform DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT by getting the user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return errorResponse(401, "Invalid or expired token");
    }

    // ── 2. Rate Limiting ───────────────────────────────────────────────
    const { count, error: countError } = await supabaseAdmin
      .from("api_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (countError) {
      console.error("Rate limit check error:", countError);
      return errorResponse(500, "Failed to check rate limit");
    }

    if ((count ?? 0) >= RATE_LIMIT_MAX_CALLS_PER_DAY) {
      return errorResponse(
        429,
        `Limite de uso atingido. Voce pode fazer ate ${RATE_LIMIT_MAX_CALLS_PER_DAY} chamadas por dia. Tente novamente amanha.`
      );
    }

    // ── 3. Parse Request Body ──────────────────────────────────────────
    const body: GenerateContentRequest = await req.json();

    if (!body.action) {
      return errorResponse(400, "Missing 'action' field. Use 'analyze' or 'generateImages'.");
    }

    let result: unknown;
    let model: string;
    let tokensUsed = 0;

    // ── 4. Call Gemini API ─────────────────────────────────────────────
    if (body.action === "analyze") {
      if (!body.title || !body.preacherName || !body.youtubeUrl) {
        return errorResponse(400, "Missing required fields: title, preacherName, youtubeUrl");
      }

      model = GEMINI_MODEL;

      // Try to extract transcript if not provided in request
      let transcriptText = body.transcript || null;
      let transcriptLang: string | null = null;

      if (!transcriptText && body.youtubeUrl) {
        console.log("Attempting transcript extraction for:", body.youtubeUrl);
        const extracted = await extractTranscript(body.youtubeUrl);
        if (extracted) {
          transcriptText = extracted.transcript;
          transcriptLang = extracted.language;
          console.log(
            `Transcript extracted: ${transcriptText.length} chars, lang: ${transcriptLang}`
          );
        } else {
          console.log("No transcript available, using fallback prompt");
        }
      }

      // Build prompt based on transcript availability
      const taskInstructions = `
        Tarefas de Geracao de Conteudo:

        1. Momentos Chaves (Video):
           Identifique 3 a 5 momentos chaves para cortes (Reels/Shorts).
           IMPORTANTE: ${transcriptText ? "Identifique o TIMESTAMP exato (ex: 10:00) onde cada momento ocorre na transcricao." : "Estime o TIMESTAMP (ex: 10:00) onde esse assunto provavelmente ocorre em uma pregacao tipica."}

        2. Titulos de Episodio (Otimizados):
           Crie 3 opcoes. O titulo deve ser conciso e focar em: Acao + Beneficio + Keyword primaria.

        3. Descricao Otimizada (Show Notes):
           - Snippet SEO (Max 120 chars): Crie a primeira frase mais envolvente possivel. Deve conter a Keyword primaria.
           - Corpo da Descricao: Desenvolva o resumo, incluindo o nome do pregador. Liste os 3-5 principais takeaways em bullet points.
           - Chamada para Acao (CTA): Crie uma pergunta engajadora para o ouvinte responder nos comentarios.

        4. Enquete Spotify:
           - Crie um Titulo (Pergunta) engajador para a enquete.
           - Crie 5 opcoes de resposta para a enquete sobre o tema.

        5. Referencias Biblicas:
           Liste todas as referencias biblicas ${transcriptText ? "citadas na transcricao" : "provaveis citadas nesta pregacao"}.

        6. Gere tags SEO e frases curtas de marketing.
      `;

      let prompt: string;

      if (transcriptText) {
        // Truncate transcript to ~30k chars to stay within Gemini context limits
        const maxTranscriptLength = 30000;
        const truncatedTranscript =
          transcriptText.length > maxTranscriptLength
            ? transcriptText.substring(0, maxTranscriptLength) +
              "\n\n[... transcricao truncada por limite de tamanho ...]"
            : transcriptText;

        prompt = `
          Voce e um especialista em SEO/PSO para podcasts evangelicos no Spotify.

          TRANSCRICAO COMPLETA DO SERMAO:
          ---
          ${truncatedTranscript}
          ---

          Com base na transcricao REAL do sermao "${body.title}" pregado por ${body.preacherName}, gere o seguinte conteudo otimizado para Spotify:

          ${taskInstructions}
        `;
      } else {
        prompt = `
          Voce e um especialista em SEO/PSO para podcasts evangelicos no Spotify.

          AVISO: Nao foi possivel obter a transcricao do video. A analise sera baseada apenas no titulo e informacoes do pregador.

          Titulo do sermao: "${body.title}"
          Pregador: ${body.preacherName}
          URL: ${body.youtubeUrl}

          Como voce nao tem acesso a transcricao, utilize sua base de conhecimento sobre este pregador e temas biblicos para inferir o conteudo mais provavel.

          ${taskInstructions}
        `;
      }

      const geminiResponse = await fetch(
        `${GEMINI_API_BASE}/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: analysisSchema,
              temperature: 0.7,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errBody = await geminiResponse.text();
        console.error("Gemini API error:", errBody);
        return errorResponse(502, "AI service temporarily unavailable");
      }

      const geminiData = await geminiResponse.json();
      const text =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return errorResponse(502, "No content generated from AI service");
      }

      const analysisResult = JSON.parse(text);

      // Include transcript metadata in the response
      result = {
        ...analysisResult,
        _transcriptMeta: transcriptText
          ? {
              hasTranscript: true,
              transcript: transcriptText,
              language: transcriptLang || "unknown",
            }
          : {
              hasTranscript: false,
            },
      };

      tokensUsed =
        geminiData.usageMetadata?.totalTokenCount ?? 0;

    } else if (body.action === "generateImages") {
      if (!body.imageBase64 || !body.mimeType || !body.title) {
        return errorResponse(400, "Missing required fields: imageBase64, mimeType, title");
      }

      model = GEMINI_IMAGE_MODEL;

      const thumbnailPrompt = `
        Edit this image to create a professional YouTube Thumbnail.
        1. Keep the person in the image visible and prominent on the right side.
        2. Change the background to a dark, modern, abstract gradient (Deep Blue/Purple tones).
        3. Add the text "${body.title}" on the left side in big, bold, white font.
        4. Make it look high-contrast and cinematic.
      `;

      const coverPrompt = `
        Edit this image to create a square Podcast Cover Art.
        1. Center the person's face in a square 1:1 frame.
        2. Change the background to a clean, solid or gradient color.
        3. Add the text "${body.title}" clearly at the bottom or top.
        4. Ensure high legibility and professional finish.
      `;

      const generateImage = async (promptText: string): Promise<string | null> => {
        const response = await fetch(
          `${GEMINI_API_BASE}/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        data: body.imageBase64,
                        mimeType: body.mimeType,
                      },
                    },
                    { text: promptText },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["IMAGE"],
              },
            }),
          }
        );

        if (!response.ok) {
          console.error("Gemini image error:", await response.text());
          return null;
        }

        const data = await response.json();
        const part = data.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
      };

      const [thumbnail16_9, artwork1_1] = await Promise.all([
        generateImage(thumbnailPrompt),
        generateImage(coverPrompt),
      ]);

      if (!thumbnail16_9 && !artwork1_1) {
        return errorResponse(502, "Failed to generate images from AI service");
      }

      result = {
        thumbnail16_9: thumbnail16_9 ?? "",
        artwork1_1: artwork1_1 ?? "",
      };
      tokensUsed = 0; // Image generation doesn't report token count in the same way

    } else {
      return errorResponse(400, `Unknown action: ${body.action}. Use 'analyze' or 'generateImages'.`);
    }

    // ── 5. Log Usage ───────────────────────────────────────────────────
    const { error: insertError } = await supabaseAdmin
      .from("api_usage")
      .insert({
        user_id: user.id,
        tokens_used: tokensUsed,
        model: model!,
        endpoint: body.action,
      });

    if (insertError) {
      console.error("Failed to log API usage:", insertError);
      // Non-blocking — still return the result
    }

    // ── 6. Return Result ───────────────────────────────────────────────
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge function error:", error);
    return errorResponse(500, "Internal server error");
  }
});
