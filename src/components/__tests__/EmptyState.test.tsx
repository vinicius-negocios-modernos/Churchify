import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '../EmptyState';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <EmptyState />
    </MemoryRouter>,
  );
}

describe('EmptyState', () => {
  it('renders the heading', () => {
    renderWithRouter();
    expect(screen.getByText('Nenhum episodio ainda')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    renderWithRouter();
    expect(
      screen.getByText(/Crie seu primeiro episodio para comecar/),
    ).toBeInTheDocument();
  });

  it('renders CTA button linking to /new-episode', () => {
    renderWithRouter();
    const link = screen.getByRole('link', { name: /Criar Primeiro Episodio/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/new-episode');
  });

  it('renders the microphone illustration icon', () => {
    renderWithRouter();
    // The Mic2 icon is inside a decorative div with bg-indigo-50
    const container = document.querySelector('.bg-indigo-50');
    expect(container).toBeInTheDocument();
  });
});
