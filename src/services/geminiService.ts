import { supabase } from '@/lib/supabase';
import { SermonInput, AnalysisResult, GeneratedImages } from '@/types';

/**
 * Calls the Supabase Edge Function `generate-content` which proxies
 * requests to the Gemini API with server-side key protection and rate limiting.
 */
async function invokeGenerateContent<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body,
  });

  if (error) {
    // FunctionsHttpError contains the response body with our error message
    const errorMessage = error.message || 'Failed to call AI service';
    throw new Error(errorMessage);
  }

  return data as T;
}

export const analyzeSermonContent = async (input: SermonInput): Promise<AnalysisResult> => {
  try {
    const result = await invokeGenerateContent<AnalysisResult>({
      action: 'analyze',
      title: input.title,
      preacherName: input.preacherName,
      youtubeUrl: input.youtubeUrl,
    });

    return result;
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw error;
  }
};

export const generateSermonImages = async (
  imageBase64: string,
  mimeType: string,
  title: string,
  _preacher: string,
): Promise<GeneratedImages> => {
  try {
    const result = await invokeGenerateContent<GeneratedImages>({
      action: 'generateImages',
      imageBase64,
      mimeType,
      title,
    });

    return result;
  } catch (error) {
    console.error('Error generating images:', error);
    throw error;
  }
};
