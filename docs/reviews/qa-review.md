# QA Review -- Technical Debt Assessment

**Reviewer:** Quinn (@qa)
**Date:** 2026-03-06
**Assessment Version:** DRAFT v1
**Input Documents:** `technical-debt-DRAFT.md`, `db-specialist-review.md`, `ux-specialist-review.md`, `system-architecture.md`, `DB-AUDIT.md`, `frontend-spec.md`, plus all source code files

---

## Gate Status: APPROVED

The assessment is comprehensive, well-structured, and ready for finalization. All three specialist reviews (@architect, @data-engineer, @ux-design-expert) are consistent, thorough, and actionable. Minor gaps identified below should be addressed in the final document but do NOT block progression to Phase 8.

---

## Assessment Quality Score

| Dimension | Score (1-5) | Notes |
|-----------|------------|-------|
| Completeness | 4 | All major areas covered. Minor gaps in CI/CD, environment management, and error logging strategy. No analysis of `metadata.json` or deployment pipeline |
| Accuracy | 5 | All claims verified against source code. File references, line numbers, and code behavior descriptions are accurate |
| Consistency | 4 | 3 reviews are well-aligned. Minor severity disagreements exist but are justified and documented. Deduplication is clean with cross-references |
| Actionability | 5 | Every debt has estimated hours, clear resolution steps, dependencies mapped, and ownership assigned. Supabase schema is production-ready SQL |
| Risk Coverage | 4 | Security, performance, and UX risks well-covered. Missing: rate limiting at app level, CORS/CSP headers, dependency vulnerability audit |
| **Average** | **4.4** | Strong assessment. Above threshold for APPROVED (>= 4.0) |

---

## Gaps Identified

### Missing Analysis Areas

1. **CI/CD Pipeline** -- No debt identified for the complete absence of CI/CD. No GitHub Actions, no deployment workflow, no automated quality gates. This is a systemic gap that should be a P1 debt (SYS-023 suggested: "No CI/CD pipeline -- no automated build, test, deploy, or quality gate").

2. **Dependency Security** -- No `npm audit` or vulnerability scanning mentioned. The project uses `@google/genai@^0.1.1` (very early version) and Firebase 10.8.0. No analysis of known CVEs or outdated packages.

3. **Environment Management** -- Beyond `.env.example` being wrong (SYS-021), there is no `.env.local.example`, no documentation on how to set up a dev environment from scratch, and no validation that required env vars are present at startup (Vite silently injects `undefined` if `GEMINI_API_KEY` is missing).

4. **CORS and CSP Headers** -- `index.html` loads scripts from 3 different domains (cdn.tailwindcss.com, aistudiocdn.com, fonts.googleapis.com) with no Content Security Policy. Post-CDN-removal this becomes less critical, but CSP should still be configured.

5. **Logging and Monitoring** -- No structured logging. All errors go to `console.error`. No error reporting service (Sentry, LogRocket). Not a debt per se at prototype stage, but should be mentioned in recommendations for production readiness.

6. **`metadata.json`** -- File mentioned in architecture doc but never analyzed. Contains AI Studio metadata that may be dead weight.

### Incomplete Debts

1. **SYS-002 (API key exposure)** -- Effort estimate ranges widely (8-16h). The DRAFT should clarify: if using Supabase Edge Functions (as @data-engineer recommends), the proxy setup is ~4-6h, not 16h. The estimate should be updated post-Supabase decision.

2. **DB-001 (persistence)** -- Three different estimates exist: DRAFT says 24-32h, @data-engineer says 28h, but this does NOT include the Supabase migration overhead (auth reimplementation adds ~10h). The final doc should present: "28h if Supabase decision is made first; 38h total including migration from Firebase Auth."

3. **SYS-013 (Gemini doesn't analyze video)** -- Estimated at 16-24h but no solution architecture is proposed. Requires: YouTube transcript API integration, prompt rewrite, fallback for videos without transcripts. This is a significant feature gap that should have a mini-spec in the final document.

---

## Cross-Area Risk Assessment

| Risk | Areas Affected | Probability | Impact | Mitigation |
|------|---------------|-------------|--------|-----------|
| **Supabase migration breaks Auth** | DB, FE, UX | Medium | Critical | @data-engineer suggests 2h spike first. Agreed -- spike before committing to full migration. Keep Firebase Auth as fallback plan |
| **CDN removal breaks runtime** | FE, Build | High | High | Import map and npm versions differ significantly (React 19 vs 18, GenAI 1.30 vs 0.1.1). Removing CDN requires careful testing of which version the app actually runs on. The app may be silently using CDN versions -- `npm install` + CDN removal could introduce breaking API changes |
| **Base64 image memory pressure** | FE, Performance | Medium | Medium | Currently tolerable for single-user prototype. Becomes critical with concurrent users. Storage migration (DB-007) must precede any load testing |
| **Gemini API cost escalation** | Security, Ops | High | High | No rate limiting, no usage tracking, key exposed. A malicious user could run up significant API costs. SYS-002 + DB-010 + DB-017 must be resolved together as a single initiative |
| **Zero test coverage during refactoring** | Quality | High | Critical | Massive refactoring (CDN removal, Supabase migration, Tailwind rebuild) with zero tests. SYS-007 (test infra) should be P0, not P1. At minimum, add smoke tests before major refactoring |
| **`@google/genai` version gap** | FE, AI | Medium | High | package.json has `^0.1.1` but CDN loads `^1.30.0`. The API surface may have changed dramatically between these versions. After CDN removal, `geminiService.ts` may need significant rewrites to work with 0.1.1 (or upgrade to ^1.30.0 in package.json) |

---

## Specialist Review Conflicts

### Severity Disagreements (All Justified)

| Debt | DRAFT | @data-engineer | @ux-design-expert | Resolution |
|------|-------|---------------|-------------------|------------|
| DB-002 | Critical | High | -- | Agree with @data-engineer: config, not vulnerability. Accept High |
| DB-004 | High | Critical | -- | Agree with @data-engineer: open data is Critical. Accept Critical |
| DB-008 | Medium | High | -- | Agree with @data-engineer: prerequisite for persistence. Accept High |
| UX-002 | Medium | -- | High | Agree with @ux-design-expert: affects 100% of validation flows + a11y. Accept High |
| UX-003 | Medium | -- | High | Agree: broken promise is worse than no feature. Accept High |
| UX-009 | Medium | -- | High | Agree: form re-fill is frustrating. Accept High |
| UX-011 | Medium | -- | High | Agree: 10-60s with no indication causes abandonment. Accept High |
| A11Y-003 | High | -- | Critical | Agree: `alert()` is genuine a11y barrier. Accept Critical |

### Alignment Points (Positive)

- Both specialists independently recommend the same direction: Supabase for DB, shadcn/ui for FE
- Deduplication strategy is consistent across all 3 reviews -- same primary IDs referenced
- Dependency chains agree across all documents
- No contradictory recommendations found

### Overlap: UX-005 vs DB-001 vs SYS-012

These three debts describe the same fundamental problem (no persistence) from three perspectives. The DRAFT correctly identifies this as a cross-cutting concern in Section 6.1. The final document should merge these into a single "Initiative" with clear sub-tasks, rather than listing them separately in priority tables. Currently the hours are counted only once (good) but the multiplicity of IDs can confuse planning.

---

## Dependencies Validation

### Critical Path (Verified)

```
Decision: Firebase vs Supabase (2h)
  |
  v
DB-003/Supabase Setup (2h) --> SYS-001/Auth Config (8h if migrating)
  |
  v
DB-008 User Profiles (2-6h) --> DB-001 Core Persistence (16-28h)
  |                                |
  |                                v
  |                           DB-004 Security Rules/RLS (4-8h)
  |                                |
  v                                v
DB-009 Multi-tenancy (16-20h)   SYS-005 Dashboard Real Data (6-12h)
```

**Validated.** The critical path is correct and consistent across all 3 reviews. The dependency chain makes logical sense -- you cannot write security rules without a schema, you cannot show real data without persistence.

### Parallel Tracks (Can Run Simultaneously)

Track A (DB/Backend): Supabase migration -> Persistence -> RLS
Track B (FE/Build): CDN removal (SYS-003) -> Tailwind config (SYS-004) -> Quality infra (SYS-007, SYS-008)
Track C (UX Quick Wins): A11Y fixes, inline validation, aria-labels

These three tracks have no cross-dependencies until Track A completes DB-001, at which point Track C needs it for UX-005 (save/export).

### Blockers

1. **Firebase vs Supabase decision** blocks ALL database work. This is Phase 0 in @data-engineer's plan and must be decided before any implementation begins.
2. **SYS-003 (CDN removal)** is a blocker for SYS-004 (Tailwind config) and potentially for SYS-013 (Gemini version). The GenAI version gap (0.1.1 vs 1.30.0) means CDN removal requires simultaneous `package.json` updates.
3. **SYS-007 (test infra)** should be a soft-blocker for major refactoring. Recommend elevating to P0 or early P1.

---

## Testing Strategy (Post-Resolution)

### Test Coverage Target

- **MVP:** 60% line coverage minimum (focus on critical paths)
- **Production:** 80% line coverage minimum
- **Strategy:** Unit + Integration first; E2E after core flows stabilize

### Unit Tests Required

| Area | Files | Priority | Framework |
|------|-------|----------|-----------|
| Auth | `contexts/AuthContext.tsx` | High | Vitest + React Testing Library (RTL) |
| Gemini Service | `services/geminiService.ts` | High | Vitest with mocked `@google/genai` |
| Types/Validation | `types.ts` + future validators | Medium | Vitest |
| Form Logic | `components/SermonForm.tsx` | High | Vitest + RTL |
| Results Display | `components/ResultsDisplay.tsx` | Medium | Vitest + RTL (copy-to-clipboard, conditional rendering) |

### Integration Tests Required

| Flow | Components | Priority |
|------|-----------|----------|
| Auth flow (login -> redirect -> protected route) | AuthContext + App + Login | High |
| Sermon submission (form -> API -> results) | SermonForm + NewEpisode + geminiService (mocked) | High |
| Dashboard data loading | Dashboard + Supabase queries (mocked) | Medium |
| Persistence (save -> reload -> display) | NewEpisode + Supabase client (mocked) | High |

### E2E Tests Required

| User Flow | Tool | Priority |
|-----------|------|----------|
| Login with Google -> Dashboard -> New Episode -> Submit -> See Results | Playwright | High |
| Login -> New Episode -> Submit -> Navigate Away -> Come Back -> See Saved Results | Playwright | High |
| Login -> Dashboard -> Verify Real Stats (after persistence) | Playwright | Medium |
| Mobile: Sidebar navigation, form submission, copy-to-clipboard | Playwright (mobile viewport) | Medium |

### Performance Tests

| Metric | Target | Tool |
|--------|--------|------|
| Initial load time (post-CDN removal) | < 2s on 4G | Lighthouse CI |
| Gemini API response time | Track p50/p95/p99 | Custom metrics in Edge Function |
| Bundle size | < 500KB gzipped (post-CDN removal, tree-shaking) | `vite-plugin-inspect` or `source-map-explorer` |
| Memory usage with base64 images | < 50MB per session | Chrome DevTools Protocol |

### AI Integration Testing (SYS-013)

- **Mocking strategy:** Mock `@google/genai` at module level for unit/integration tests. Use golden file responses (snapshot of real API output) for consistency.
- **Contract tests:** Validate that `AnalysisResult` schema matches Gemini's `responseSchema` definition. If schema changes, tests should catch type mismatches.
- **Integration smoke test:** One real API call in CI (rate-limited, uses test API key) to catch API breaking changes. Run weekly, not per-commit.

---

## Security Review

| Concern | Severity | Current Status | Required Action |
|---------|----------|---------------|----------------|
| Gemini API key in client bundle | **Critical** | Exposed via `process.env.API_KEY` in built JS. Verified in `vite.config.ts:14` | Move to Supabase Edge Function proxy. NEVER in client code |
| Firebase config placeholders | **Critical** | Hardcoded `YOUR_API_KEY_HERE` in `lib/firebase.ts:12`. Not using env vars | Move to `import.meta.env.VITE_FIREBASE_*` pattern |
| No CSP headers | **Medium** | `index.html` loads from 3+ external domains. No Content-Security-Policy | Add CSP meta tag or HTTP header after CDN removal |
| No input sanitization | **Medium** | YouTube URL not validated (format, domain). Gemini output rendered without sanitization | Add URL regex validation. Sanitize AI output before rendering (DOMPurify or React's built-in JSX escaping -- verify sufficiency) |
| No Firestore/Supabase security rules | **Critical** | Zero access control on data layer | Implement RLS policies as designed by @data-engineer |
| No rate limiting (API) | **High** | Anyone with the exposed API key can make unlimited Gemini calls | Edge Function proxy with per-user rate limits (DB-010 + DB-017) |
| No HTTPS enforcement | **Low** | Dev only so far. Supabase/Vercel enforce HTTPS by default | Ensure deployment platform enforces HTTPS. Add HSTS header |
| XSS via AI-generated content | **Medium** | Gemini output is rendered via JSX (React escapes by default). BUT `dangerouslySetInnerHTML` could be added later | Audit for `dangerouslySetInnerHTML` usage. Currently none found -- SAFE. Add lint rule to flag future usage |
| `host: '0.0.0.0'` in vite.config.ts | **Low** | Dev server binds to all interfaces. Exposes dev server on LAN | Acceptable for dev. Remove for production builds (Vite does not use this in prod) |

---

## Recommendations for Final Assessment

1. **Add CI/CD debt (SYS-023):** The absence of any deployment pipeline is a P1 gap. Suggest: GitHub Actions with lint -> typecheck -> test -> build stages.

2. **Elevate SYS-007 (test infra) to P0:** Major refactoring without tests is high-risk. At minimum, add smoke tests for auth flow and form submission BEFORE starting CDN removal or Supabase migration.

3. **Consolidate cross-cutting debts into "Initiatives":** Section 6 of the DRAFT is excellent. The final doc should use Initiatives as the primary planning unit, not individual debt IDs. Suggested initiatives:
   - **Initiative 1:** Platform Decision + Migration (Supabase)
   - **Initiative 2:** Build Pipeline Fix (CDN removal + Tailwind + quality tools)
   - **Initiative 3:** Core Persistence Layer
   - **Initiative 4:** Security Hardening (API proxy + RLS + input validation)
   - **Initiative 5:** UX/A11Y Quick Wins
   - **Initiative 6:** Feature Completion (video transcription, dashboard, multi-tenancy)

4. **Clarify GenAI version situation:** The final doc must explicitly state that `package.json` has `@google/genai@^0.1.1` while CDN loads `^1.30.0`. After CDN removal, the package.json version will be used. The API surface likely changed -- `geminiService.ts` may need rewrites. Add this as a risk note to SYS-003.

5. **Update effort estimates post-Supabase decision:** Several estimates are conditional. The final doc should present two columns: "If Firebase" and "If Supabase" for affected debts, or commit to Supabase and present single estimates.

6. **Add "Definition of Done" for each priority band:** P0 done = deployed to staging, security audit passed. P1 done = tested, code reviewed. P2/P3 done = implemented, basic tests.

7. **Include total effort summary with confidence range:** Current total is ~180-240h (DRAFT) but specialist reviews suggest ~171.5h (89h DB + 82.5h UX) without counting SYS debts resolved by the migration. Reconcile into a single number with +/- 20% range.

---

## Parecer Final

The Technical Debt Assessment for Churchify is **thorough, accurate, and well-coordinated across all three specialist domains**. Key strengths:

- **Source code verification:** All claims I checked against actual source code were accurate. File paths, line numbers, behavior descriptions -- all correct.
- **Deduplication:** The cross-referencing system (e.g., "Cross-ref: SYS-012, UX-005. Resolved with DB-001") is clean and prevents double-counting of effort.
- **Specialist agreement:** @data-engineer and @ux-design-expert reviews are complementary, not contradictory. Both independently reached similar conclusions (Supabase, shadcn/ui) through different reasoning paths -- this increases confidence in the recommendations.
- **Actionability:** The Supabase schema SQL provided by @data-engineer is production-ready. The shadcn/ui component mapping by @ux-design-expert directly maps debts to solutions. These are not vague recommendations -- they are executable plans.

The gaps I identified (CI/CD, dependency audit, CSP, test elevation) are additive improvements, not fundamental problems with the assessment. They should be incorporated into the final document (Phase 8) but do not invalidate the analysis.

**Verdict: APPROVED -- proceed to Phase 8 (Final Assessment by @architect).**

The assessment provides a solid foundation for planning Churchify's migration from prototype to production. The Supabase migration recommendation is well-justified and should be adopted. The total estimated effort of ~170-200h (reconciled from all specialist inputs) is realistic for the scope described.

---

*QA Gate completed. Phase 7 of Brownfield Discovery is DONE.*
*Next step: Phase 8 -- @architect finalizes `technical-debt-assessment.md` incorporating all specialist reviews and QA feedback.*
