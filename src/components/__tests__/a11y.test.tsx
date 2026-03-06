import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Augment vitest Assertion with axe matchers
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// Extend expect with axe matchers
beforeAll(() => {
  expect.extend(matchers);
});

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock Supabase
vi.mock('@/lib/supabase', () =>
  import('@/test/mocks/supabase').then((m) => m.supabaseLibMock),
);

// Mock AuthContext
const mockUser = {
  id: 'test-uid-123',
  email: 'testuser@church.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/photo.jpg',
  },
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    session: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock ChurchContext
vi.mock('@/contexts/ChurchContext', () => ({
  useChurch: vi.fn(() => ({
    currentChurch: { id: 'church-1', name: 'Test Church', plan: 'free' },
    currentRole: 'admin',
    userChurches: [],
    setCurrentChurch: vi.fn(),
    loading: false,
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock useDashboardData for Dashboard
vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: vi.fn(() => ({
    stats: { totalEpisodes: 5, episodesThisMonth: 2, lastProcessedAt: '2026-03-01T10:00:00Z' },
    recentEpisodes: [
      {
        id: 'ep-1',
        church_id: 'church-1',
        title: 'Sunday Sermon',
        youtube_url: null,
        sermon_date: '2026-03-01',
        status: 'completed',
        analysis_result: null,
        created_by: 'test-uid-123',
        created_at: '2026-03-01T10:00:00Z',
        updated_at: '2026-03-01T10:00:00Z',
      },
    ],
    church: { name: 'Test Church', plan: 'free' },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// Mock dashboardEvents
vi.mock('@/lib/dashboardEvents', () => ({
  onDashboardRefresh: vi.fn(() => vi.fn()),
}));

// Mock memberService (used by ChurchSwitcher)
vi.mock('@/services/memberService', () => ({
  getUserChurches: vi.fn().mockResolvedValue([]),
  getMemberRole: vi.fn().mockResolvedValue('admin'),
}));

// ─── Component imports (after mocks) ────────────────────────────────────────

import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { SermonForm } from '@/components/SermonForm';
import { Layout } from '@/components/Layout';

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Accessibility (axe)', () => {
  it('Login page has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Dashboard has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SermonForm has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <SermonForm onSubmit={vi.fn()} isLoading={false} />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Skip-to-content link', () => {
  it('skip-to-content link exists and targets #main-content', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    const skipLink = container.querySelector('a[href="#main-content"]');
    expect(skipLink).not.toBeNull();
    expect(skipLink).toHaveTextContent(/skip to main content/i);
  });

  it('main content has id="main-content"', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    const mainContent = container.querySelector('#main-content');
    expect(mainContent).not.toBeNull();
    expect(mainContent?.tagName.toLowerCase()).toBe('main');
  });
});
