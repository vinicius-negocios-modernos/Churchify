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

// ─── Query builder mock (for .from() chains) ───────────────────────────────

export interface MockQueryResult<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Creates a chainable mock query builder that mirrors the Supabase PostgREST API.
 * Each method returns the builder itself, except terminal methods (single) which
 * resolve via mockResult.
 *
 * Usage:
 *   mockFrom.mockResult = { data: [...], error: null };
 *   await supabase.from('table').select('*').eq('id', '123').single();
 */
export interface MockQueryBuilder {
  mockResult: MockQueryResult;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (
    onFulfilled?: ((value: MockQueryResult) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) => Promise<unknown>;
}

export function createMockQueryBuilder(): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    mockResult: { data: null, error: null },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    then: null!,
  };

  // Each chainable method returns the builder; terminal methods resolve mockResult
  const chainable: (keyof MockQueryBuilder)[] = ['select', 'insert', 'update', 'delete', 'eq', 'order'];
  for (const method of chainable) {
    (builder[method] as ReturnType<typeof vi.fn>).mockImplementation(() => builder);
  }

  // single() is a terminal — resolves to mockResult
  builder.single.mockImplementation(() => Promise.resolve(builder.mockResult));

  // Make the builder itself thenable so `await supabase.from('x').select('*')` works
  builder.then = (
    onFulfilled?: ((value: MockQueryResult) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) => Promise.resolve(builder.mockResult).then(onFulfilled, onRejected);

  return builder;
}

export const mockQueryBuilder = createMockQueryBuilder();

export const mockFrom = vi.fn().mockReturnValue(mockQueryBuilder);

// ─── Supabase client mock ───────────────────────────────────────────────────

export const mockSupabaseClient = {
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    signInWithOAuth: mockSignInWithOAuth,
    signOut: mockSignOut,
  },
  from: mockFrom,
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
