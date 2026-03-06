/**
 * Mock for @supabase/supabase-js and src/lib/supabase.ts
 *
 * Usage in tests:
 *   vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then(m => m.supabaseLibMock));
 */
import { vi } from 'vitest';

// ─── Mock User ──────────────────────────────────────────────────────────────

export const mockSupabaseUser = {
  id: 'test-uid-123',
  email: 'testuser@church.com',
  app_metadata: { provider: 'google' },
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/photo.jpg',
  },
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockSupabaseUser,
};

// ─── Auth method mocks ──────────────────────────────────────────────────────

export const mockGetSession = vi.fn().mockResolvedValue({
  data: { session: null },
  error: null,
});

export const mockSignInWithOAuth = vi.fn().mockResolvedValue({
  data: { url: 'https://accounts.google.com/oauth', provider: 'google' },
  error: null,
});

export const mockSignOut = vi.fn().mockResolvedValue({ error: null });

// Stores the callback so tests can trigger auth state changes
let authStateCallback: ((event: string, session: typeof mockSession | null) => void) | null = null;

export const mockOnAuthStateChange = vi.fn().mockImplementation((callback) => {
  authStateCallback = callback;
  return {
    data: {
      subscription: {
        id: 'mock-subscription-id',
        unsubscribe: vi.fn(),
      },
    },
  };
});

/**
 * Helper: simulate an auth state change from tests.
 * Call after rendering the AuthProvider.
 */
export function simulateAuthStateChange(
  event: string,
  session: typeof mockSession | null,
) {
  if (authStateCallback) {
    authStateCallback(event, session);
  }
}

// ─── Supabase client mock ───────────────────────────────────────────────────

export const mockSupabaseClient = {
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    signInWithOAuth: mockSignInWithOAuth,
    signOut: mockSignOut,
  },
};

// ─── Module-level mocks (for vi.mock) ───────────────────────────────────────

/** vi.mock('@/lib/supabase', () => supabaseLibMock) */
export const supabaseLibMock = {
  supabase: mockSupabaseClient,
};

/** vi.mock('@supabase/supabase-js', () => supabaseJsMock) */
export const supabaseJsMock = {
  createClient: vi.fn().mockReturnValue(mockSupabaseClient),
};
