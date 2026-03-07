import { render, screen } from '@testing-library/react';
import { ResultsDisplay } from '../ResultsDisplay';
import type { AnalysisResult } from '@/types';

// Mock useClipboard
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copy: vi.fn().mockResolvedValue(true) }),
}));

const baseResult: AnalysisResult = {
  keyMoments: [
    {
      title: 'Opening Prayer',
      timestamp: '00:00 - 02:00',
      reasoning: 'Emotional opening',
      hook: 'This prayer changed everything',
      estimatedContext: 'Pastor opens with heartfelt prayer',
    },
  ],
  spotifyTitles: ['Title 1', 'Title 2', 'Title 3'],
  spotifyDescriptionSnippet: 'A powerful sermon about faith.',
  spotifyDescriptionBody: 'In this sermon, Pastor...',
  spotifyCTA: 'What moment spoke to you?',
  spotifyPollQuestion: 'Which topic resonated most?',
  spotifyPollOptions: ['Faith', 'Hope', 'Love', 'Grace', 'Mercy'],
  biblicalReferences: ['John 3:16', 'Romans 8:28'],
  tags: ['faith', 'sermon', 'church'],
  marketingHooks: ['A sermon you cannot miss', 'Faith in action', 'Grace revealed'],
};

describe('ResultsDisplay — Transcript Indicator', () => {
  it('shows green transcript-based indicator when hasTranscript is true', () => {
    const result: AnalysisResult = {
      ...baseResult,
      _transcriptMeta: {
        hasTranscript: true,
        transcript: 'Full transcript text...',
        language: 'pt',
      },
    };

    render(<ResultsDisplay result={result} episodeTitle="Test" />);

    const indicator = screen.getByTestId('analysis-source-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent(/transcricao real/i);
    expect(indicator.className).toContain('bg-green-100');
  });

  it('shows amber title-based indicator when hasTranscript is false', () => {
    const result: AnalysisResult = {
      ...baseResult,
      _transcriptMeta: {
        hasTranscript: false,
      },
    };

    render(<ResultsDisplay result={result} episodeTitle="Test" />);

    const indicator = screen.getByTestId('analysis-source-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent(/titulo/i);
    expect(indicator.className).toContain('bg-amber-100');
  });

  it('shows amber indicator when _transcriptMeta is undefined (backwards compatible)', () => {
    const result: AnalysisResult = {
      ...baseResult,
      // No _transcriptMeta — old API response
    };

    render(<ResultsDisplay result={result} episodeTitle="Test" />);

    const indicator = screen.getByTestId('analysis-source-indicator');
    expect(indicator).toBeInTheDocument();
    // When undefined, hasTranscript is falsy so amber indicator shows
    expect(indicator).toHaveTextContent(/titulo/i);
    expect(indicator.className).toContain('bg-amber-100');
  });

  it('renders all core result sections regardless of transcript status', () => {
    render(<ResultsDisplay result={baseResult} episodeTitle="Test" />);

    // Spotify titles
    expect(screen.getByText('Title 1')).toBeInTheDocument();
    expect(screen.getByText('Title 2')).toBeInTheDocument();

    // Key moments
    expect(screen.getByText('Opening Prayer')).toBeInTheDocument();

    // Tags
    expect(screen.getByText('#faith')).toBeInTheDocument();

    // Marketing hooks
    expect(screen.getByText(/sermon you cannot miss/i)).toBeInTheDocument();
  });
});
