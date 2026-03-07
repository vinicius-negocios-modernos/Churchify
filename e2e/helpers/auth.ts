import { Page } from '@playwright/test';

const SUPABASE_URL = 'https://dlhkosrnyhccvgvxkvip.supabase.co';
const AUTH_STORAGE_KEY = 'sb-dlhkosrnyhccvgvxkvip-auth-token';

export const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'authenticated',
  aud: 'authenticated',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { full_name: 'Test User', avatar_url: '' },
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const MOCK_SESSION = {
  access_token: 'test-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'test-refresh',
  user: MOCK_USER,
};

/**
 * Sets up auth mocking for E2E tests by:
 * 1. Intercepting Supabase auth API calls
 * 2. Injecting a mock session into localStorage
 * 3. Intercepting church-related DB queries
 */
export async function mockAuth(page: Page): Promise<void> {
  // Intercept Supabase auth token endpoint (getSession, refreshSession)
  await page.route(`${SUPABASE_URL}/auth/v1/token*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SESSION),
    });
  });

  // Intercept Supabase auth user endpoint
  await page.route(`${SUPABASE_URL}/auth/v1/user*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  // Intercept getSession call (GoTrue uses /auth/v1/token?grant_type=...)
  // Also handle the initial session check via cookie/localStorage
  await page.route(`${SUPABASE_URL}/auth/v1/logout*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  // Intercept church_members query (getUserChurches)
  await page.route(`${SUPABASE_URL}/rest/v1/church_members*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'member-1',
          user_id: MOCK_USER.id,
          church_id: 'church-1',
          role: 'admin',
          churches: {
            id: 'church-1',
            name: 'Test Church',
            slug: 'test-church',
            created_at: '2026-01-01T00:00:00.000Z',
          },
        },
      ]),
    });
  });

  // Inject auth session into localStorage before navigating
  await page.addInitScript(
    ({ storageKey, session }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    },
    { storageKey: AUTH_STORAGE_KEY, session: MOCK_SESSION },
  );
}
