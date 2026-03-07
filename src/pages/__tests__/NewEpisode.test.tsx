import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewEpisode } from '../NewEpisode';

// Mock geminiService
const mockAnalyze = vi.fn();
const mockGenerateImages = vi.fn();
vi.mock('@/services/geminiService', () => ({
  analyzeSermonContent: (...args: unknown[]) => mockAnalyze(...args),
  generateSermonImages: (...args: unknown[]) => mockGenerateImages(...args),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock episodeService
vi.mock('@/services/episodeService', () => ({
  createEpisode: vi.fn().mockResolvedValue({ id: 'test-ep-1' }),
  updateEpisode: vi.fn().mockResolvedValue({}),
}));

// Mock storageService
vi.mock('@/services/storageService', () => ({
  uploadEpisodeImage: vi.fn().mockResolvedValue('https://example.com/image.png'),
}));

// Mock dashboardEvents
vi.mock('@/lib/dashboardEvents', () => ({
  emitDashboardRefresh: vi.fn(),
}));

const fillAndSubmitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/link do vídeo/i), 'https://youtube.com/watch?v=dQw4w9WgXcQ');
  await user.type(screen.getByLabelText(/nome do pregador/i), 'Pr. Teste');
  await user.type(screen.getByLabelText(/título da pregação/i), 'Titulo Teste');
  await user.click(screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }));
};

describe('NewEpisode - Retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('shows retry button when API fails', async () => {
    mockAnalyze.mockRejectedValueOnce(new Error('API Error'));
    const user = userEvent.setup();
    render(<NewEpisode />);

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });
    expect(screen.getByText(/ocorreu um erro/i)).toBeInTheDocument();
  });

  it('preserves form data after error (fields remain filled)', async () => {
    mockAnalyze.mockRejectedValueOnce(new Error('API Error'));
    const user = userEvent.setup();
    render(<NewEpisode />);

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    // Form fields should still have their values (AC5)
    expect(screen.getByLabelText(/link do vídeo/i)).toHaveValue('https://youtube.com/watch?v=dQw4w9WgXcQ');
    expect(screen.getByLabelText(/nome do pregador/i)).toHaveValue('Pr. Teste');
    expect(screen.getByLabelText(/título da pregação/i)).toHaveValue('Titulo Teste');
  });

  it('retry re-submits with preserved form data', async () => {
    mockAnalyze
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        keyMoments: [],
        spotifyTitles: [],
        spotifyDescriptionSnippet: '',
        spotifyDescriptionBody: '',
        spotifyCTA: '',
        spotifyPollQuestion: '',
        spotifyPollOptions: [],
        biblicalReferences: [],
        tags: [],
        marketingHooks: [],
      });

    const user = userEvent.setup();
    render(<NewEpisode />);

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    // Click retry
    await user.click(screen.getByTestId('retry-button'));

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledTimes(2);
    });

    // Verify retry was called with the same data
    expect(mockAnalyze).toHaveBeenLastCalledWith(
      expect.objectContaining({
        youtubeUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        preacherName: 'Pr. Teste',
        title: 'Titulo Teste',
      })
    );
  });

  it('shows stepper during processing', async () => {
    // Make analyze hang (never resolves during this test)
    mockAnalyze.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<NewEpisode />);

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(screen.getByTestId('ai-processing-stepper')).toBeInTheDocument();
    });
    expect(screen.getByText('Analisando sermao')).toBeInTheDocument();
  });
});

describe('NewEpisode - Transcript Meta', () => {
  const analysisWithTranscript = {
    keyMoments: [],
    spotifyTitles: ['T1'],
    spotifyDescriptionSnippet: 'Snippet',
    spotifyDescriptionBody: 'Body',
    spotifyCTA: 'CTA',
    spotifyPollQuestion: 'Poll?',
    spotifyPollOptions: ['A', 'B'],
    biblicalReferences: ['John 3:16'],
    tags: ['faith'],
    marketingHooks: ['Hook'],
    _transcriptMeta: {
      hasTranscript: true,
      transcript: 'Full transcript...',
      language: 'pt',
    },
  };

  const analysisWithoutTranscript = {
    ...analysisWithTranscript,
    _transcriptMeta: {
      hasTranscript: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('shows green transcript status when transcript is available', async () => {
    mockAnalyze.mockResolvedValueOnce(analysisWithTranscript);
    const user = userEvent.setup();
    render(<NewEpisode />);

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(screen.getByTestId('transcript-status')).toBeInTheDocument();
    });

    const status = screen.getByTestId('transcript-status');
    expect(status).toHaveTextContent(/transcricao extraida/i);
    expect(status.className).toContain('bg-green-50');
  });

  it('shows amber transcript status when transcript is not available', async () => {
    mockAnalyze.mockResolvedValueOnce(analysisWithoutTranscript);
    const user = userEvent.setup();
    render(<NewEpisode />);

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(screen.getByTestId('transcript-status')).toBeInTheDocument();
    });

    const status = screen.getByTestId('transcript-status');
    expect(status).toHaveTextContent(/nao disponivel/i);
    expect(status.className).toContain('bg-amber-50');
  });

  it('does not show transcript status when _transcriptMeta is absent', async () => {
    const analysisNoMeta = { ...analysisWithTranscript };
    delete (analysisNoMeta as Record<string, unknown>)._transcriptMeta;
    mockAnalyze.mockResolvedValueOnce(analysisNoMeta);
    const user = userEvent.setup();
    render(<NewEpisode />);

    await fillAndSubmitForm(user);

    await waitFor(() => {
      // Results should be displayed (meaning analysis completed)
      expect(screen.getByText('T1')).toBeInTheDocument();
    });

    // transcript-status should NOT be present
    expect(screen.queryByTestId('transcript-status')).not.toBeInTheDocument();
  });
});
