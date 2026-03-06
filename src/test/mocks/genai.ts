/**
 * Mock for @google/genai module.
 *
 * Usage in tests:
 *   import { mockGenerateContent } from '@/test/mocks/genai';
 *   vi.mock('@google/genai', () => import('@/test/mocks/genai').then(m => m.genaiMock));
 *
 *   // Override per-test:
 *   mockGenerateContent.mockResolvedValueOnce({ text: '{"custom":"data"}' });
 */
import { vi } from 'vitest';
import sermonAnalysisResponse from '@/test/fixtures/sermon-analysis-response.json';

// Controllable mock for generateContent — returns realistic golden response by default
export const mockGenerateContent = vi.fn().mockResolvedValue({
  text: JSON.stringify(sermonAnalysisResponse),
  candidates: [
    {
      content: {
        parts: [{ text: JSON.stringify(sermonAnalysisResponse) }],
      },
    },
  ],
});

// Controllable mock for image generation
export const mockGenerateContentImage = vi.fn().mockResolvedValue({
  text: null,
  candidates: [
    {
      content: {
        parts: [
          {
            inlineData: {
              data: 'bW9ja19iYXNlNjRfaW1hZ2VfZGF0YQ==', // "mock_base64_image_data"
              mimeType: 'image/png',
            },
          },
        ],
      },
    },
  ],
});

// Internal router: pick correct mock based on model name
const generateContentRouter = vi.fn().mockImplementation((opts: Record<string, unknown>) => {
  const model = opts.model as string | undefined;
  if (model && model.includes('image')) {
    return mockGenerateContentImage(opts);
  }
  return mockGenerateContent(opts);
});

// Mock GoogleGenAI class matching actual usage: new GoogleGenAI({ apiKey }) -> ai.models.generateContent(...)
const MockGoogleGenAI = vi.fn().mockImplementation(() => ({
  models: {
    generateContent: generateContentRouter,
  },
}));

// Re-export enum stubs used in geminiService.ts
const Type = {
  OBJECT: 'OBJECT',
  ARRAY: 'ARRAY',
  STRING: 'STRING',
};

const Modality = {
  IMAGE: 'IMAGE',
};

// Full module mock — use with vi.mock('@google/genai', () => ...)
export const genaiMock = {
  GoogleGenAI: MockGoogleGenAI,
  Type,
  Schema: {},
  Modality,
};

export { MockGoogleGenAI, Type, Modality };
