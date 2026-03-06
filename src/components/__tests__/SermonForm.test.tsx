import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SermonForm } from '../SermonForm';
import fixture from '@/test/fixtures/sermon-form-input.json';

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
});
