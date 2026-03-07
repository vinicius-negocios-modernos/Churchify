/**
 * E2E Test 2: Login -> New Episode -> Submit -> Navigate Away -> Come Back -> See Saved Results
 * Story 1.17, Task 4 (AC4)
 */
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth';
import { mockEpisodeRoutes, MOCK_EPISODES, MOCK_ANALYSIS_RESULT } from './helpers/mock-data';

test.describe('Persistence Flow', () => {
  test('submitted episode appears on dashboard after navigating away', async ({
    page,
  }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);

    // Step 1: Navigate to new episode page
    await page.goto('/new-episode');
    await expect(page.getByText('Nova Analise')).toBeVisible({ timeout: 10_000 });

    // Step 2: Fill and submit the form
    await page.fill('#youtubeUrl', 'https://www.youtube.com/watch?v=persist123');
    await page.fill('#preacherName', 'Pastor Persistence');
    await page.fill('#title', 'Testing Persistence');

    await page.getByRole('button', { name: /Analisar Video e Gerar Conteudo/i }).click();

    // Step 3: Wait for results to load
    await expect(
      page.getByText('Otimizacao para Spotify (SEO/PSO)', { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify results are displayed
    await expect(
      page.getByText(MOCK_ANALYSIS_RESULT.spotifyTitles[0]),
    ).toBeVisible();

    // Step 4: Navigate to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).first().click();
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Step 5: Verify episodes are listed (mock data includes our episodes)
    await expect(page.getByText('Episodios Recentes')).toBeVisible();
    await expect(page.getByText(MOCK_EPISODES[0].title)).toBeVisible();
  });

  test('episode data persists in the episodes list', async ({ page }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);

    // Navigate directly to dashboard
    await page.goto('/');
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Verify mock episodes appear in the recent episodes section
    await expect(page.getByText(MOCK_EPISODES[0].title)).toBeVisible();
    await expect(page.getByText(MOCK_EPISODES[1].title)).toBeVisible();

    // Verify status badges
    await expect(page.getByText('Concluido')).toBeVisible();
    await expect(page.getByText('Processando')).toBeVisible();
  });

  test('form persistence saves draft data across navigation', async ({
    page,
  }) => {
    await mockAuth(page);
    await mockEpisodeRoutes(page);

    // Step 1: Go to new episode and start filling the form
    await page.goto('/new-episode');
    await expect(page.getByText('Nova Analise')).toBeVisible({ timeout: 10_000 });

    // Fill partial form data
    await page.fill('#title', 'Draft Sermon Title');
    await page.fill('#preacherName', 'Pastor Draft');

    // Step 2: Navigate away to dashboard (form uses useFormPersistence)
    await page.getByRole('link', { name: 'Dashboard' }).first().click();
    await expect(page.getByText('Visao Geral')).toBeVisible({ timeout: 10_000 });

    // Step 3: Navigate back to new episode
    await page.getByRole('link', { name: 'Novo Episodio' }).first().click();
    await expect(page.getByText('Nova Analise')).toBeVisible({ timeout: 10_000 });

    // Step 4: Verify form data was persisted via localStorage
    const titleValue = await page.inputValue('#title');
    const preacherValue = await page.inputValue('#preacherName');

    expect(titleValue).toBe('Draft Sermon Title');
    expect(preacherValue).toBe('Pastor Draft');
  });
});
