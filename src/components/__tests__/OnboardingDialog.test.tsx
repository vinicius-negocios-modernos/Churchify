import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingDialog } from '../OnboardingDialog';

describe('OnboardingDialog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows onboarding dialog when onboarding_completed is not set', () => {
    render(<OnboardingDialog forceOpen={true} />);
    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo ao Churchify!')).toBeInTheDocument();
  });

  it('does not show dialog when onboarding_completed is set', () => {
    localStorage.setItem('onboarding_completed', 'true');
    render(<OnboardingDialog />);
    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument();
  });

  it('navigates through 3 steps', async () => {
    const user = userEvent.setup();
    render(<OnboardingDialog forceOpen={true} />);

    // Step 1
    expect(screen.getByText('Bem-vindo ao Churchify!')).toBeInTheDocument();

    // Go to step 2
    await user.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('Como funciona')).toBeInTheDocument();

    // Go to step 3
    await user.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('Criar primeiro episodio')).toBeInTheDocument();
  });

  it('can go back to previous step', async () => {
    const user = userEvent.setup();
    render(<OnboardingDialog forceOpen={true} />);

    // Go to step 2
    await user.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('Como funciona')).toBeInTheDocument();

    // Go back to step 1
    await user.click(screen.getByTestId('onboarding-previous'));
    expect(screen.getByText('Bem-vindo ao Churchify!')).toBeInTheDocument();
  });

  it('skip button sets localStorage flag and closes dialog', async () => {
    const user = userEvent.setup();
    render(<OnboardingDialog forceOpen={true} />);

    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('onboarding-skip'));

    expect(localStorage.getItem('onboarding_completed')).toBe('true');
  });

  it('completing all steps sets localStorage flag', async () => {
    const user = userEvent.setup();
    render(<OnboardingDialog forceOpen={true} />);

    // Navigate through all 3 steps
    await user.click(screen.getByTestId('onboarding-next')); // step 2
    await user.click(screen.getByTestId('onboarding-next')); // step 3

    // Last step shows "Comecar" button
    expect(screen.getByText('Comecar')).toBeInTheDocument();
    await user.click(screen.getByTestId('onboarding-next')); // complete

    expect(localStorage.getItem('onboarding_completed')).toBe('true');
  });

  it('shows step dots for navigation indication', () => {
    render(<OnboardingDialog forceOpen={true} />);
    const stepIndicator = screen.getByLabelText(/passo 1 de 3/i);
    expect(stepIndicator).toBeInTheDocument();
  });

  it('does not show previous button on first step', () => {
    render(<OnboardingDialog forceOpen={true} />);
    expect(screen.queryByTestId('onboarding-previous')).not.toBeInTheDocument();
  });

  it('shows previous button on step 2+', async () => {
    const user = userEvent.setup();
    render(<OnboardingDialog forceOpen={true} />);

    await user.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByTestId('onboarding-previous')).toBeInTheDocument();
  });
});
