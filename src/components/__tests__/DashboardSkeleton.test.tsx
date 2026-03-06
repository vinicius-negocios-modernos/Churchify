import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders with the dashboard-skeleton test id', () => {
    render(<DashboardSkeleton />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders 3 stat card skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    // The grid with 3 stat cards
    const gridItems = container.querySelectorAll('.grid.grid-cols-1 > div');
    expect(gridItems).toHaveLength(3);
  });

  it('renders 3 episode row skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    // The divide-y container has 3 items
    const episodeRows = container.querySelectorAll('.divide-y > div');
    expect(episodeRows).toHaveLength(3);
  });
});
