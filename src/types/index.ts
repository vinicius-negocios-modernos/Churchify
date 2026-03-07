
export interface SermonInput {
  youtubeUrl: string;
  preacherName: string;
  title: string;
  thumbnailFile?: File | null;
  churchId?: string;
  transcript?: string;
}

export interface KeyMoment {
  title: string;
  timestamp: string;
  reasoning: string;
  hook: string;
  estimatedContext: string;
}

export interface GeneratedImages {
  thumbnail16_9: string; // Storage URL (preferred) or base64 data URI (fallback)
  artwork1_1: string;    // Storage URL (preferred) or base64 data URI (fallback)
}

export interface TranscriptMeta {
  hasTranscript: boolean;
  transcript?: string;
  language?: string;
}

export interface AnalysisResult {
  keyMoments: KeyMoment[];
  spotifyTitles: string[];
  spotifyDescriptionSnippet: string;
  spotifyDescriptionBody: string;
  spotifyCTA: string;
  spotifyPollQuestion: string; // New field for Poll Question
  spotifyPollOptions: string[];
  biblicalReferences: string[];
  tags: string[];
  marketingHooks: string[];
  generatedImages?: GeneratedImages; // New optional field for images
  _transcriptMeta?: TranscriptMeta; // Transcript metadata from Edge Function
}
