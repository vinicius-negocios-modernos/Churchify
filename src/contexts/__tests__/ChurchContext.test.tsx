import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { MemberChurch } from '@/services/memberService';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetUserChurches = vi.fn();
const mockGetMemberRole = vi.fn();

vi.mock('@/services/memberService', () => ({
  getUserChurches: (...args: unknown[]) => mockGetUserChurches(...args),
  getMemberRole: (...args: unknown[]) => mockGetMemberRole(...args),
}));

const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Import AFTER mocks are set up
import { ChurchProvider, useChurch } from '@/contexts/ChurchContext';

// ─── Test data ──────────────────────────────────────────────────────────────

const mockUser = { id: 'user-uuid-1' };

const sampleChurchA: MemberChurch = {
  id: 'member-uuid-1',
  church_id: 'church-uuid-1',
  user_id: 'user-uuid-1',
  role: 'admin',
  joined_at: '2026-01-01T00:00:00Z',
  invited_by: null,
  invited_email: null,
  status: 'active',
  updated_at: '2026-01-01T00:00:00Z',
  churches: {
    id: 'church-uuid-1',
    name: 'Grace Church',
    plan: 'free',
    logo_url: null,
    created_by: 'user-uuid-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
};

const sampleChurchB: MemberChurch = {
  id: 'member-uuid-2',
  church_id: 'church-uuid-2',
  user_id: 'user-uuid-1',
  role: 'viewer',
  joined_at: '2026-02-01T00:00:00Z',
  invited_by: null,
  invited_email: null,
  status: 'active',
  updated_at: '2026-02-01T00:00:00Z',
  churches: {
    id: 'church-uuid-2',
    name: 'Hope Church',
    plan: 'pro',
    logo_url: null,
    created_by: 'user-uuid-2',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
};

// ─── Helper component ───────────────────────────────────────────────────────

function ChurchConsumer() {
  const { currentChurch, currentRole, userChurches, loading, setCurrentChurch } = useChurch();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="church-name">{currentChurch?.name ?? 'none'}</span>
      <span data-testid="role">{currentRole ?? 'none'}</span>
      <span data-testid="church-count">{userChurches.length}</span>
      <button onClick={() => setCurrentChurch('church-uuid-2')}>Switch</button>
    </div>
  );
}

describe('ChurchContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockGetUserChurches.mockResolvedValue([sampleChurchA, sampleChurchB]);
    mockGetMemberRole.mockResolvedValue('admin');
  });

  it('loads user churches on mount', async () => {
    render(
      <ChurchProvider>
        <ChurchConsumer />
      </ChurchProvider>,
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('church-count').textContent).toBe('2');
    expect(mockGetUserChurches).toHaveBeenCalledWith('user-uuid-1');
  });

  it('returns current church and role', async () => {
    render(
      <ChurchProvider>
        <ChurchConsumer />
      </ChurchProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByTestId('church-name').textContent).toBe('Grace Church');
    expect(screen.getByTestId('role').textContent).toBe('admin');
  });

  it('auto-selects first church when no localStorage value', async () => {
    render(
      <ChurchProvider>
        <ChurchConsumer />
      </ChurchProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // First church (sampleChurchA) should be auto-selected
    expect(screen.getByTestId('church-name').textContent).toBe('Grace Church');
    expect(mockGetMemberRole).toHaveBeenCalledWith('church-uuid-1', 'user-uuid-1');
  });

  it('restores selection from localStorage', async () => {
    localStorage.setItem('churchify_current_church', 'church-uuid-2');
    mockGetMemberRole.mockResolvedValue('viewer');

    render(
      <ChurchProvider>
        <ChurchConsumer />
      </ChurchProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByTestId('church-name').textContent).toBe('Hope Church');
    expect(screen.getByTestId('role').textContent).toBe('viewer');
    expect(mockGetMemberRole).toHaveBeenCalledWith('church-uuid-2', 'user-uuid-1');
  });

  it('setCurrentChurch updates selection and persists to localStorage', async () => {
    mockGetMemberRole.mockResolvedValueOnce('admin').mockResolvedValueOnce('viewer');

    render(
      <ChurchProvider>
        <ChurchConsumer />
      </ChurchProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByTestId('church-name').textContent).toBe('Grace Church');

    // Switch to church B
    await act(async () => {
      screen.getByRole('button', { name: 'Switch' }).click();
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByTestId('church-name').textContent).toBe('Hope Church');
    expect(localStorage.getItem('churchify_current_church')).toBe('church-uuid-2');
  });

  it('clears state when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(
      <ChurchProvider>
        <ChurchConsumer />
      </ChurchProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('church-name').textContent).toBe('none');
    expect(screen.getByTestId('role').textContent).toBe('none');
    expect(screen.getByTestId('church-count').textContent).toBe('0');
    expect(mockGetUserChurches).not.toHaveBeenCalled();
  });

  it('useChurch throws when used outside ChurchProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ChurchConsumer />)).toThrow(
      'useChurch must be used within a ChurchProvider',
    );

    consoleSpy.mockRestore();
  });
});
