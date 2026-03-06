import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders the label', () => {
    render(
      <StatCard icon={<span data-testid="icon">I</span>} label="Total" value={42} />,
    );
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders a numeric value', () => {
    render(
      <StatCard icon={<span>I</span>} label="Episodios" value={15} />,
    );
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders a string value', () => {
    render(
      <StatCard icon={<span>I</span>} label="Ultimo" value="Hoje" />,
    );
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(
      <StatCard icon={<span data-testid="stat-icon">IC</span>} label="Test" value={0} />,
    );
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('renders zero value correctly', () => {
    render(
      <StatCard icon={<span>I</span>} label="Empty" value={0} />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
