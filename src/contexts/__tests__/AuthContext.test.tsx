import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  mockUser,
  mockOnAuthStateChanged,
  mockSignInWithPopup,
  mockSignOut,
  MockGoogleAuthProvider as _MockGoogleAuthProvider,
} from '@/test/mocks/firebase';

vi.mock('firebase/app', () => import('@/test/mocks/firebase').then((m) => m.firebaseAppMock));
vi.mock('firebase/auth', () => import('@/test/mocks/firebase').then((m) => m.firebaseAuthMock));
vi.mock('@/lib/firebase', () => import('@/test/mocks/firebase').then((m) => m.firebaseLibMock));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';

/** Helper component that exposes context values for testing */
function AuthConsumer() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.displayName : 'none'}</span>
      <button onClick={signInWithGoogle}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when auth is ready', async () => {
    // Mock onAuthStateChanged to resolve with null (no user)
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
      setTimeout(() => callback(null), 0);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <span>child content</span>
      </AuthProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('provides user after login', async () => {
    // Mock onAuthStateChanged to resolve with mockUser
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: typeof mockUser) => void) => {
      setTimeout(() => callback(mockUser), 0);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for onAuthStateChanged callback
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  it('login calls signInWithPopup', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
      setTimeout(() => callback(null), 0);
      return vi.fn();
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

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
  });

  it('logout calls signOut', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: typeof mockUser) => void) => {
      setTimeout(() => callback(mockUser), 0);
      return vi.fn();
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

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
