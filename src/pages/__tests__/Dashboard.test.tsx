import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockUseDashboardData = vi.fn();

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => mockUseDashboardData(),
}));

import { Dashboard } from '@/pages/Dashboard';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    mockUseDashboardData.mockReturnValue({
      stats: { totalEpisodes: 0, episodesThisMonth: 0, lastProcessedAt: null },
      recentEpisodes: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const refetch = vi.fn();
    mockUseDashboardData.mockReturnValue({
      stats: { totalEpisodes: 0, episodesThisMonth: 0, lastProcessedAt: null },
      recentEpisodes: [],
      loading: false,
      error: 'Failed to load',
      refetch,
    });

    renderDashboard();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('shows empty state when no episodes', () => {
    mockUseDashboardData.mockReturnValue({
      stats: { totalEpisodes: 0, episodesThisMonth: 0, lastProcessedAt: null },
      recentEpisodes: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();
    // EmptyState component should render
    expect(screen.queryByText('Visao Geral')).not.toBeInTheDocument();
  });

  it('renders dashboard with stats and episodes', () => {
    mockUseDashboardData.mockReturnValue({
      stats: {
        totalEpisodes: 5,
        episodesThisMonth: 2,
        lastProcessedAt: new Date().toISOString(),
      },
      recentEpisodes: [
        {
          id: 'ep-1',
          title: 'Sermon on the Mount',
          status: 'completed',
          created_at: '2026-03-01T00:00:00Z',
          sermon_date: null,
        },
        {
          id: 'ep-2',
          title: 'Grace and Peace',
          status: 'processing',
          created_at: '2026-03-05T00:00:00Z',
          sermon_date: '2026-03-05T00:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();
    expect(screen.getByText('Visao Geral')).toBeInTheDocument();
    expect(screen.getByText('Sermon on the Mount')).toBeInTheDocument();
    expect(screen.getByText('Grace and Peace')).toBeInTheDocument();
    expect(screen.getByText('Concluido')).toBeInTheDocument();
    expect(screen.getByText('Processando')).toBeInTheDocument();
  });

  it('shows relative date for recent episodes', () => {
    const today = new Date().toISOString();
    mockUseDashboardData.mockReturnValue({
      stats: {
        totalEpisodes: 1,
        episodesThisMonth: 1,
        lastProcessedAt: today,
      },
      recentEpisodes: [
        {
          id: 'ep-1',
          title: 'Today Sermon',
          status: 'completed',
          created_at: today,
          sermon_date: null,
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('handles episode with unknown status gracefully', () => {
    mockUseDashboardData.mockReturnValue({
      stats: {
        totalEpisodes: 1,
        episodesThisMonth: 1,
        lastProcessedAt: null,
      },
      recentEpisodes: [
        {
          id: 'ep-1',
          title: 'Unknown Status',
          status: 'unknown_status',
          created_at: '2026-01-01T00:00:00Z',
          sermon_date: null,
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();
    // Falls back to "draft" config
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows Nenhum when lastProcessedAt is null', () => {
    mockUseDashboardData.mockReturnValue({
      stats: {
        totalEpisodes: 1,
        episodesThisMonth: 0,
        lastProcessedAt: null,
      },
      recentEpisodes: [
        {
          id: 'ep-1',
          title: 'Test',
          status: 'draft',
          created_at: '2026-01-01T00:00:00Z',
          sermon_date: null,
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();
    expect(screen.getByText('Nenhum')).toBeInTheDocument();
  });
});
