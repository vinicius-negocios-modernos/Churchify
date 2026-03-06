import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseChurch = vi.fn();

vi.mock('@/contexts/ChurchContext', () => ({
  useChurch: () => mockUseChurch(),
}));

import { ChurchSwitcher } from '@/components/ChurchSwitcher';

const makeChurch = (id: string, name: string, plan: string) => ({
  id,
  name,
  plan,
  logo_url: null,
  created_by: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const makeMember = (churchId: string, name: string, plan: string) => ({
  id: `member-${churchId}`,
  church_id: churchId,
  user_id: 'user-1',
  role: 'admin',
  joined_at: '2026-01-01T00:00:00Z',
  invited_by: null,
  invited_email: null,
  status: 'active',
  updated_at: '2026-01-01T00:00:00Z',
  churches: makeChurch(churchId, name, plan),
});

describe('ChurchSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when loading', () => {
    mockUseChurch.mockReturnValue({
      currentChurch: null,
      userChurches: [],
      setCurrentChurch: vi.fn(),
      loading: true,
    });

    const { container } = render(<ChurchSwitcher />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when no churches', () => {
    mockUseChurch.mockReturnValue({
      currentChurch: null,
      userChurches: [],
      setCurrentChurch: vi.fn(),
      loading: false,
    });

    const { container } = render(<ChurchSwitcher />);
    expect(container.innerHTML).toBe('');
  });

  it('displays single church info without select dropdown', () => {
    const church = makeChurch('c-1', 'Grace Church', 'pro');
    mockUseChurch.mockReturnValue({
      currentChurch: church,
      userChurches: [makeMember('c-1', 'Grace Church', 'pro')],
      setCurrentChurch: vi.fn(),
      loading: false,
    });

    render(<ChurchSwitcher />);

    expect(screen.getByText('Grace Church')).toBeInTheDocument();
    expect(screen.getByText('Plano pro')).toBeInTheDocument();
    // Should NOT have a select trigger
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows select dropdown when multiple churches exist', () => {
    const churchA = makeChurch('c-1', 'Grace Church', 'free');
    mockUseChurch.mockReturnValue({
      currentChurch: churchA,
      userChurches: [
        makeMember('c-1', 'Grace Church', 'free'),
        makeMember('c-2', 'Hope Church', 'pro'),
      ],
      setCurrentChurch: vi.fn(),
      loading: false,
    });

    render(<ChurchSwitcher />);

    // Should have a select trigger (combobox)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // Plan label under the switcher
    expect(screen.getByText('Plano free')).toBeInTheDocument();
  });

  it('handles null churches in member gracefully (single church)', () => {
    mockUseChurch.mockReturnValue({
      currentChurch: null,
      userChurches: [{ ...makeMember('c-1', 'Grace', 'free'), churches: null }],
      setCurrentChurch: vi.fn(),
      loading: false,
    });

    const { container } = render(<ChurchSwitcher />);
    // Should return null because church is null
    expect(container.innerHTML).toBe('');
  });

  it('shows default plan as Free when plan is null', () => {
    const church = makeChurch('c-1', 'My Church', 'free');
    church.plan = null as unknown as string;
    mockUseChurch.mockReturnValue({
      currentChurch: church,
      userChurches: [{ ...makeMember('c-1', 'My Church', 'free'), churches: { ...church, plan: null } }],
      setCurrentChurch: vi.fn(),
      loading: false,
    });

    render(<ChurchSwitcher />);
    expect(screen.getByText('Plano Free')).toBeInTheDocument();
  });
});
