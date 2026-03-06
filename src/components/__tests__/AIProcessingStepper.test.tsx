import { render, screen } from '@testing-library/react';
import { AIProcessingStepper } from '../AIProcessingStepper';

describe('AIProcessingStepper', () => {
  it('does not render when status is idle', () => {
    const { container } = render(
      <AIProcessingStepper currentStep={0} status="idle" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders stepper when status is processing', () => {
    render(<AIProcessingStepper currentStep={0} status="processing" />);
    expect(screen.getByTestId('ai-processing-stepper')).toBeInTheDocument();
  });

  it('shows three step labels', () => {
    render(<AIProcessingStepper currentStep={0} status="processing" />);
    expect(screen.getByText('Analisando sermao')).toBeInTheDocument();
    expect(screen.getByText('Gerando conteudo')).toBeInTheDocument();
    expect(screen.getByText('Finalizando')).toBeInTheDocument();
  });

  it('shows progress percentage during processing step 0', () => {
    render(<AIProcessingStepper currentStep={0} status="processing" />);
    // step 0, processing: 0 + (33.3 * 0.5) ≈ 17%
    expect(screen.getByText('17%')).toBeInTheDocument();
  });

  it('shows 100% when completed', () => {
    render(<AIProcessingStepper currentStep={2} status="completed" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    // Text appears both visibly and in sr-only aria-live region
    expect(screen.getAllByText('Processamento concluido!')).toHaveLength(2);
  });

  it('shows error message when status is error', () => {
    render(<AIProcessingStepper currentStep={0} status="error" />);
    // Text appears both visibly and in sr-only aria-live region
    expect(screen.getAllByText('Erro na etapa: Analisando sermao')).toHaveLength(2);
  });

  it('advances progress percentage for step 1', () => {
    render(<AIProcessingStepper currentStep={1} status="processing" />);
    // step 1, processing: 33.3 + (33.3 * 0.5) ≈ 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('includes aria-live polite region for screen readers', () => {
    render(<AIProcessingStepper currentStep={0} status="processing" />);
    const liveRegions = screen.getAllByText('Analisando sermao...');
    // One is visible, one is in the sr-only aria-live region
    const srOnly = liveRegions.find(el => el.closest('[aria-live="polite"]'));
    expect(srOnly).toBeTruthy();
    expect(srOnly!.closest('[aria-live="polite"]')).toHaveAttribute('aria-live', 'polite');
  });

  it('transitions from processing to completed state', () => {
    const { rerender } = render(
      <AIProcessingStepper currentStep={0} status="processing" />
    );
    expect(screen.getAllByText('Analisando sermao...')).toHaveLength(2);

    rerender(<AIProcessingStepper currentStep={2} status="completed" />);
    expect(screen.getAllByText('Processamento concluido!')).toHaveLength(2);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('transitions from processing to error state', () => {
    const { rerender } = render(
      <AIProcessingStepper currentStep={0} status="processing" />
    );

    rerender(<AIProcessingStepper currentStep={1} status="error" />);
    expect(screen.getAllByText('Erro na etapa: Gerando conteudo')).toHaveLength(2);
  });
});
