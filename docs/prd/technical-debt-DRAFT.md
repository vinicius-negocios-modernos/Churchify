# Technical Debt Assessment -- Churchify (DRAFT)
## Para Revisao dos Especialistas

**Projeto:** Churchify -- Sermon/Episode Management with AI
**Data:** 2026-03-06
**Status:** DRAFT -- Pendente validacao de @data-engineer, @ux-design-expert e @qa
**Autor:** Aria (@architect) -- Phase 4 Brownfield Discovery

---

## 1. Executive Summary (DRAFT)

Churchify is an early-stage prototype (v0.0.1) originally generated via Google AI Studio. The codebase has **significant technical debt across all layers** that must be addressed before any public deployment.

| Metric | Value |
|--------|-------|
| **Total debts identified** | 40 (deduplicated) |
| **Critical (P0)** | 7 |
| **High (P1)** | 12 |
| **Medium (P2)** | 14 |
| **Low (P3)** | 7 |
| **Estimated total effort** | ~180-240 hours |
| **Areas affected** | Security, Architecture, Database, Frontend, UX, Quality |

**Top 3 risks:**
1. **Gemini API key exposed in client bundle** -- anyone can extract and abuse the key (SYS-002 / FE-005)
2. **Zero data persistence** -- all AI-generated content lost on page refresh (DB-001 / SYS-012 / UX-005)
3. **Dual module loading (CDN + npm)** -- version mismatches cause unpredictable behavior (SYS-003 / FE-002 / FE-003)

---

## 2. Debitos de Sistema (@architect)

Source: `docs/architecture/system-architecture.md`

| ID | Debito | Severidade | Categoria | Impacto | Esforco Est. | File(s) |
|----|--------|-----------|-----------|---------|-------------|---------|
| SYS-001 | Firebase credentials hardcoded as placeholders (`YOUR_API_KEY_HERE`) | **Critical** | Security | App cannot authenticate without manual code editing | 2h | `lib/firebase.ts:12-17` |
| SYS-002 | Gemini API key exposed in client-side bundle via `process.env.API_KEY` | **Critical** | Security | Anyone can extract API key from built JS files | 8-16h | `vite.config.ts:14`, `services/geminiService.ts:70-71` |
| SYS-003 | Dual module loading: CDN importmap (React 19, GenAI 1.30) + npm packages (React 18, GenAI 0.1.1) | **High** | Architecture | Version mismatch causes unpredictable runtime behavior | 4h | `index.html:29-45`, `package.json:11-17` |
| SYS-004 | Tailwind loaded via CDN (`cdn.tailwindcss.com`) instead of build pipeline | **High** | Architecture | ~3MB unminified CSS per page load; not tree-shakeable; no custom config | 4h | `index.html:7` |
| SYS-005 | Dashboard uses 100% hardcoded mock data | **High** | Feature Gap | Users see fake stats with no real information | 8-12h | `pages/Dashboard.tsx:7-17` |
| SYS-006 | Firestore and Storage initialized but never used (dead imports) | **Medium** | Dead Code | Unnecessary SDK code in bundle | 1h | `lib/firebase.ts:29-30` |
| SYS-007 | No test infrastructure (zero test files, no test runner) | **High** | Quality | Zero test coverage; no regression safety net | 8h | `package.json:6-9` |
| SYS-008 | No linting or formatting config (no ESLint, Prettier) | **High** | Quality | No code style enforcement | 4h | `package.json` |
| SYS-009 | TypeScript strict mode disabled | **Medium** | Quality | Allows type-unsafe code silently | 4-8h | `tsconfig.json` |
| SYS-010 | No React Error Boundary | **Medium** | Reliability | Runtime error crashes entire app (white screen) | 2h | `App.tsx`, `index.tsx` |
| SYS-011 | `Header.tsx` is dead code (never imported) | **Low** | Dead Code | Confusing unused component | 0.5h | `components/Header.tsx` |
| SYS-012 | No data persistence for AI analysis results | **High** | Feature Gap | Page refresh or navigation loses ALL generated content | 16-24h | `pages/NewEpisode.tsx:11` |
| SYS-013 | Gemini does NOT actually analyze the YouTube video (guesses from title) | **High** | Feature Gap | AI content is based on inference, not actual video transcription | 16-24h | `services/geminiService.ts:78-107` |
| SYS-014 | Base64 images stored in React state (2-10MB per session) | **Medium** | Performance | Memory pressure, slow renders, images not downloadable later | 4-8h | `pages/NewEpisode.tsx:55`, `services/geminiService.ts:163` |
| SYS-015 | No input validation/sanitization; uses `alert()` for validation | **Medium** | Security | YouTube URL not validated; XSS risk on rendered results | 4h | `components/SermonForm.tsx:32-33` |
| SYS-016 | Church name and plan hardcoded in sidebar ("Igreja Batista", "Plano Free") | **Low** | Feature Gap | No church/org management | 8h | `components/Layout.tsx:64-65` |
| SYS-017 | No `src/` directory convention (all source at root) | **Low** | Structure | Non-standard; harder gitignore/build config | 4h | Root directory |
| SYS-018 | `experimentalDecorators` enabled but unused | **Low** | Config | Unnecessary tsconfig option | 0.5h | `tsconfig.json:4` |
| SYS-019 | Missing `postcss.config.js` and `tailwind.config.js` | **Medium** | Build | PostCSS/Tailwind installed but unconfigured; custom animations undefined | 2h | Missing files |
| SYS-020 | No loading skeleton or optimistic UI | **Low** | UX | No skeleton screens; spinner-only feedback | 4h | `pages/NewEpisode.tsx:97-103` |
| SYS-021 | `.env.example` is AIOX template, not app-specific | **Medium** | Config | Missing `GEMINI_API_KEY` and Firebase guidance | 1h | `.env.example` |
| SYS-022 | No favicon, PWA manifest, or social meta tags | **Low** | UX | Basic polish missing | 2h | `index.html` |

---

## 3. Debitos de Database (@data-engineer)

Source: `docs/database/DB-AUDIT.md`, `docs/database/SCHEMA.md`

| ID | Debito | Severidade | Categoria | Impacto | Esforco Est. | Notes |
|----|--------|-----------|-----------|---------|-------------|-------|
| DB-001 | No data persistence -- all analysis results lost on refresh | **Critical** | Persistence | Zero product value retention; users lose everything | 24-32h | Cross-ref: SYS-012, UX-005. Need Firestore collections for episodes, results, images |
| DB-002 | Firebase config uses placeholder credentials | **Critical** | Config | App cannot function in production | 2h | Cross-ref: SYS-001, FE-004. Deduped under SYS-001 as primary |
| DB-003 | No `firebase.json` -- project not initialized with Firebase CLI | **High** | Infrastructure | Cannot deploy rules, hosting, or run emulators | 1h | Need `firebase init` |
| DB-004 | No Firestore Security Rules file | **High** | Security | Default rules (deny all or allow all) | 8h | Design per-collection rules |
| DB-005 | No Storage Security Rules file | **High** | Security | No access control for future uploads | 4h | Design user-scoped upload rules |
| DB-006 | Dashboard uses hardcoded mock data | **High** | Data | Fake stats mislead users | 8h | Cross-ref: SYS-005, FE-007. Deduped under SYS-005 as primary |
| DB-007 | Generated images stored as base64 in memory only | **Medium** | Storage | Images not persistable or downloadable later | 8h | Cross-ref: SYS-014, FE-012. Upload to Firebase Storage |
| DB-008 | No user profile collection | **Medium** | Data Model | Cannot store preferences, church info, subscription plan | 8h | Create `users/{uid}` on first sign-in |
| DB-009 | No multi-tenancy / church isolation | **Medium** | Architecture | App sidebar hardcodes "Igreja Batista"; no org scoping | 16-24h | Cross-ref: SYS-016. Design tenant model |
| DB-010 | Gemini API key -- no per-user key management or usage tracking | **Medium** | Security | Single shared key; no rate limiting per user/church | 8h | Cross-ref: SYS-002. Proxy via Cloud Functions |
| DB-011 | No data export/backup strategy | **Low** | Operations | No recovery mechanism | 4h | Firestore scheduled backups |
| DB-012 | No offline support or caching | **Low** | Resilience | App requires constant connectivity | 2h | Enable `enableIndexedDbPersistence` |

> **PENDENTE:** Revisao do @data-engineer -- Validar esforcos estimados, confirmar schema proposto em DB-AUDIT.md, e priorizar DB-004 vs DB-005.

---

## 4. Debitos de Frontend/UX (@ux-design-expert)

Source: `docs/frontend/frontend-spec.md`

### 4.1 Frontend Technical Debts

| ID | Debito | Severidade | Categoria | Impacto | Esforco Est. | File(s) |
|----|--------|-----------|-----------|---------|-------------|---------|
| FE-001 | Tailwind CSS via CDN instead of build pipeline | **Critical** | Performance | ~3MB unminified on every load; not for production | 4h | Cross-ref: SYS-004. Deduped under SYS-004 |
| FE-002 | Import map loads from aistudiocdn.com, bypassing Vite | **Critical** | Architecture | No tree-shaking, code splitting, or minification | 4h | Cross-ref: SYS-003. Deduped under SYS-003 |
| FE-003 | Version mismatch: importmap React 19 vs package.json React 18 | **High** | Architecture | Runtime inconsistencies | 2h | Cross-ref: SYS-003. Resolved with SYS-003 |
| FE-004 | Firebase config has hardcoded placeholder values | **High** | Security | Cannot function without code editing | 2h | Cross-ref: SYS-001, DB-002. Deduped under SYS-001 |
| FE-005 | Gemini API key exposed in client bundle | **Critical** | Security | API key visible to any user | 8-16h | Cross-ref: SYS-002. Deduped under SYS-002 |
| FE-006 | Header.tsx is dead code | **Low** | Maintenance | Unused component | 0.5h | Cross-ref: SYS-011. Deduped under SYS-011 |
| FE-007 | Dashboard entirely hardcoded | **High** | Functionality | No real value to users | 8h | Cross-ref: SYS-005, DB-006. Deduped under SYS-005 |
| FE-008 | No state management beyond React Context | **Medium** | Architecture | Will become problematic as app grows | 8h | Consider Zustand or React Query |
| FE-009 | No test files exist | **High** | Quality | Zero test coverage | 8h | Cross-ref: SYS-007. Deduped under SYS-007 |
| FE-010 | No ESLint or Prettier configuration | **Medium** | Quality | No style enforcement | 4h | Cross-ref: SYS-008. Deduped under SYS-008 |
| FE-011 | No error boundary component | **Medium** | Reliability | Unhandled errors crash app | 2h | Cross-ref: SYS-010. Deduped under SYS-010 |
| FE-012 | Base64 images stored in React state | **Medium** | Performance | Large strings in memory; lost on navigation | 8h | Cross-ref: SYS-014, DB-007. Deduped under SYS-014 |
| FE-013 | Firestore and Storage SDK initialized but unused | **Low** | Bundle Size | Unnecessary code loaded | 1h | Cross-ref: SYS-006. Deduped under SYS-006 |
| FE-014 | No `tailwind.config.js` file; custom animations undefined | **Medium** | Build | `animate-fade-in-up` referenced but not defined | 2h | Cross-ref: SYS-019. Deduped under SYS-019 |
| FE-015 | TypeScript not in strict mode | **Medium** | Build | Type safety gaps | 4h | Cross-ref: SYS-009. Deduped under SYS-009 |

### 4.2 UX Debts

| ID | Debito | Severidade | Categoria | Impacto | Esforco Est. | File(s) |
|----|--------|-----------|-----------|---------|-------------|---------|
| UX-001 | Dashboard entirely hardcoded placeholder data | **High** | Functionality | Users see fake stats | 8h | Cross-ref: SYS-005. Deduped under SYS-005 |
| UX-002 | `alert()` used for form validation | **Medium** | UX | Jarring native dialog breaks polished feel | 2h | `components/SermonForm.tsx:33` |
| UX-003 | Drag-and-drop upload area visual but non-functional | **Medium** | UX | Users expect D&D from dashed-border area | 4h | `components/SermonForm.tsx:104` |
| UX-004 | No file size validation for thumbnail upload (10MB label exists) | **Medium** | UX | Users can upload huge files; slow base64 conversion | 1h | `components/SermonForm.tsx` |
| UX-005 | No way to save/export generated results | **Critical** | Functionality | All AI content lost on navigation/refresh | 16h | Cross-ref: DB-001, SYS-012. Resolved with DB-001 |
| UX-006 | No loading skeleton on Dashboard | **Low** | UX | Will flash when real data added | 2h | Cross-ref: SYS-020 |
| UX-007 | Church name/plan hardcoded in sidebar | **Medium** | UX | Static "Igreja Batista" / "Plano Free" | 4h | Cross-ref: SYS-016, DB-009 |
| UX-008 | No confirmation before logout | **Low** | UX | Single-click logout | 1h | `components/Layout.tsx` |
| UX-009 | No error recovery on Gemini API failure | **Medium** | UX | User must re-submit entire form | 2h | `pages/NewEpisode.tsx` |
| UX-010 | CSS animation classes referenced but not defined | **Low** | UX | `animate-fade-in-up` has no effect | 1h | Cross-ref: SYS-019 |
| UX-011 | No progress indicator for AI processing duration | **Medium** | UX | User has no idea how long to wait | 4h | `pages/NewEpisode.tsx` |
| UX-012 | Terms of Service and Privacy Policy links are plain text | **Low** | UX | Login page mentions TOS but not clickable | 1h | `pages/Login.tsx` |

### 4.3 Accessibility Debts

| ID | Debito | Severidade | WCAG | Impacto | Esforco Est. | File(s) |
|----|--------|-----------|------|---------|-------------|---------|
| A11Y-001 | Mobile menu button has no aria-label | **High** | A | Screen readers cannot identify button purpose | 0.5h | `Layout.tsx:119` |
| A11Y-002 | Close menu button has no aria-label | **High** | A | Same as above | 0.5h | `Layout.tsx:52-57` |
| A11Y-003 | Form validation via `alert()` not screen reader friendly | **High** | A | Accessibility barrier for validation feedback | 2h | `SermonForm.tsx:33` |
| A11Y-004 | No skip-to-content link | **Medium** | A | Keyboard users must tab through nav every time | 1h | `Layout.tsx` |
| A11Y-005 | Sidebar overlay has no aria attributes | **Medium** | A | Overlay not announced to assistive tech | 0.5h | `Layout.tsx:33-36` |
| A11Y-006 | Copy buttons lack descriptive aria-labels | **Medium** | A | Multiple identical unlabeled buttons | 2h | `ResultsDisplay.tsx` |
| A11Y-007 | Color contrast: `text-gray-400` on white bg | **Medium** | AA | Fails contrast ratio | 2h | Multiple locations |
| A11Y-008 | No focus management on mobile menu open/close | **Medium** | AA | Focus not trapped in overlay | 2h | `Layout.tsx:18` |
| A11Y-009 | Loading state not announced via aria-live | **Medium** | A | Screen readers miss loading updates | 1h | `NewEpisode.tsx:97-103` |
| A11Y-010 | Generated images lack meaningful alt text | **Medium** | A | Images not described for assistive tech | 1h | `ResultsDisplay.tsx:195,220` |

> **PENDENTE:** Revisao do @ux-design-expert -- Validar severidades de UX debts, recomendar design system, priorizar a11y fixes.

---

## 5. Matriz Preliminar de Priorizacao

### P0 -- Critical (Must Fix Before Any Deployment)

| Prioridade | ID | Debito | Area | Severidade | Esforco Est. |
|-----------|-----|--------|------|-----------|-------------|
| P0-1 | SYS-002 | Gemini API key exposed in client bundle | Security | Critical | 8-16h |
| P0-2 | SYS-001 | Firebase credentials hardcoded as placeholders | Security | Critical | 2h |
| P0-3 | SYS-003 | Dual module loading (CDN importmap + npm) | Architecture | Critical | 4h |
| P0-4 | SYS-004 | Tailwind via CDN (not for production) | Architecture | Critical | 4h |
| P0-5 | DB-001 | No data persistence layer | Persistence | Critical | 24-32h |
| P0-6 | DB-004 | No Firestore Security Rules | Security | High | 8h |
| P0-7 | DB-003 | Firebase project not initialized (no firebase.json) | Infrastructure | High | 1h |

### P1 -- High (Before Beta/User Testing)

| Prioridade | ID | Debito | Area | Severidade | Esforco Est. |
|-----------|-----|--------|------|-----------|-------------|
| P1-1 | SYS-007 | No test infrastructure | Quality | High | 8h |
| P1-2 | SYS-008 | No linting/formatting config | Quality | High | 4h |
| P1-3 | SYS-005 | Dashboard hardcoded mock data | Feature Gap | High | 8-12h |
| P1-4 | SYS-013 | Gemini doesn't analyze actual video | Feature Gap | High | 16-24h |
| P1-5 | SYS-012 | No persistence for analysis results | Feature Gap | High | 16-24h |
| P1-6 | DB-005 | No Storage Security Rules | Security | High | 4h |
| P1-7 | DB-008 | No user profile collection | Data Model | Medium | 8h |
| P1-8 | FE-008 | No state management beyond Context | Architecture | Medium | 8h |
| P1-9 | A11Y-001 | Mobile menu missing aria-label | a11y | High | 0.5h |
| P1-10 | A11Y-002 | Close menu missing aria-label | a11y | High | 0.5h |
| P1-11 | A11Y-003 | Form validation not accessible | a11y | High | 2h |
| P1-12 | SYS-019 | Missing tailwind.config.js / postcss.config.js | Build | Medium | 2h |

### P2 -- Medium (Before Production Launch)

| Prioridade | ID | Debito | Area | Severidade | Esforco Est. |
|-----------|-----|--------|------|-----------|-------------|
| P2-1 | SYS-009 | TypeScript strict mode disabled | Quality | Medium | 4-8h |
| P2-2 | SYS-010 | No React Error Boundary | Reliability | Medium | 2h |
| P2-3 | SYS-014 | Base64 images in React state | Performance | Medium | 4-8h |
| P2-4 | SYS-015 | No input validation/sanitization | Security | Medium | 4h |
| P2-5 | SYS-021 | .env.example is AIOX template | Config | Medium | 1h |
| P2-6 | DB-009 | No multi-tenancy / church isolation | Architecture | Medium | 16-24h |
| P2-7 | DB-010 | No API key management / usage tracking | Security | Medium | 8h |
| P2-8 | UX-002 | alert() for form validation | UX | Medium | 2h |
| P2-9 | UX-003 | D&D upload visual but non-functional | UX | Medium | 4h |
| P2-10 | UX-004 | No file size validation | UX | Medium | 1h |
| P2-11 | UX-009 | No error recovery on API failure | UX | Medium | 2h |
| P2-12 | UX-011 | No progress indicator for AI processing | UX | Medium | 4h |
| P2-13 | A11Y-004 thru A11Y-010 | Remaining accessibility issues (batch) | a11y | Medium | 10h |
| P2-14 | SYS-006 | Firestore/Storage dead imports | Dead Code | Medium | 1h |

### P3 -- Low (Quality of Life / Polish)

| Prioridade | ID | Debito | Area | Severidade | Esforco Est. |
|-----------|-----|--------|------|-----------|-------------|
| P3-1 | SYS-011 | Header.tsx dead code | Dead Code | Low | 0.5h |
| P3-2 | SYS-016 | Church name/plan hardcoded | Feature Gap | Low | 8h |
| P3-3 | SYS-017 | No src/ directory convention | Structure | Low | 4h |
| P3-4 | SYS-018 | Unused experimentalDecorators | Config | Low | 0.5h |
| P3-5 | SYS-022 | No favicon/PWA/meta tags | UX | Low | 2h |
| P3-6 | DB-011 | No data export/backup strategy | Operations | Low | 4h |
| P3-7 | DB-012 | No offline support/caching | Resilience | Low | 2h |

---

## 6. Debitos Cross-Cutting

These debts span multiple areas and appear in multiple source documents:

### 6.1 No Data Persistence (SYS-012 + DB-001 + UX-005)
- **System:** Results exist only in React state (`NewEpisode.tsx:11`)
- **Database:** No Firestore collections, queries, or writes exist
- **UX:** Users lose all AI-generated content on refresh/navigation
- **Resolution:** Single initiative -- design Firestore schema, implement CRUD, wire to UI
- **Primary owner:** @data-engineer (schema) + @dev (implementation)
- **Estimated effort:** 24-32h total

### 6.2 API Key Security (SYS-002 + DB-010 + FE-005)
- **System:** Gemini API key injected into client JS via `vite.config.ts`
- **Database:** No per-user key management or rate limiting
- **Frontend:** Key visible in browser dev tools
- **Resolution:** Create backend proxy (Firebase Functions), add per-user usage tracking
- **Primary owner:** @dev (backend) + @data-engineer (usage tracking schema)
- **Estimated effort:** 16-24h total

### 6.3 Firebase Credentials (SYS-001 + DB-002 + FE-004)
- **System:** Hardcoded `YOUR_API_KEY_HERE` placeholders
- **Database:** No `firebase.json`, no Firebase CLI init
- **Frontend:** Cannot function without manual code editing
- **Resolution:** Move to env vars (`import.meta.env.VITE_FIREBASE_*`), run `firebase init`
- **Primary owner:** @dev
- **Estimated effort:** 3h total

### 6.4 CDN Dependency Anti-Pattern (SYS-003 + SYS-004 + FE-001 + FE-002 + FE-003)
- **System:** Both Tailwind and app dependencies loaded from CDN
- **Frontend:** importmap from aistudiocdn.com bypasses Vite entirely; version mismatches
- **Resolution:** Remove all CDN references from `index.html`, configure Tailwind build pipeline, let Vite bundle everything
- **Primary owner:** @dev
- **Estimated effort:** 8h total

### 6.5 Quality Infrastructure (SYS-007 + SYS-008 + SYS-009 + FE-009 + FE-010 + FE-015)
- **System:** No tests, no linting, no strict TypeScript
- **Frontend:** Zero test coverage, no style enforcement
- **Resolution:** Install Vitest + RTL + ESLint + Prettier; enable strict mode; create initial test suite
- **Primary owner:** @dev (setup) + @qa (test strategy)
- **Estimated effort:** 16-20h total

### 6.6 Dashboard Mock Data (SYS-005 + DB-006 + FE-007 + UX-001)
- **System/DB/FE/UX:** Dashboard shows hardcoded fake stats
- **Resolution:** Depends on DB-001 (persistence layer); then query real data
- **Primary owner:** @dev (after @data-engineer designs schema)
- **Estimated effort:** 8-12h (after persistence layer exists)

---

## 7. Dependencias entre Debitos

```
DB-003 (firebase init)
  |
  v
SYS-001 (env vars) -----> DB-004 (security rules) -----> DB-005 (storage rules)
  |                              |
  v                              v
DB-001 (persistence) -------> SYS-005 (dashboard real data)
  |                              |
  |                              v
  |                         DB-008 (user profiles) --> DB-009 (multi-tenancy)
  |
  v
SYS-014 (images to Storage) --> DB-007 (image persistence)
  |
  v
SYS-012 (save analysis results) --> UX-005 (save/export)

SYS-003 (remove CDN importmap)
  |
  v
SYS-004 (configure Tailwind build) --> SYS-019 (tailwind.config.js)

SYS-002 (backend proxy for Gemini)
  |
  v
DB-010 (per-user API key management)
  |
  v
SYS-013 (actual video transcription)

SYS-007 (test infra) + SYS-008 (lint infra)
  |
  v
SYS-009 (strict TypeScript) -- run after lint fixes
```

**Critical path:** DB-003 -> SYS-001 -> DB-001 -> SYS-005/SYS-012

---

## 8. Perguntas para Especialistas

### Para @data-engineer:
1. O schema proposto em `docs/database/DB-AUDIT.md` (users/{uid}, churches/{churchId}/episodes/{episodeId}) e adequado? Ou devemos considerar uma estrutura diferente para Firestore?
2. As Security Rules (DB-004) devem ser user-scoped ou church-scoped? Qual o modelo de permissoes recomendado?
3. Para DB-009 (multi-tenancy): devemos usar subcollections dentro de `churches/` ou top-level collections com `churchId` field? Trade-offs de query performance?
4. Esforco estimado para DB-001 (persistence layer completa): 24-32h e realista? Ou mais/menos?
5. Firestore vs Supabase (PostgreSQL): dado que o projeto usa Firebase Auth, manter Firestore faz sentido? Ou migrar para Supabase traria beneficios (SQL, RLS nativo, real-time)?
6. DB-007 (images): Firebase Storage ou Cloud Storage direto? Limites de tamanho e custo para imagens geradas por AI?

### Para @ux-design-expert:
1. Design system: devemos adotar um component library (Radix UI, Shadcn/UI, Headless UI) ou manter Tailwind puro? A11Y seria muito mais facil com componentes pre-acessiveis.
2. A11Y: qual o nivel de conformidade WCAG alvo (A, AA, AAA)? A maioria dos debts listados sao Level A.
3. UX-003 (drag-and-drop): implementar D&D completo ou remover a sugestao visual e manter click-only?
4. UX-011 (progress indicator): estimativa de tempo ou barra de progresso simulada? O tempo de Gemini e variavel.
5. Mobile-first: a implementacao responsiva atual e boa. Ha algo especifico a melhorar para o publico-alvo (equipes de midia de igrejas)?
6. Severidade de UX-002 (`alert()`) vs UX-009 (no retry) -- qual priorizar?

### Para @qa:
1. Qual o test coverage target para MVP (70%? 80%?)? Quais componentes sao prioritarios para testes?
2. Estrategia de testes: unit tests (Vitest), integration tests (RTL), e2e (Playwright)? Ou comecar com unit + integration?
3. SYS-013 (Gemini nao analisa video real): como testar a integracao AI? Mocks, snapshots, ou golden files?
4. Quality gates: quais checks automaticos devem bloquear PR merge? (lint, typecheck, test, coverage threshold?)
5. Performance testing: necessario para MVP ou adiavel? (Considerando base64 images em state, Tailwind CDN)
6. A11Y testing: integrar axe-core nos testes automaticos ou auditar manualmente?

---

*DRAFT -- Nao utilizar para planejamento ate validacao completa pelos especialistas (@data-engineer, @ux-design-expert, @qa)*

*Proximo passo: Phase 5 (@data-engineer review) -> Phase 6 (@ux-design-expert review) -> Phase 7 (@qa gate)*
