import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockSignInWithGoogle = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
  }),
}));

import { Login } from '@/pages/Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithGoogle.mockResolvedValue(undefined);
  });

  it('renders the login page with sign-in button', () => {
    renderLogin();
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar com google/i })).toBeInTheDocument();
  });

  it('renders branding section with feature list', () => {
    renderLogin();
    expect(screen.getByText('Churchify')).toBeInTheDocument();
    expect(screen.getByText(/transforme cultos em conteúdo/i)).toBeInTheDocument();
  });

  it('calls signInWithGoogle when button is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /continuar com google/i }));

    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });

  it('shows error message when sign-in fails', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('OAuth error'));
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /continuar com google/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/falha ao conectar com google/i)).toBeInTheDocument();
  });

  it('shows terms and privacy links', () => {
    renderLogin();
    expect(screen.getByText('Termos de Servico')).toBeInTheDocument();
    expect(screen.getByText('Politica de Privacidade')).toBeInTheDocument();
  });
});
