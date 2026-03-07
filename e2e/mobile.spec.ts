/**
 * E2E Test 4: Mobile — Sidebar navigation, form submission, copy-to-clipboard
 * Story 1.17, Task 6 (AC6)
 *
 * Runs only on the 'mobile-chrome' project (Pixel 5 viewport).
 */
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth';
import { mockEpisodeRoutes, MOCK_ANALYSIS_RESULT } from './helpers/mock-data';

// Only run on mobile viewport
test.describe('Mobile Experience', () => {
  test.skip(({ browserName }, testInfo) => {
    return testInfo.project.name !== 'mobile-chrome';
  }, 'Mobile-only tests — skipped on desktop projects');

  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);
  });

  test('mobile header shows hamburger menu button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // The mobile header should show the hamburger menu button
    const menuButton = page.getByRole('button', { name: 'Abrir menu' });
    await expect(menuButton).toBeVisible();
  });

  test('sidebar opens and closes via Sheet component', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Open the sidebar
    const menuButton = page.getByRole('button', { name: 'Abrir menu' });
    await menuButton.click();

    // Verify sidebar content is visible (Sheet opens)
    await expect(page.getByText('Menu de navegacao')).toBeAttached();

    // Sidebar nav links should be visible
    await expect(
      page.locator('[data-state="open"]').getByRole('link', { name: 'Dashboard' }),
    ).toBeVisible();
    await expect(
      page.locator('[data-state="open"]').getByRole('link', { name: /Novo Epis/i }),
    ).toBeVisible();
    await expect(
      page.locator('[data-state="open"]').getByRole('link', { name: 'Biblioteca' }),
    ).toBeVisible();

    // Close the sidebar by clicking the close button (Sheet provides one)
    const closeButton = page.locator('[data-state="open"]').getByRole('button', { name: /close/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Fallback: press Escape to close Sheet
      await page.keyboard.press('Escape');
    }

    // Sidebar should be closed — the nav links inside the sheet should not be visible
    await expect(
      page.locator('[data-state="open"]'),
    ).not.toBeAttached({ timeout: 3_000 });
  });

  test('sidebar navigation works on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Open sidebar
    await page.getByRole('button', { name: 'Abrir menu' }).click();

    // Navigate to "Novo Episodio" via sidebar
    const newEpisodeLink = page
      .locator('[data-state="open"]')
      .getByRole('link', { name: /Novo Epis/i });
    await newEpisodeLink.click();

    // Should navigate and close sidebar
    await expect(page).toHaveURL(/\/new-episode/);
    await expect(page.getByText('Nova Analise')).toBeVisible({ timeout: 10_000 });

    // Open sidebar again and navigate to Biblioteca
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const libraryLink = page
      .locator('[data-state="open"]')
      .getByRole('link', { name: 'Biblioteca' });
    await libraryLink.click();

    await expect(page).toHaveURL(/\/library/);
  });

  test('form submission works on mobile viewport', async ({ page }) => {
    await page.goto('/new-episode');
    await expect(page.getByText('Nova Analise')).toBeVisible({ timeout: 10_000 });

    // Fill form fields
    await page.fill('#youtubeUrl', 'https://www.youtube.com/watch?v=mobile123');
    await page.fill('#preacherName', 'Pastor Mobile');
    await page.fill('#title', 'Mobile Sermon Test');

    // Submit
    await page.getByRole('button', { name: /Analisar Video e Gerar Conteudo/i }).click();

    // Wait for results
    await expect(
      page.getByText('Otimizacao para Spotify (SEO/PSO)', { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify results render correctly on mobile
    await expect(
      page.getByText(MOCK_ANALYSIS_RESULT.spotifyTitles[0]),
    ).toBeVisible();
    await expect(page.getByText('Momentos Chaves')).toBeVisible();
  });

  test('copy-to-clipboard works on mobile', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/new-episode');
    await expect(page.getByText('Nova Analise')).toBeVisible({ timeout: 10_000 });

    // Fill and submit form to get results
    await page.fill('#youtubeUrl', 'https://www.youtube.com/watch?v=clipboard123');
    await page.fill('#preacherName', 'Pastor Clipboard');
    await page.fill('#title', 'Clipboard Test Sermon');

    await page.getByRole('button', { name: /Analisar Video e Gerar Conteudo/i }).click();

    // Wait for results
    await expect(
      page.getByText('Otimizacao para Spotify (SEO/PSO)', { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    // Click the "Copiar Descricao Pronta" button
    const copyButton = page.getByRole('button', {
      name: /Copiar Descri.*o Pronta/i,
    });
    await copyButton.click();

    // The button should show a check icon or confirmation state
    // The component uses a Check icon after copying — verify it appears
    await expect(copyButton.locator('svg')).toBeVisible();

    // Verify clipboard content via the page context
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain(
      MOCK_ANALYSIS_RESULT.spotifyDescriptionSnippet,
    );
  });

  test('mobile layout shows Churchify branding in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // The mobile header should show the Churchify brand
    const header = page.locator('header');
    await expect(header.getByText('Churchify')).toBeVisible();
  });
});
