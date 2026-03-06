import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  mockSession,
  mockGetSession,
  mockSignInWithOAuth,
  mockSignOut,
  simulateAuthStateChange,
} from '@/test/mocks/supabase';

vi.mock('@supabase/supabase-js', () => import('@/test/mocks/supabase').then((m) => m.supabaseJsMock));
vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then((m) => m.supabaseLibMock));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';

/** Helper component that exposes context values for testing */
function AuthConsumer() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.user_metadata?.full_name : 'none'}</span>
      <button onClick={signInWithGoogle}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext (Supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('renders children when auth is ready', async () => {
    render(
      <AuthProvider>
        <span>child content</span>
      </AuthProvider>,
    );

    // Wait for getSession to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('starts in loading state and resolves to no user', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for getSession
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('provides user when session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  it('updates user on auth state change (SIGNED_IN)', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId('user').textContent).toBe('none');

    // Simulate sign-in via onAuthStateChange callback
    act(() => {
      simulateAuthStateChange('SIGNED_IN', mockSession);
    });

    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  it('login calls signInWithOAuth with google provider', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  });

  it('login throws when signInWithOAuth returns error', async () => {
    const oauthError = { message: 'OAuth provider not configured' };
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { url: null, provider: 'google' },
      error: oauthError,
    });

    // Render a consumer that captures the error
    let caughtError: unknown = null;
    function ErrorCapturingConsumer() {
      const { signInWithGoogle } = useAuth();
      return (
        <button
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch (e) {
              caughtError = e;
            }
          }}
        >
          Login
        </button>
      );
    }

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <ErrorCapturingConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(caughtError).toEqual(oauthError);
  });

  it('logout calls signOut', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId('user').textContent).toBe('Test User');

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('clears user on SIGNED_OUT event', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId('user').textContent).toBe('Test User');

    // Simulate sign-out
    act(() => {
      simulateAuthStateChange('SIGNED_OUT', null);
    });

    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('useAuth throws when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );

    consoleSpy.mockRestore();
  });
});
