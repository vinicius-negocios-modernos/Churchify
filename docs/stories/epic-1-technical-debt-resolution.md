# Epic 1: Resolucao de Debitos Tecnicos — Churchify

## Objetivo

Resolver os 51 debitos tecnicos identificados na Brownfield Discovery, transformando o Churchify de um prototipo fragil (UX 3/10, zero persistencia, API key exposta) em uma plataforma production-ready com autenticacao segura, persistencia de dados, interface acessivel (WCAG 2.1 AA), 80% de cobertura de testes e multi-tenancy completo.

## Escopo

Todos os 51 debitos catalogados no Technical Debt Assessment v1.0 FINAL (QA Score 4.4/5.0), organizados em 6 fases de resolucao (Fase 0 a Fase 5), cobrindo:

- **Sistema/Arquitetura:** 23 debitos (SYS-001 a SYS-023)
- **Database/Backend:** 17 debitos (DB-001 a DB-017)
- **Frontend/UX:** 18 debitos (UX-001 a UX-018)
- **Acessibilidade:** 10 debitos (A11Y-001 a A11Y-010)

**Decisoes estrategicas validadas por todos os especialistas:**
- Firebase -> Supabase (PostgreSQL)
- shadcn/ui + Radix UI + Tailwind CSS
- Vitest + RTL + Playwright

## Criterios de Sucesso

### P0 Done (Deploy-Safe)
- Zero API keys em client bundle (verificavel com `grep -r "API_KEY" dist/`)
- Supabase auth funcional com Google OAuth
- Dados persistem apos refresh do browser
- RLS ativo — usuario A nao acessa dados de usuario B
- Vitest configurado e executando com smoke tests
- Build pipeline limpo (zero CDN, Tailwind via PostCSS)
- Form validation acessivel (sem alert(), com aria-invalid)

### P1 Done (Beta-Ready)
- CI/CD pipeline: lint -> typecheck -> test -> build em PR
- 60% test coverage em critical paths
- ESLint + Prettier configurados e passando
- Dashboard mostra dados reais ou empty state educativo
- Onboarding flow para primeiro uso
- Progress stepper durante AI processing
- D&D upload funcional

### P2 Done (Production-Ready)
- TypeScript strict mode ativo, zero errors
- 80% test coverage
- Multi-tenancy com isolamento completo
- Rate limiting ativo no proxy API
- WCAG 2.1 AA compliance (audit com axe-core)
- UX Score >= 7/10

## Timeline

| Fase | Descricao | Horas | Acumulado | Prazo | Milestone |
|------|-----------|-------|-----------|-------|-----------|
| Fase 0 | Fundacao (build pipeline, testes, lint) | 24h | 24h | Semana 1 | Build pipeline limpo |
| Fase 1 | Supabase Migration + Quick Wins | 38h | 62h | Semana 1-2 | Auth seguro, shadcn/ui, a11y basics |
| Fase 2 | Core Persistence | 46h | 108h | Semana 2-4 | App funcional com persistencia (MVP) |
| Fase 3 | Features + Security | 56h | 164h | Semana 4-6 | API segura, video real, dashboard |
| Fase 4 | Multi-tenancy + Polish | 70h | 234h | Semana 6-8 | Isolamento completo, strict TS |
| Fase 5 | Quality + Final Polish | 46h | 280h | Semana 8-9 | 80% coverage, E2E, polish |

**MVP Path:** Fases 0-2 (108h) entregam app funcional com persistencia.

## Budget

| Cenario | Horas | Custo (R$ 150/h) | Prazo |
|---------|-------|------------------|-------|
| MVP (Fases 0-2) | 108h | R$ 16.200 | 4 semanas |
| Recomendado (Fases 0-3) | 164h | R$ 24.600 | 6 semanas |
| Completo (Fases 0-5) | 280h | R$ 42.000 | 9 semanas |
| Margem +/- 20% | 224-336h | R$ 33.600 — R$ 50.400 | — |

## Stories

| ID | Story | Fase | SP | Prioridade | Dependencias |
|----|-------|------|-----|-----------|-------------|
| 1.1 | Project Restructuring & Build Pipeline | 0 | 5 | P0 | - |
| 1.2 | Test Infrastructure Setup (Vitest + RTL) | 0 | 3 | P0 | - |
| 1.3 | Supabase Setup & Auth Migration | 1 | 5 | P0 | 1.1 |
| 1.4 | CDN Removal & Dependency Alignment | 1 | 3 | P0 | 1.1 |
| 1.5 | Design System Setup (shadcn/ui + Radix) | 1 | 5 | P1 | 1.1, 1.4 |
| 1.6 | UX Quick Wins & Accessibility Basics | 1 | 3 | P1 | 1.5 |
| 1.7 | Database Schema & Core Persistence | 2 | 8 | P0 | 1.3 |
| 1.8 | RLS Policies & Storage Migration | 2 | 3 | P0 | 1.7 |
| 1.9 | UX Improvements: Progress, Retry & Onboarding | 2 | 5 | P1 | 1.5 |
| 1.10 | Security Hardening: API Proxy & Key Protection | 3 | 5 | P0 | 1.7 |
| 1.11 | Real Dashboard & Dynamic Data | 3 | 5 | P1 | 1.7 |
| 1.12 | Real Video Transcription & AI Improvement | 3 | 8 | P1 | 1.10 |
| 1.13 | CI/CD Pipeline Setup | 3 | 3 | P1 | 1.1, 1.2 |
| 1.14 | Multi-tenancy & Church Isolation | 4 | 8 | P2 | 1.7, 1.8 |
| 1.15 | TypeScript Strict Mode, Error Boundaries & Polish | 4 | 8 | P2 | 1.7 |
| 1.16 | Accessibility Audit & Full WCAG 2.1 AA Compliance | 5 | 5 | P2 | 1.5, 1.15 |
| 1.17 | Test Coverage Expansion & E2E Tests | 5 | 8 | P2 | 1.2, 1.7 |

**Total: 17 stories, 90 SP (~360h com margem)**

## Riscos

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|-------------|---------|----------|
| Supabase auth migration quebra login | Medium | Critical | Spike de 2h antes de commitar. Manter Firebase Auth como fallback |
| CDN removal quebra runtime (GenAI version gap 0.1.1 vs 1.30.0) | High | High | Upgrade @google/genai para ^1.30.0 ANTES de remover CDN. Testar geminiService.ts |
| Zero testes durante refactoring massivo | High | Critical | SYS-007 e P0 — smoke tests ANTES de CDN removal ou Supabase migration |
| Gemini API cost escalation (key exposta) | High | High | SYS-002 + DB-010 + DB-017 como iniciativa unica com rate limiting |
| Base64 image memory pressure | Medium | Medium | Storage migration (DB-007) antes de load testing |
| @google/genai API breaking changes apos upgrade | Medium | High | Mapear diferencas de API entre 0.1.1 e 1.30.0 antes do upgrade |

## Tracks Paralelos

```
Track A (DB/Backend):  Supabase Setup -> Auth -> Profiles -> Schema -> RLS -> Multi-tenancy
Track B (Build/Quality): CDN Removal -> Tailwind Build -> Test Infra -> Lint -> CI/CD
Track C (UX/A11Y):     shadcn/ui Setup -> Form Validation -> Aria Labels -> D&D -> Progress
```

Tracks A, B e C sao independentes ate DB-001 (persistence) completar, quando Track C precisa de dados reais.

---

*Epic criado por Morgan (@pm) — AIOX Product Management Agent*
*Base: Technical Debt Assessment v1.0 FINAL (QA Score 4.4/5.0)*
*Brownfield Discovery Phase 10 — Epic Planning*
