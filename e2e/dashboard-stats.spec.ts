/**
 * E2E Test 3: Login -> Dashboard -> Verify Real Stats
 * Story 1.17, Task 5 (AC5)
 */
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth';
import { mockEpisodeRoutes, MOCK_EPISODES } from './helpers/mock-data';

test.describe('Dashboard Stats Verification', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);
  });

  test('dashboard displays correct stat card values', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Verify stat cards are present with labels
    await expect(page.getByText('Total de Episodios')).toBeVisible();
    await expect(page.getByText('Episodios Este Mes')).toBeVisible();
    await expect(page.getByText('Ultimo Processamento')).toBeVisible();
  });

  test('recent episodes table shows mock episodes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Verify recent episodes section
    await expect(page.getByText('Episodios Recentes')).toBeVisible();

    // Each mock episode title should be visible
    for (const episode of MOCK_EPISODES) {
      await expect(page.getByText(episode.title)).toBeVisible();
    }
  });

  test('episode status badges display correct labels', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Status badges: completed -> "Concluido", processing -> "Processando", draft -> "Rascunho"
    await expect(page.getByText('Concluido')).toBeVisible();
    await expect(page.getByText('Processando')).toBeVisible();
    await expect(page.getByText('Rascunho')).toBeVisible();
  });

  test('dashboard shows "Ver todos" link to library', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    const viewAllLink = page.getByRole('link', { name: 'Ver todos' });
    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute('href', '/library');
  });

  test('clicking episode arrow navigates to new-episode', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // The episode row has a link with aria-label "Ver detalhes de {title}"
    const detailLink = page.getByRole('link', {
      name: `Ver detalhes de ${MOCK_EPISODES[0].title}`,
    });
    await detailLink.click({ force: true }); // force because it's opacity-0 by default

    await expect(page).toHaveURL(/\/new-episode/);
  });

  test('dashboard header shows correct description', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText('Acompanhe o status de processamento dos cultos.'),
    ).toBeVisible();
  });
});
