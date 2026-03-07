/**
 * E2E Test 1: Login -> Dashboard -> New Episode -> Submit -> See Results
 * Story 1.17, Task 3 (AC3)
 */
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth';
import { mockEpisodeRoutes, MOCK_ANALYSIS_RESULT } from './helpers/mock-data';

test.describe('Login to Results Flow', () => {
  test('login page loads and shows sign-in button', async ({ page }) => {
    await page.goto('/login');

    // Verify the login page renders with the Google sign-in button
    await expect(page.getByText('Continuar com Google')).toBeVisible();
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible();
    await expect(
      page.getByText('Faca login para gerenciar o conteudo da sua igreja.'),
    ).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');

    // Should redirect to /login since there is no session
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated user sees dashboard with stats', async ({ page }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);

    await page.goto('/');

    // Wait for dashboard to load
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Verify stat cards are present
    await expect(page.getByText('Total de Episodios')).toBeVisible();
    await expect(page.getByText('Episodios Este Mes')).toBeVisible();
    await expect(page.getByText('Ultimo Processamento')).toBeVisible();

    // Verify recent episodes section
    await expect(page.getByText('Episodios Recentes')).toBeVisible();
  });

  test('full flow: dashboard -> new episode -> submit -> see results', async ({
    page,
  }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);

    // Step 1: Navigate to dashboard
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Step 2: Navigate to New Episode page via sidebar
    await page.getByRole('link', { name: 'Novo Episodio' }).first().click();
    await expect(page).toHaveURL(/\/new-episode/);
    await expect(page.getByText('Nova Analise')).toBeVisible();

    // Step 3: Fill the form
    await page.fill('#youtubeUrl', 'https://www.youtube.com/watch?v=test123');
    await page.fill('#preacherName', 'Pastor Carlos');
    await page.fill('#title', 'Vencendo Gigantes pela Fe');

    // Step 4: Submit the form
    await page.getByRole('button', { name: /Analisar Video e Gerar Conteudo/i }).click();

    // Step 5: Wait for results to display (mock edge function responds instantly)
    // Check for Spotify section header
    await expect(
      page.getByText('Otimizacao para Spotify (SEO/PSO)', { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify title options are shown
    await expect(
      page.getByText(MOCK_ANALYSIS_RESULT.spotifyTitles[0]),
    ).toBeVisible();

    // Verify key moments section
    await expect(page.getByText('Momentos Chaves')).toBeVisible();
    await expect(
      page.getByText(MOCK_ANALYSIS_RESULT.keyMoments[0].title),
    ).toBeVisible();

    // Verify marketing hooks section
    await expect(page.getByText('Calls to Action')).toBeVisible();

    // Verify tags
    for (const tag of MOCK_ANALYSIS_RESULT.tags.slice(0, 3)) {
      await expect(page.getByText(`#${tag}`)).toBeVisible();
    }
  });

  test('form validation prevents submission with empty fields', async ({
    page,
  }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);

    await page.goto('/new-episode');
    await expect(page.getByText('Nova Analise')).toBeVisible({ timeout: 10_000 });

    // Try to submit empty form
    await page.getByRole('button', { name: /Analisar Video e Gerar Conteudo/i }).click();

    // Should show validation errors
    await expect(page.getByText('O link do video e obrigatorio.')).toBeVisible();
    await expect(
      page.getByText('O nome do pregador e obrigatorio.'),
    ).toBeVisible();
    await expect(
      page.getByText('O titulo da pregacao e obrigatorio.'),
    ).toBeVisible();
  });
});
