# Technical Debt Assessment -- Churchify (FINAL)

**Projeto:** Churchify -- AI-Powered Sermon Content Platform
**Data:** 2026-03-06
**Versao:** 1.0 (FINAL)
**QA Gate:** APPROVED (4.4/5.0)
**Brownfield Discovery:** Phase 8 -- Finalized by @architect

---

## Executive Summary

Churchify is an early-stage prototype (v0.0.1) originally generated via Google AI Studio. The codebase has **significant technical debt across all layers** that must be addressed before any public deployment.

| Metric | Value |
|--------|-------|
| **Total debts identified** | 51 (deduplicated, after specialist additions) |
| **Critical (P0)** | 9 |
| **High (P1)** | 14 |
| **Medium (P2)** | 19 |
| **Low (P3)** | 9 |
| **Estimated total effort** | ~280h (+/- 20%) |
| **Areas affected** | Security, Architecture, Database, Frontend, UX, Quality, CI/CD |
| **UX Score (current)** | 3/10 |

**Top 3 Risks:**
1. **Gemini API key exposed in client bundle** -- anyone can extract and abuse the key (SYS-002)
2. **Zero data persistence** -- all AI-generated content lost on page refresh (DB-001 / SYS-012 / UX-005)
3. **Dual module loading with GenAI version gap** -- CDN loads `@google/genai@^1.30.0` while package.json has `^0.1.1`; CDN removal may require `geminiService.ts` rewrites (SYS-003)

**Strategic Decisions Validated by All Specialists:**
- Migrate Firebase -> Supabase (PostgreSQL)
- Adopt shadcn/ui + Radix UI + Tailwind CSS
- Test infrastructure: Vitest + RTL + Playwright
- WCAG 2.1 Level AA compliance target

---

## Decisoes Estrategicas Validadas

### 1. Firebase -> Supabase Migration

**Recomendado por:** @data-engineer | **Endossado por:** @qa, @architect

**Justificativa:**
- O projeto NAO usa Firestore -- apenas Firebase Auth esta ativo. A "divida de migracao" e apenas Auth (~8h), nao dados
- Dados sao inerentemente relacionais: users -> churches -> episodes -> results. PostgreSQL modela nativamente; Firestore luta com JOINs
- RLS do PostgreSQL e vastamente superior a Firestore Rules para multi-tenancy (DB-009)
- Migrations nativas resolvem DB-015 automaticamente
- `.env.example` do AIOX ja tem Supabase configurado -- padrao do ecossistema
- DB-004, DB-005, DB-013 resolvidos de forma mais robusta com PostgreSQL constraints + RLS
- Menor vendor lock-in

**Custo da migracao:** ~10h extra (8h auth + 2h cleanup). Custo liquido ~6h apos economia em rules/config.

**Risco:** Medium. Mitigar com spike de 2h antes de commitar a migracao completa.

### 2. Design System: shadcn/ui + Radix + Tailwind

**Recomendado por:** @ux-design-expert | **Endossado por:** @qa, @architect

**Justificativa:**
- Acessibilidade nativa: Radix primitives resolvem A11Y-003, A11Y-005, A11Y-008 automaticamente (~8h economizados)
- shadcn/ui usa Tailwind internamente -- sem conflito com CSS existente
- Componentes copiados localmente (controle total, tree-shakeable)
- Resolve diretamente: UX-002 (Form), UX-008 (AlertDialog), UX-011 (Progress), UX-014 (Toast), A11Y-005 (Dialog), A11Y-008 (Sheet)

**Setup:** ~8h para inicializacao + migracao de componentes core

### 3. Test Infrastructure: Vitest + RTL + Playwright

**Recomendado por:** @qa | **Endossado por:** @architect

**Coverage targets:**
- MVP: 60% line coverage (critical paths)
- Production: 80% line coverage
- Strategy: Unit + Integration first; E2E after core flows stabilize

**AI Integration Testing:**
- Mock `@google/genai` at module level para unit/integration
- Golden file responses para consistencia
- 1 real API call semanal em CI para detectar breaking changes

---

## Inventario Completo de Debitos

### Sistema (validado por @architect, ajustado por @qa)

| ID | Debito | Severidade | Horas | Prioridade | Dependencias |
|----|--------|-----------|-------|-----------|-------------|
| SYS-001 | Firebase credentials hardcoded como placeholders | Critical | 2h | P0 | Nenhuma (se Supabase: absorvido na migracao) |
| SYS-002 | Gemini API key exposta em client bundle | Critical | 6h | P0 | Supabase Edge Function (pos-migracao) |
| SYS-003 | Dual module loading: CDN importmap + npm packages (GenAI 1.30 vs 0.1.1) | Critical | 6h | P0 | Nenhuma. Inclui upgrade `@google/genai` no package.json |
| SYS-004 | Tailwind via CDN (~3MB unminified) | Critical | 4h | P0 | SYS-003 |
| SYS-005 | Dashboard 100% hardcoded mock data | High | 8h | P1 | DB-001 |
| SYS-006 | Firestore/Storage dead imports | Medium | 1h | P2 | Resolvido na migracao Supabase |
| SYS-007 | Zero test infrastructure | **Critical** (elevado por @qa) | 8h | **P0** | Nenhuma |
| SYS-008 | No linting/formatting config | High | 4h | P1 | Nenhuma |
| SYS-009 | TypeScript strict mode disabled | Medium | 6h | P2 | SYS-008 |
| SYS-010 | No React Error Boundary | Medium | 2h | P2 | Nenhuma |
| SYS-011 | Header.tsx dead code | Low | 0.5h | P3 | Nenhuma |
| SYS-012 | No persistence para resultados de AI | High | -- | -- | Deduplicado em DB-001 |
| SYS-013 | Gemini NAO analisa video real (guesses from title) | High | 20h | P1 | SYS-002 (backend proxy) |
| SYS-014 | Base64 images em React state (2-10MB/sessao) | Medium | 6h | P2 | DB-007 |
| SYS-015 | No input validation/sanitization; usa alert() | Medium | 4h | P2 | UX-002 |
| SYS-016 | Church name/plan hardcoded no sidebar | Low | 4h | P3 | DB-009 |
| SYS-017 | No src/ directory convention | Low | 4h | P3 | Nenhuma |
| SYS-018 | experimentalDecorators enabled mas unused | Low | 0.5h | P3 | Nenhuma |
| SYS-019 | Missing postcss.config.js e tailwind.config.js | Medium | 2h | P1 | SYS-004 |
| SYS-020 | No loading skeleton ou optimistic UI | Low | 2h | P3 | DB-001 |
| SYS-021 | .env.example e template AIOX, nao app-specific | Medium | 1h | P2 | Nenhuma |
| SYS-022 | No favicon, PWA manifest, social meta tags | Low | 2h | P3 | Nenhuma |
| SYS-023 | **No CI/CD pipeline** (adicionado por @qa) | **High** | 8h | **P1** | SYS-007, SYS-008 |

### Database (validado por @data-engineer, ajustado para Supabase)

| ID | Debito | Severidade | Horas | Prioridade | Dependencias |
|----|--------|-----------|-------|-----------|-------------|
| DB-001 | No data persistence -- tudo perdido em refresh | Critical | 28h | P0 | Supabase setup, DB-008 |
| DB-002 | Firebase config usa placeholders | High | 1h | -- | Deduplicado em SYS-001 / absorvido na migracao |
| DB-003 | No firebase.json / projeto nao inicializado | High | -- | -- | Eliminado pela migracao Supabase |
| DB-004 | No security rules / RLS | Critical | 4h | P0 | DB-001 (schema necessario antes de RLS) |
| DB-005 | No storage security policies | High | 2h | P1 | DB-004 |
| DB-006 | Dashboard usa mock data | Medium | 6h | P2 | DB-001 |
| DB-007 | Images base64 em memoria apenas | Medium | 6h | P2 | DB-001, SYS-014 |
| DB-008 | No user profile collection/table | High | 6h | P0 | Supabase setup |
| DB-009 | No multi-tenancy / church isolation | Medium | 20h | P2 | DB-001, DB-008 |
| DB-010 | No per-user API key management / usage tracking | Medium | 8h | P2 | SYS-002 (backend proxy) |
| DB-011 | No data export/backup strategy | Low | 3h | P3 | DB-001 |
| DB-012 | No offline support/caching | Low | 2h | P3 | DB-001 |
| DB-013 | No data validation at database level (adicionado) | High | 2h | P0 | DB-001 (CHECK constraints na criacao) |
| DB-014 | No audit trail / activity log (adicionado) | Medium | 8h | P2 | DB-001 |
| DB-015 | No migration strategy (adicionado) | High | 0h | -- | Resolvido automaticamente com Supabase migrations |
| DB-016 | analysisResult como JSONB sem indexes (adicionado) | Medium | 0h | -- | Incluido no schema de DB-001 (GIN index) |
| DB-017 | No rate limiting at database level (adicionado) | Medium | 4h | P2 | DB-010 |

### Frontend/UX (validado por @ux-design-expert)

| ID | Debito | Severidade | Horas | Prioridade | Dependencias |
|----|--------|-----------|-------|-----------|-------------|
| UX-001 | Dashboard hardcoded placeholder data | High | 10h | P1 | DB-001 |
| UX-002 | alert() para validacao de form | **High** (elevado) | 3h | P1 | shadcn/ui Form |
| UX-003 | D&D upload visual mas nao-funcional | **High** (elevado) | 4h | P1 | Nenhuma |
| UX-004 | Sem validacao de tamanho de arquivo | Medium | 1h | P2 | Nenhuma |
| UX-005 | Sem salvar/exportar resultados | Critical | -- | -- | Deduplicado em DB-001 |
| UX-006 | Sem loading skeleton no Dashboard | Low | 2h | P3 | DB-001 |
| UX-007 | Igreja/plano hardcoded no sidebar | Medium | 4h | P2 | DB-009 |
| UX-008 | Sem confirmacao de logout | Low | 1h | P3 | shadcn/ui AlertDialog |
| UX-009 | Sem retry em falha API Gemini | **High** (elevado) | 3h | P1 | Nenhuma |
| UX-010 | Animacoes CSS nao definidas | Low | 1h | P3 | SYS-019 |
| UX-011 | Sem indicador de progresso na AI | **High** (elevado) | 4h | P1 | shadcn/ui Progress |
| UX-012 | TOS/Privacy sao texto puro | Low | 1h | P3 | Nenhuma |
| UX-013 | Sem onboarding/tutorial primeiro uso (adicionado) | High | 8h | P1 | shadcn/ui Dialog |
| UX-014 | Sem feedback de sucesso apos geracao (adicionado) | Medium | 2h | P2 | shadcn/ui Toast |
| UX-015 | Sem max-width no conteudo principal (adicionado) | Low | 1h | P3 | Nenhuma |
| UX-016 | Rotas Library/Settings renderizam div vazio (adicionado) | Medium | 4h | P2 | Nenhuma |
| UX-017 | Copy-to-clipboard sem fallback (adicionado) | Low | 1h | P3 | Nenhuma |
| UX-018 | Formulario nao persiste entre navegacoes (adicionado) | Medium | 2h | P2 | Nenhuma |

### Acessibilidade (validado por @ux-design-expert, WCAG 2.1 AA target)

| ID | Debito | Severidade | Horas | Prioridade | Dependencias |
|----|--------|-----------|-------|-----------|-------------|
| A11Y-001 | Menu mobile sem aria-label | High | 0.5h | P1 | Nenhuma |
| A11Y-002 | Fechar menu sem aria-label | High | 0.5h | P1 | Nenhuma |
| A11Y-003 | Form validation via alert() nao acessivel | **Critical** (elevado) | 2h | P0 | UX-002 (resolvidos juntos) |
| A11Y-004 | Sem skip-to-content | Medium | 1h | P2 | Nenhuma |
| A11Y-005 | Sidebar overlay sem aria attributes | Medium | 0.5h | P2 | shadcn/ui Sheet |
| A11Y-006 | Copy buttons sem aria-labels descritivos | Medium | 2h | P2 | Nenhuma |
| A11Y-007 | Color contrast: text-gray-400 (ratio 2.9:1, falha AA) | Medium | 2h | P2 | Nenhuma |
| A11Y-008 | Sem focus trap no menu mobile | Medium | 2h | P2 | shadcn/ui Sheet |
| A11Y-009 | Loading nao anunciado via aria-live | Medium | 1h | P2 | Nenhuma |
| A11Y-010 | Imagens geradas sem alt text significativo | Medium | 1h | P2 | Nenhuma |

---

## Matriz de Priorizacao Final

### P0 -- Critical (Must Fix Before Any Deployment)

| # | ID(s) | Debito | Area | Horas | Owner |
|---|-------|--------|------|-------|-------|
| 1 | SYS-007 | Zero test infrastructure (elevado por @qa) | Quality | 8h | @dev + @qa |
| 2 | SYS-002 | Gemini API key exposta em client bundle | Security | 6h | @dev |
| 3 | SYS-001 | Firebase credentials placeholders | Security | 2h | @dev (absorvido na migracao) |
| 4 | SYS-003 | Dual module loading + GenAI version gap (0.1.1 vs 1.30.0) | Architecture | 6h | @dev |
| 5 | SYS-004 | Tailwind via CDN (3MB unminified) | Architecture | 4h | @dev |
| 6 | DB-008 | No user profiles table | Data Model | 6h | @data-engineer |
| 7 | DB-001 | No data persistence layer | Persistence | 28h | @data-engineer + @dev |
| 8 | DB-004 | No RLS / security policies | Security | 4h | @data-engineer |
| 9 | A11Y-003 | Form validation nao acessivel (alert + sem aria) | a11y | 2h | @dev |
| | | | | **66h** | |

### P1 -- High (Before Beta / User Testing)

| # | ID(s) | Debito | Area | Horas | Owner |
|---|-------|--------|------|-------|-------|
| 1 | SYS-008 | No linting/formatting config | Quality | 4h | @dev |
| 2 | SYS-023 | No CI/CD pipeline (adicionado por @qa) | DevOps | 8h | @devops |
| 3 | SYS-013 | Gemini nao analisa video real | Feature Gap | 20h | @dev |
| 4 | SYS-019 | Missing tailwind/postcss configs | Build | 2h | @dev |
| 5 | DB-005 | No storage security policies | Security | 2h | @data-engineer |
| 6 | DB-013 | No data validation at DB level | Quality | 2h | @data-engineer |
| 7 | UX-001 | Dashboard empty state + dados reais | Feature Gap | 10h | @dev |
| 8 | UX-002 | alert() para validacao -> inline validation | UX | 3h | @dev |
| 9 | UX-003 | D&D upload nao-funcional | UX | 4h | @dev |
| 10 | UX-009 | Sem retry em falha API | UX | 3h | @dev |
| 11 | UX-011 | Sem progress indicator AI | UX | 4h | @dev |
| 12 | UX-013 | Sem onboarding primeiro uso | UX | 8h | @dev + @ux |
| 13 | A11Y-001/002 | Aria-labels em menu mobile | a11y | 1h | @dev |
| | | | | **71h** | |

### P2 -- Medium (Before Production Launch)

| # | ID(s) | Debito | Area | Horas | Owner |
|---|-------|--------|------|-------|-------|
| 1 | SYS-009 | TypeScript strict mode | Quality | 6h | @dev |
| 2 | SYS-010 | No React Error Boundary | Reliability | 2h | @dev |
| 3 | SYS-014 | Base64 images em state | Performance | 6h | @dev |
| 4 | SYS-015 | No input sanitization | Security | 4h | @dev |
| 5 | SYS-021 | .env.example incorreto | Config | 1h | @dev |
| 6 | SYS-006 | Dead imports (Firestore/Storage) | Dead Code | 1h | @dev |
| 7 | DB-006 | Dashboard mock data queries | Data | 6h | @dev |
| 8 | DB-007 | Images -> Supabase Storage | Storage | 6h | @dev |
| 9 | DB-009 | Multi-tenancy completo | Architecture | 20h | @data-engineer + @dev |
| 10 | DB-010 | API key management / usage tracking | Security | 8h | @dev |
| 11 | DB-014 | Audit trail | Compliance | 8h | @data-engineer |
| 12 | DB-017 | Rate limiting at DB level | Security | 4h | @data-engineer |
| 13 | UX-004 | File size validation | UX | 1h | @dev |
| 14 | UX-007 | Igreja/plano dinamico no sidebar | UX | 4h | @dev |
| 15 | UX-014 | Feedback de sucesso (toast) | UX | 2h | @dev |
| 16 | UX-016 | Placeholder pages Library/Settings | UX | 4h | @dev |
| 17 | UX-018 | Form persistence em sessionStorage | UX | 2h | @dev |
| 18 | A11Y-004 thru A11Y-010 | Remaining a11y fixes (batch) | a11y | 9.5h | @dev |
| | | | | **95.5h** | |

### P3 -- Low (Quality of Life / Polish)

| # | ID(s) | Debito | Area | Horas | Owner |
|---|-------|--------|------|-------|-------|
| 1 | SYS-011 | Header.tsx dead code | Dead Code | 0.5h | @dev |
| 2 | SYS-016 | Church name/plan hardcoded | Feature Gap | 4h | @dev |
| 3 | SYS-017 | No src/ directory convention | Structure | 4h | @dev |
| 4 | SYS-018 | Unused experimentalDecorators | Config | 0.5h | @dev |
| 5 | SYS-020 | No loading skeleton | UX | 2h | @dev |
| 6 | SYS-022 | No favicon/PWA/meta tags | Polish | 2h | @dev |
| 7 | DB-011 | No data export/backup | Operations | 3h | @devops |
| 8 | DB-012 | No offline support | Resilience | 2h | @dev |
| 9 | UX-006 | Loading skeleton Dashboard | UX | 2h | @dev |
| 10 | UX-008 | Confirmacao logout | UX | 1h | @dev |
| 11 | UX-010 | CSS animations nao definidas | UX | 1h | @dev |
| 12 | UX-012 | TOS/Privacy links | UX | 1h | @dev |
| 13 | UX-015 | max-width no conteudo | UX | 1h | @dev |
| 14 | UX-017 | Copy-to-clipboard fallback | UX | 1h | @dev |
| | | | | **25h** | |

---

## Plano de Resolucao (Fases)

### Fase 0: Decisoes e Fundacao (Semana 1) -- 24h

**Objetivo:** Estabelecer fundacao tecnica antes de qualquer feature work.

| # | Item | Horas | IDs Resolvidos | Track |
|---|------|-------|---------------|-------|
| 1 | Decidir Supabase (spike de 2h para validar auth migration) | 2h | Decisao | -- |
| 2 | Setup test infra: Vitest + RTL + config | 8h | SYS-007 | B |
| 3 | Setup lint/format: ESLint + Prettier | 4h | SYS-008 | B |
| 4 | Remover CDN importmap + upgrade @google/genai em package.json | 6h | SYS-003 | B |
| 5 | Configurar Tailwind build pipeline (postcss.config + tailwind.config) | 4h | SYS-004, SYS-019 | B |

**Nota sobre SYS-003:** O CDN carrega `@google/genai@^1.30.0` enquanto package.json tem `^0.1.1`. A API surface mudou significativamente entre essas versoes. Apos remocao do CDN, `geminiService.ts` pode precisar de rewrites. Testar extensivamente.

### Fase 1: Supabase Migration + Quick Wins (Semana 1-2) -- 38h

**Track A (DB/Backend):**

| # | Item | Horas | IDs Resolvidos |
|---|------|-------|---------------|
| 1 | Setup Supabase project + env vars | 2h | SYS-001, SYS-021 |
| 2 | Auth migration (Firebase -> Supabase Google OAuth) | 8h | SYS-001, DB-002 |
| 3 | User profiles table + trigger | 6h | DB-008 |
| 4 | Remove Firebase SDK + dead imports | 2h | SYS-006, DB-003 |

**Track C (UX Quick Wins -- paralelo, sem dependencias de DB):**

| # | Item | Horas | IDs Resolvidos |
|---|------|-------|---------------|
| 1 | shadcn/ui setup inicial | 8h | Base para UX fixes |
| 2 | Inline form validation (substituir alert) | 3h | UX-002, A11Y-003 |
| 3 | Aria-labels em botoes interativos | 2h | A11Y-001, A11Y-002, A11Y-006 |
| 4 | D&D upload funcional | 4h | UX-003 |
| 5 | File size validation | 1h | UX-004 |
| 6 | Fix color contrast (gray-400 -> gray-500) | 2h | A11Y-007 |

### Fase 2: Core Persistence (Semana 2-4) -- 46h

**Track A (DB/Backend):**

| # | Item | Horas | IDs Resolvidos |
|---|------|-------|---------------|
| 1 | Schema completo: churches, episodes, analysis_results + CRUD service layer | 28h | DB-001, DB-013, DB-015, DB-016 |
| 2 | RLS policies (church-scoped) | 4h | DB-004 |
| 3 | Storage buckets + policies | 2h | DB-005, DB-007 (parcial) |

**Track C (UX -- paralelo):**

| # | Item | Horas | IDs Resolvidos |
|---|------|-------|---------------|
| 1 | AI processing stepper | 4h | UX-011 |
| 2 | Retry button em erro API | 3h | UX-009 |
| 3 | Onboarding flow | 5h | UX-013 (parte 1) |

### Fase 3: Features + Security (Semana 4-6) -- 56h

| # | Item | Horas | IDs Resolvidos |
|---|------|-------|---------------|
| 1 | Backend proxy para Gemini (Supabase Edge Function) | 6h | SYS-002 |
| 2 | API usage tracking | 8h | DB-010 |
| 3 | Video transcription real (YouTube API + prompt rewrite) | 20h | SYS-013 |
| 4 | Dashboard com dados reais + empty state | 10h | UX-001, SYS-005 |
| 5 | Image upload -> Supabase Storage + URLs no banco | 6h | SYS-014, DB-007 |
| 6 | CI/CD pipeline (GitHub Actions: lint -> typecheck -> test -> build) | 6h | SYS-023 |

### Fase 4: Multi-tenancy + Polish (Semana 6-8) -- 70h

| # | Item | Horas | IDs Resolvidos |
|---|------|-------|---------------|
| 1 | Multi-tenancy completo (roles, convites, isolamento) | 20h | DB-009 |
| 2 | TypeScript strict mode + fix errors | 6h | SYS-009 |
| 3 | React Error Boundary | 2h | SYS-010 |
| 4 | Input validation/sanitization | 4h | SYS-015 |
| 5 | Audit trail | 8h | DB-014 |
| 6 | Rate limiting | 4h | DB-017 |
| 7 | Remaining a11y fixes (A11Y-004 thru A11Y-010) | 9.5h | A11Y batch |
| 8 | UX polish: sidebar dinamico, placeholders, form persistence, toast, etc. | 16.5h | UX-007/014/016/018 + restantes P2/P3 |

### Fase 5: Quality + Final Polish (Semana 8-9) -- 46h

| # | Item | Horas | IDs Resolvidos |
|---|------|-------|---------------|
| 1 | Expand test coverage to 80% | 16h | Qualidade geral |
| 2 | E2E tests com Playwright (4 critical flows) | 12h | Qualidade geral |
| 3 | Performance audit (Lighthouse, bundle analysis) | 4h | Performance |
| 4 | Remaining P3 items (dead code, src/ reorg, PWA, skeleton, etc.) | 14h | P3 batch |

---

## Dependencias Criticas (Mapa)

```
DECISAO: Supabase (spike 2h)
  |
  +---> Track B: Build Pipeline (paralelo)
  |       SYS-003 (CDN removal + GenAI upgrade)
  |         |-> SYS-004 (Tailwind build) -> SYS-019 (configs)
  |       SYS-007 (test infra) + SYS-008 (lint)
  |         |-> SYS-009 (strict TS -- apos lint fixes)
  |         |-> SYS-023 (CI/CD)
  |
  +---> Track A: Database (serial)
  |       Supabase Setup (2h) -> Auth Migration (8h) -> SYS-001
  |         |-> DB-008 (profiles, 6h)
  |              |-> DB-001 (persistence, 28h) + DB-004 (RLS, 4h) + DB-013 (validation)
  |                   |-> DB-005 (storage policies)
  |                   |-> DB-007 (image persistence)
  |                   |-> SYS-005/UX-001 (dashboard real data)
  |                   |-> DB-009 (multi-tenancy, 20h) -> DB-014 (audit)
  |
  +---> Track C: UX Quick Wins (paralelo, sem dep DB)
          shadcn/ui setup (8h)
            |-> UX-002 + A11Y-003 (form validation)
            |-> UX-011 (progress stepper)
            |-> UX-003 (D&D)
            |-> A11Y-001/002 (aria-labels)

  Track A completo (DB-001) DESBLOQUEIA:
    -> UX-005 (save/export resultados)
    -> SYS-005 (dashboard dados reais)
    -> SYS-002 (API proxy via Edge Function)
      |-> DB-010 (usage tracking) -> DB-017 (rate limiting)
      |-> SYS-013 (video transcription real)
```

**Critical Path:** Supabase Decision -> Auth Migration -> DB-008 -> DB-001 -> SYS-005/UX-001

**Parallel Tracks (independentes ate DB-001 completar):**
- Track A: DB/Backend
- Track B: Build Pipeline + Quality Infra
- Track C: UX/A11Y Quick Wins

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|-------------|---------|----------|
| Supabase auth migration quebra login | Medium | Critical | Spike de 2h antes de commitar. Manter Firebase Auth como fallback plan |
| CDN removal quebra runtime (GenAI version gap) | High | High | Upgrade `@google/genai` para ^1.30.0 no package.json ANTES de remover CDN. Testar `geminiService.ts` extensivamente |
| Zero testes durante refactoring massivo | High | Critical | SYS-007 e agora P0 -- smoke tests ANTES de CDN removal ou Supabase migration |
| Gemini API cost escalation (key exposta) | High | High | SYS-002 + DB-010 + DB-017 como iniciativa unica. Proxy com rate limiting |
| Base64 image memory pressure | Medium | Medium | Storage migration (DB-007) antes de qualquer load testing |
| `@google/genai` API breaking changes apos upgrade | Medium | High | Mapear diferencas de API entre 0.1.1 e 1.30.0. Preparar rewrites de geminiService.ts |

---

## Criterios de Sucesso

### P0 Done (Deploy-Safe)
- [ ] Zero API keys em client bundle (verificavel com `grep -r "API_KEY" dist/`)
- [ ] Supabase auth funcional com Google OAuth
- [ ] Dados persistem apos refresh do browser
- [ ] RLS ativo -- usuario A nao acessa dados de usuario B
- [ ] Test runner configurado e executando (Vitest)
- [ ] Smoke tests para auth flow e form submission
- [ ] Build pipeline limpo (zero CDN, Tailwind via PostCSS)
- [ ] Form validation acessivel (sem alert(), com aria-invalid)

### P1 Done (Beta-Ready)
- [ ] CI/CD pipeline: lint -> typecheck -> test -> build em PR
- [ ] 60% test coverage em critical paths
- [ ] ESLint + Prettier configurados e passando
- [ ] Dashboard mostra dados reais (ou empty state educativo)
- [ ] Onboarding flow para primeiro uso
- [ ] Progress stepper durante AI processing
- [ ] D&D upload funcional

### P2 Done (Production-Ready)
- [ ] TypeScript strict mode ativo, zero errors
- [ ] 80% test coverage
- [ ] Multi-tenancy com isolamento completo
- [ ] Rate limiting ativo no proxy API
- [ ] WCAG 2.1 AA compliance (audit com axe-core)
- [ ] UX Score >= 7/10

---

## Effort Summary

| Area | Horas | % do Total |
|------|-------|-----------|
| Sistema / Arquitetura | 77h | 27.5% |
| Database / Backend | 89h | 31.8% |
| Frontend / UX | 82.5h | 29.5% |
| QA / Testing | 32h | 11.4% |
| **TOTAL** | **~280h** | **100%** |

**Breakdown por fase:**

| Fase | Horas | Acumulado | Milestone |
|------|-------|-----------|-----------|
| Fase 0: Fundacao | 24h | 24h | Build pipeline limpo, testes e lint |
| Fase 1: Migration + Quick Wins | 38h | 62h | Supabase auth, shadcn/ui, a11y basics |
| Fase 2: Core Persistence | 46h | 108h | App funcional com persistencia |
| Fase 3: Features + Security | 56h | 164h | API segura, video real, dashboard |
| Fase 4: Multi-tenancy + Polish | 70h | 234h | Isolamento completo, strict TS |
| Fase 5: Quality + Final | 46h | 280h | 80% coverage, E2E, polish |

**Nota sobre reconciliacao de esforcos:** O DRAFT original estimava 180-240h, mas contabilizava apenas debitos existentes. As adicoes dos especialistas (+5 DB debts, +6 UX debts, +1 QA debt, shadcn/ui setup de 8h, migracao Supabase de 10h, CI/CD de 8h, e expansao de testes para 28h) elevam o total para ~280h. Com margem de +/- 20%, o range e **224-336h**.

**MVP path (Fases 0-2):** 108h para um app funcional com persistencia, auth, e build pipeline limpo.

---

## Schema de Referencia (Supabase/PostgreSQL)

O schema completo com 5 tabelas (profiles, churches, church_members, episodes, api_usage), indexes, RLS policies e Storage bucket policies esta documentado em `docs/reviews/db-specialist-review.md` na secao "Schema Proposal". Esse schema e considerado production-ready por @data-engineer e validado por @qa.

---

*Assessment validado por: @architect (Aria), @data-engineer (Dara), @ux-design-expert (Uma), @qa (Quinn)*
*QA Gate: APPROVED -- Score 4.4/5.0*
*Brownfield Discovery Phase 8 -- COMPLETE*
