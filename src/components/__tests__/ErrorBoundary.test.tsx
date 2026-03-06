import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ResultsErrorBoundary } from '@/components/ResultsErrorBoundary';

// Suppress console.error noise from React error boundary logs
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('ErrorBoundary') || msg.includes('The above error')) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// Component that throws on render
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test render error');
  return <div>Content rendered OK</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('shows default fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Test render error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('reload button calls window.location.reload', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    const button = screen.getByRole('button', { name: /tentar novamente/i });
    await userEvent.click(button);
    expect(reloadMock).toHaveBeenCalledOnce();
  });
});

describe('ResultsErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ResultsErrorBoundary>
        <div>Results content</div>
      </ResultsErrorBoundary>,
    );
    expect(screen.getByText('Results content')).toBeInTheDocument();
  });

  it('shows results-specific fallback when child throws', () => {
    render(
      <ResultsErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ResultsErrorBoundary>,
    );
    expect(screen.getByText('Falha ao exibir conteudo gerado')).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', async () => {
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) throw new Error('Conditional error');
      return <div>Recovered content</div>;
    }

    const { rerender } = render(
      <ResultsErrorBoundary>
        <ConditionalThrower />
      </ResultsErrorBoundary>,
    );

    expect(screen.getByText('Falha ao exibir conteudo gerado')).toBeInTheDocument();

    // Fix the error condition before clicking retry
    shouldThrow = false;

    const retryBtn = screen.getByRole('button', { name: /tentar novamente/i });
    await userEvent.click(retryBtn);

    // After reset, it should re-render children
    rerender(
      <ResultsErrorBoundary>
        <ConditionalThrower />
      </ResultsErrorBoundary>,
    );

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
