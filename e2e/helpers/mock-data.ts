import type { AnalysisResult } from '../../src/types';

const SUPABASE_URL = 'https://dlhkosrnyhccvgvxkvip.supabase.co';

export const MOCK_CHURCH = {
  id: 'church-1',
  name: 'Test Church',
  slug: 'test-church',
  created_at: '2026-01-01T00:00:00.000Z',
};

export const MOCK_EPISODES = [
  {
    id: 'ep-1',
    title: 'Test Sermon: Faith Over Fear',
    status: 'completed',
    created_at: '2026-03-01T10:00:00.000Z',
    sermon_date: '2026-03-01',
    preacher_name: 'Pastor Test',
    church_id: 'church-1',
    youtube_url: 'https://youtube.com/watch?v=abc123',
    analysis_result: null,
  },
  {
    id: 'ep-2',
    title: 'Grace and Mercy',
    status: 'processing',
    created_at: '2026-03-05T14:00:00.000Z',
    sermon_date: '2026-03-05',
    preacher_name: 'Pastor Grace',
    church_id: 'church-1',
    youtube_url: 'https://youtube.com/watch?v=def456',
    analysis_result: null,
  },
  {
    id: 'ep-3',
    title: 'Walking in Love',
    status: 'draft',
    created_at: '2026-03-06T09:00:00.000Z',
    sermon_date: '2026-03-06',
    preacher_name: 'Pastor Love',
    church_id: 'church-1',
    youtube_url: 'https://youtube.com/watch?v=ghi789',
    analysis_result: null,
  },
];

export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  spotifyTitles: [
    'Vencendo Gigantes: Como a Fe Transforma Batalhas em Vitorias',
    'O Segredo de Davi: 3 Licoes Para Vencer Seus Gigantes Hoje',
    'Fe Sobre Medo: O Caminho Para Vencer Qualquer Desafio',
  ],
  spotifyDescriptionSnippet:
    'Descubra como Davi enfrentou Golias e como voce pode aplicar os mesmos principios de fe para vencer seus gigantes pessoais.',
  spotifyDescriptionBody:
    'Nesta mensagem poderosa, exploramos a historia de Davi e Golias em 1 Samuel 17. Aprendemos que a verdadeira vitoria nao vem das armas, mas da fe inabalavel em Deus. Tres principios praticos para aplicar no dia a dia.',
  spotifyCTA:
    'Compartilhe este episodio com alguem que precisa de encorajamento hoje!',
  spotifyPollQuestion: 'Qual gigante voce esta enfrentando?',
  spotifyPollOptions: [
    'Medo do futuro',
    'Desafios financeiros',
    'Relacionamentos dificeis',
    'Saude',
  ],
  biblicalReferences: [
    '1 Samuel 17:45-47',
    'Filipenses 4:13',
    'Isaias 41:10',
  ],
  tags: [
    'fe',
    'coragem',
    'davi',
    'golias',
    'vitoria',
    'pregacao',
    'biblia',
  ],
  marketingHooks: [
    'Voce esta enfrentando um gigante? Descubra o segredo de Davi!',
    'A fe que move montanhas esta ao seu alcance.',
    'Nao deixe o medo te paralisar — assista agora!',
  ],
  keyMoments: [
    {
      title: 'O Momento da Decisao',
      timestamp: '12:34',
      reasoning: 'Ponto de virada emocional com alta taxa de engajamento.',
      hook: 'E se voce pudesse enfrentar seu maior medo com coragem?',
      estimatedContext:
        'Davi decide enfrentar Golias quando ninguem mais ousava.',
    },
    {
      title: 'A Pedra e a Fe',
      timestamp: '25:10',
      reasoning: 'Ilustracao pratica que gera identificacao imediata.',
      hook: 'Uma simples pedra mudou a historia. O que voce tem nas maos?',
      estimatedContext:
        'O pregador conecta a funda de Davi com os recursos simples que temos.',
    },
    {
      title: 'Vitoria Declarada',
      timestamp: '38:45',
      reasoning: 'Climax da mensagem com chamada a acao forte.',
      hook: 'A vitoria ja foi declarada antes da batalha comecar.',
      estimatedContext:
        'Davi declarou a vitoria em nome do Senhor antes de lancar a pedra.',
    },
  ],
};

/**
 * Sets up route interceptions for episode-related DB queries.
 */
export async function mockEpisodeRoutes(page: import('@playwright/test').Page): Promise<void> {
  // Intercept episodes query (for dashboard and library)
  await page.route(`${SUPABASE_URL}/rest/v1/episodes*`, (route) => {
    const url = route.request().url();

    // Handle POST (create episode)
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'ep-new-' + Date.now(),
          title: 'New Episode',
          status: 'processing',
          church_id: 'church-1',
          created_at: new Date().toISOString(),
        }),
      });
    }

    // Handle PATCH (update episode)
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }

    // Handle GET queries — check for count/stats patterns
    if (url.includes('select=count')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${MOCK_EPISODES.length - 1}/${MOCK_EPISODES.length}` },
        body: JSON.stringify(MOCK_EPISODES),
      });
    }

    // Default GET — return episodes
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_EPISODES),
    });
  });

  // Intercept edge function for content generation
  await page.route(`${SUPABASE_URL}/functions/v1/generate-content*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ANALYSIS_RESULT),
    });
  });

  // Intercept storage uploads
  await page.route(`${SUPABASE_URL}/storage/v1/**`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Key: 'test-image.png' }),
    });
  });

  // Intercept API usage tracking
  await page.route(`${SUPABASE_URL}/rest/v1/api_usage*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Intercept audit_log
  await page.route(`${SUPABASE_URL}/rest/v1/audit_log*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Intercept profiles
  await page.route(`${SUPABASE_URL}/rest/v1/profiles*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'test-user-id',
          full_name: 'Test User',
          avatar_url: '',
          onboarding_completed: true,
        },
      ]),
    });
  });

  // Intercept churches query
  await page.route(`${SUPABASE_URL}/rest/v1/churches*`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([MOCK_CHURCH]),
    });
  });
}
