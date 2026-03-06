import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LibraryPage } from '@/pages/LibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';

const withRouter = (component: React.ReactNode) => (
  <MemoryRouter>{component}</MemoryRouter>
);

describe('LibraryPage', () => {
  it('renders the library placeholder', () => {
    render(withRouter(<LibraryPage />));
    expect(screen.getByText('Biblioteca')).toBeInTheDocument();
    expect(screen.getByText('Em desenvolvimento')).toBeInTheDocument();
  });
});

describe('SettingsPage', () => {
  it('renders the settings placeholder', () => {
    render(withRouter(<SettingsPage />));
    expect(screen.getByText('Configuracoes')).toBeInTheDocument();
    expect(screen.getByText('Em desenvolvimento')).toBeInTheDocument();
  });
});

describe('TermsPage', () => {
  it('renders the terms of service page', () => {
    render(withRouter(<TermsPage />));
    expect(screen.getByText('Termos de Servico')).toBeInTheDocument();
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });
});

describe('PrivacyPage', () => {
  it('renders the privacy policy page', () => {
    render(withRouter(<PrivacyPage />));
    expect(screen.getByText('Politica de Privacidade')).toBeInTheDocument();
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });
});
