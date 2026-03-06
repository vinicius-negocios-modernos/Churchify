import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SermonForm } from '../SermonForm';
import fixture from '@/test/fixtures/sermon-form-input.json';

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('SermonForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<SermonForm {...defaultProps} />);

    expect(screen.getByLabelText(/link do vídeo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nome do pregador/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/título da pregação/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
    ).toBeInTheDocument();
  });

  it('allows filling form fields', async () => {
    const user = userEvent.setup();
    render(<SermonForm {...defaultProps} />);

    const urlInput = screen.getByLabelText(/link do vídeo/i);
    const preacherInput = screen.getByLabelText(/nome do pregador/i);
    const titleInput = screen.getByLabelText(/título da pregação/i);

    await user.type(urlInput, fixture.youtubeUrl);
    await user.type(preacherInput, fixture.preacherName);
    await user.type(titleInput, fixture.title);

    expect(urlInput).toHaveValue(fixture.youtubeUrl);
    expect(preacherInput).toHaveValue(fixture.preacherName);
    expect(titleInput).toHaveValue(fixture.title);
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SermonForm onSubmit={onSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText(/link do vídeo/i), fixture.youtubeUrl);
    await user.type(screen.getByLabelText(/nome do pregador/i), fixture.preacherName);
    await user.type(screen.getByLabelText(/título da pregação/i), fixture.title);

    await user.click(
      screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      youtubeUrl: fixture.youtubeUrl,
      preacherName: fixture.preacherName,
      title: fixture.title,
      thumbnailFile: null,
    });
  });

  it('disables submit button when loading', () => {
    render(<SermonForm onSubmit={defaultProps.onSubmit} isLoading={true} />);

    const button = screen.getByRole('button', { name: /processando/i });
    expect(button).toBeDisabled();
  });

  // --- Task 8: Inline validation tests ---

  describe('inline form validation', () => {
    it('shows inline error when all fields are empty on submit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<SermonForm onSubmit={onSubmit} isLoading={false} />);

      await user.click(
        screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
      );

      expect(onSubmit).not.toHaveBeenCalled();

      // Inline errors should be visible
      expect(screen.getByText('O link do vídeo é obrigatório.')).toBeInTheDocument();
      expect(screen.getByText('O nome do pregador é obrigatório.')).toBeInTheDocument();
      expect(screen.getByText('O título da pregação é obrigatório.')).toBeInTheDocument();
    });

    it('sets aria-invalid on fields with errors', async () => {
      const user = userEvent.setup();
      render(<SermonForm onSubmit={vi.fn()} isLoading={false} />);

      await user.click(
        screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
      );

      const urlInput = screen.getByLabelText(/link do vídeo/i);
      const preacherInput = screen.getByLabelText(/nome do pregador/i);
      const titleInput = screen.getByLabelText(/título da pregação/i);

      expect(urlInput).toHaveAttribute('aria-invalid', 'true');
      expect(preacherInput).toHaveAttribute('aria-invalid', 'true');
      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-describedby linking to error messages', async () => {
      const user = userEvent.setup();
      render(<SermonForm onSubmit={vi.fn()} isLoading={false} />);

      await user.click(
        screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
      );

      const urlInput = screen.getByLabelText(/link do vídeo/i);
      expect(urlInput).toHaveAttribute('aria-describedby', 'youtubeUrl-error');

      const errorEl = document.getElementById('youtubeUrl-error');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('O link do vídeo é obrigatório.');
    });

    it('clears error when user starts typing in a field', async () => {
      const user = userEvent.setup();
      render(<SermonForm onSubmit={vi.fn()} isLoading={false} />);

      // Trigger validation
      await user.click(
        screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
      );

      expect(screen.getByText('O link do vídeo é obrigatório.')).toBeInTheDocument();

      // Type in the URL field
      const urlInput = screen.getByLabelText(/link do vídeo/i);
      await user.type(urlInput, 'h');

      // Error should be cleared
      expect(screen.queryByText('O link do vídeo é obrigatório.')).not.toBeInTheDocument();
      expect(urlInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows error only for the missing field', async () => {
      const user = userEvent.setup();
      render(<SermonForm onSubmit={vi.fn()} isLoading={false} />);

      // Fill two fields, leave title empty
      await user.type(screen.getByLabelText(/link do vídeo/i), fixture.youtubeUrl);
      await user.type(screen.getByLabelText(/nome do pregador/i), fixture.preacherName);

      await user.click(
        screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
      );

      expect(screen.queryByText('O link do vídeo é obrigatório.')).not.toBeInTheDocument();
      expect(screen.queryByText('O nome do pregador é obrigatório.')).not.toBeInTheDocument();
      expect(screen.getByText('O título da pregação é obrigatório.')).toBeInTheDocument();
    });

    it('does not call alert() — uses inline errors instead', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const user = userEvent.setup();
      render(<SermonForm onSubmit={vi.fn()} isLoading={false} />);

      await user.click(
        screen.getByRole('button', { name: /analisar vídeo e gerar conteúdo/i }),
      );

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('file upload validation', () => {
    it('rejects files larger than 10MB via toast', async () => {
      const user = userEvent.setup();
      render(<SermonForm {...defaultProps} />);

      // Create a file > 10MB
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'huge-image.png',
        { type: 'image/png' },
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, largeFile);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Arquivo muito grande',
        }),
      );
    });

    it('accepts files within 10MB limit', async () => {
      const user = userEvent.setup();
      render(<SermonForm {...defaultProps} />);

      const validFile = new File(['image-content'], 'photo.png', {
        type: 'image/png',
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, validFile);

      expect(mockToast).not.toHaveBeenCalled();
      // The filename should appear in the form
      await waitFor(() => {
        expect(screen.getByText('photo.png')).toBeInTheDocument();
      });
    });
  });

  describe('drag and drop upload', () => {
    it('renders a drop zone with accessible role', () => {
      render(<SermonForm {...defaultProps} />);

      const dropZone = screen.getByRole('button', {
        name: /área de upload/i,
      });
      expect(dropZone).toBeInTheDocument();
    });
  });
});
