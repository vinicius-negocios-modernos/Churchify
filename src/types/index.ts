
export interface SermonInput {
  youtubeUrl: string;
  preacherName: string;
  title: string;
  thumbnailFile?: File | null;
}

export interface KeyMoment {
  title: string;
  timestamp: string;
  reasoning: string;
  hook: string;
  estimatedContext: string;
}

export interface GeneratedImages {
  thumbnail16_9: string; // Base64 data
  artwork1_1: string;    // Base64 data
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
}
