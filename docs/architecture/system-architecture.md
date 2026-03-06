# System Architecture -- Churchify

## Executive Summary

Churchify is an AI-powered SaaS platform that transforms church sermon videos into optimized digital content for Spotify and YouTube. The application takes a YouTube video URL, preacher name, and sermon title as input, then uses Google Gemini AI to generate SEO-optimized metadata (titles, descriptions, tags, key moments for shorts/reels), Spotify poll content, marketing hooks, and AI-generated thumbnail/cover art. Authentication is handled via Firebase (Google OAuth). The app is a single-page React application built with Vite and styled with Tailwind CSS.

**Current State:** Early-stage prototype (v0.0.1). The app was originally generated via Google AI Studio and has not yet undergone production hardening. Firebase credentials are placeholder, dashboard data is hardcoded, and there is no persistent data layer or backend.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **UI Framework** | React | ^18.2.0 | Functional components + hooks |
| **Build Tool** | Vite | ^5.1.4 | Dev server on port 3000 |
| **Language** | TypeScript | ^5.2.2 | Loose config (no strict mode) |
| **Styling** | Tailwind CSS | ^3.4.1 | CDN loaded in index.html + PostCSS |
| **Routing** | React Router DOM | ^6.22.0 | BrowserRouter, nested routes |
| **Icons** | Lucide React | ^0.344.0 | SVG icon library |
| **Auth** | Firebase Auth | ^10.8.0 | Google OAuth only |
| **Database** | Firebase Firestore | ^10.8.0 | Initialized but NOT used |
| **Storage** | Firebase Storage | ^10.8.0 | Initialized but NOT used |
| **AI** | Google Gemini (@google/genai) | ^0.1.1 | gemini-2.5-flash (text), gemini-2.5-flash-image (images) |
| **CSS Processing** | PostCSS + Autoprefixer | ^8.4.35 / ^10.4.17 | Standard Tailwind pipeline |

---

## Project Structure

```
Churchify/                          # Project root (flat structure, no src/ directory)
|-- index.html                      # SPA entry point (CDN Tailwind + importmap)
|-- index.tsx                       # React DOM root mount
|-- App.tsx                         # Root component (routing, auth provider)
|-- types.ts                        # TypeScript interfaces (SermonInput, AnalysisResult, etc.)
|-- vite.config.ts                  # Vite config (env loading, aliases)
|-- tsconfig.json                   # TypeScript config (loose)
|-- package.json                    # Dependencies (v0.0.1)
|-- metadata.json                   # AI Studio metadata
|-- .env.example                    # AIOX env template (not app-specific)
|-- README.md                       # Basic run instructions
|
|-- components/
|   |-- Header.tsx                  # Top header bar (UNUSED in current routing)
|   |-- Layout.tsx                  # Sidebar layout with navigation + Outlet
|   |-- ResultsDisplay.tsx          # AI analysis results renderer (306 lines)
|   |-- SermonForm.tsx              # Input form (YouTube URL, preacher, title, thumbnail)
|
|-- contexts/
|   |-- AuthContext.tsx              # Firebase Auth context (Google OAuth)
|
|-- pages/
|   |-- Login.tsx                   # Login page (Google sign-in)
|   |-- Dashboard.tsx               # Dashboard with hardcoded stats/tasks
|   |-- NewEpisode.tsx              # Main feature: form + AI analysis workflow
|
|-- services/
|   |-- geminiService.ts            # Gemini API integration (text analysis + image gen)
|
|-- lib/
|   |-- firebase.ts                 # Firebase initialization (PLACEHOLDER credentials)
|
|-- docs/                           # Documentation directory
|-- .aiox-core/                     # AIOX framework (not app code)
|-- .claude/                        # Claude Code configuration
```

---

## Component Architecture

```
BrowserRouter (index.tsx)
  |-- App (App.tsx)
       |-- AuthProvider (contexts/AuthContext.tsx)
            |-- Routes
                 |-- /login --> Login (pages/Login.tsx)
                 |-- / --> ProtectedRoute --> Layout (components/Layout.tsx)
                      |-- / (index) --> Dashboard (pages/Dashboard.tsx)
                      |-- /new-episode --> NewEpisode (pages/NewEpisode.tsx)
                      |   |-- SermonForm (components/SermonForm.tsx)
                      |   |-- ResultsDisplay (components/ResultsDisplay.tsx)
                      |-- /library --> Placeholder <div>
                      |-- /settings --> Placeholder <div>
```

**Data Flow (New Episode):**
1. User fills `SermonForm` with YouTube URL, preacher name, title, optional thumbnail
2. `NewEpisode` calls `analyzeSermonContent()` from `geminiService.ts`
3. Gemini returns structured JSON (`AnalysisResult`)
4. If thumbnail provided, `generateSermonImages()` generates 16:9 and 1:1 images
5. Results displayed via `ResultsDisplay` component
6. User can copy individual fields to clipboard

---

## State Management

- **Auth State:** React Context (`AuthContext`) wrapping the entire app. Uses Firebase `onAuthStateChanged` listener.
- **Form State:** Local `useState` in `SermonForm` (controlled inputs).
- **Results State:** Local `useState` in `NewEpisode` (loading, error, result).
- **UI State:** Local `useState` in `Layout` (mobile menu toggle), `ResultsDisplay` (copied field tracking).

There is **no global state management** library (no Redux, Zustand, Jotai, etc.). All state is component-local or via Context.

---

## Routing

| Route | Component | Auth Required | Status |
|-------|-----------|--------------|--------|
| `/login` | `Login` | No | Functional |
| `/` | `Dashboard` | Yes | UI only (hardcoded data) |
| `/new-episode` | `NewEpisode` | Yes | Functional (core feature) |
| `/library` | Placeholder `<div>` | Yes | Not implemented |
| `/settings` | Placeholder `<div>` | Yes | Not implemented |

Protected routes use `ProtectedRoute` component in `App.tsx` that checks `useAuth()` and redirects to `/login` if unauthenticated.

---

## External Integrations

### Firebase

- **Auth:** Google OAuth via `signInWithPopup` + `GoogleAuthProvider`. Auth state tracked via `onAuthStateChanged`.
- **Firestore:** Initialized (`getFirestore`) but **never used** in any component or service.
- **Storage:** Initialized (`getStorage`) but **never used** in any component or service.
- **Configuration:** Hardcoded placeholder values in `lib/firebase.ts` (lines 12-17: `"YOUR_API_KEY_HERE"`, etc.). Not using environment variables.

### Gemini AI (Google GenAI)

- **Text Analysis (`analyzeSermonContent`):**
  - Model: `gemini-2.5-flash`
  - Uses structured output with JSON schema (`responseMimeType: "application/json"`, `responseSchema`)
  - Temperature: 0.7
  - Input: sermon title, preacher name, YouTube URL (does NOT actually fetch/transcribe video)
  - Output: `AnalysisResult` with titles, descriptions, key moments, tags, polls, marketing hooks

- **Image Generation (`generateSermonImages`):**
  - Model: `gemini-2.5-flash-image`
  - Takes uploaded thumbnail as base64, generates 16:9 (YouTube) and 1:1 (Spotify) versions
  - Uses `Modality.IMAGE` response modality
  - Returns base64 data URIs (stored in memory, not persisted)

- **API Key:** Read from `process.env.API_KEY`, which Vite injects from `GEMINI_API_KEY` env var via `define` in `vite.config.ts`.

---

## Environment Configuration

### Vite Build-Time Injection (vite.config.ts)

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

The `GEMINI_API_KEY` is loaded from `.env` / `.env.local` files and injected as `process.env.API_KEY` at build time.

### Required Environment Variables (App)

| Variable | Purpose | Used In |
|----------|---------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `geminiService.ts` (via Vite define) |

### Firebase Config (NOT env-driven)

Firebase configuration is hardcoded with placeholders in `lib/firebase.ts`. It does NOT use environment variables.

---

## Build and Deploy

- **Dev Server:** `npm run dev` -> Vite dev server on port 3000, host 0.0.0.0
- **Build:** `npm run build` -> `tsc && vite build`
- **Preview:** `npm run preview` -> Vite preview server
- **Deploy Target:** No deployment configuration found. README mentions AI Studio hosting.
- **Origin:** Generated via Google AI Studio (confirmed by `metadata.json` and `index.html` importmap referencing `aistudiocdn.com`)

### Dual Module Loading (Critical Issue)

`index.html` contains an `importmap` that loads dependencies from CDN (`aistudiocdn.com`), while `package.json` defines the same dependencies for local installation. This creates a conflict between CDN-loaded modules and bundled modules.

---

## Code Patterns

1. **Functional Components:** All components use `React.FC` with TypeScript generics.
2. **Hooks Pattern:** `useState`, `useEffect`, `useContext` for state and lifecycle.
3. **Context Pattern:** Single `AuthContext` for authentication.
4. **Service Layer:** `geminiService.ts` encapsulates all AI API calls.
5. **Copy-to-Clipboard:** Utility pattern in `ResultsDisplay` with visual feedback.
6. **Form Handling:** Controlled components with `useState` + `onChange`.
7. **Loading States:** Multi-step loading indicators (text analysis -> image generation).
8. **Error Handling:** Try-catch with `console.error` and user-facing error messages (basic).
9. **Tailwind-Only Styling:** No CSS modules, styled-components, or CSS files. All inline Tailwind classes.
10. **File-to-Base64:** Custom `FileReader` utility in `NewEpisode` for thumbnail upload.

---

## Technical Debts Identified

| ID | Debt | Category | Severity | Impact | File(s) / Line(s) |
|----|------|----------|----------|--------|--------------------|
| SYS-001 | Firebase credentials hardcoded as placeholders | Security | **Critical** | App cannot authenticate without manual code editing. Credentials should be in env vars. | `lib/firebase.ts:12-17` |
| SYS-002 | Gemini API key exposed in client-side bundle | Security | **Critical** | `vite.config.ts:14` injects API key into browser JS via `process.env.API_KEY`. Anyone can extract it from built files. Needs a backend proxy/serverless function. | `vite.config.ts:14`, `services/geminiService.ts:70-71` |
| SYS-003 | Dual module loading: CDN importmap + npm packages | Architecture | **High** | `index.html` loads React 19, Gemini 1.30, Firebase 12.6 from CDN, while `package.json` installs React 18, Gemini 0.1.1, Firebase 10.8. Version mismatch causes unpredictable behavior. | `index.html:29-45`, `package.json:11-17` |
| SYS-004 | Tailwind loaded via CDN (`cdn.tailwindcss.com`) | Architecture | **High** | CDN Tailwind is for prototyping only. Not tree-shakeable, no custom config, unpredictable in production. PostCSS/Tailwind are in devDeps but not wired (no `tailwind.config.js`, no `postcss.config.js`). | `index.html:7` |
| SYS-005 | Dashboard uses 100% hardcoded/mock data | Feature Gap | **High** | No Firestore queries, no real data. `Dashboard.tsx` lines 7-17 are static arrays. Users see fake stats. | `pages/Dashboard.tsx:7-17` |
| SYS-006 | Firestore and Storage initialized but never used | Dead Code | **Medium** | `db` and `storage` exports in `firebase.ts` are never imported elsewhere. No data persistence layer exists. | `lib/firebase.ts:29-30` |
| SYS-007 | No test infrastructure | Quality | **High** | Zero test files. No test runner (Jest/Vitest) in dependencies. No `test` script in `package.json`. | `package.json:6-9` |
| SYS-008 | No linting or formatting config | Quality | **High** | No ESLint, Prettier, or any code quality tool configured. No `.eslintrc`, `.prettierrc`, no lint scripts. | `package.json` |
| SYS-009 | TypeScript strict mode disabled | Quality | **Medium** | `tsconfig.json` has no `strict: true`, no `noImplicitAny`, no `strictNullChecks`. Allows type-unsafe code silently. | `tsconfig.json` |
| SYS-010 | No error boundary | Reliability | **Medium** | A runtime error in any component crashes the entire app. No React Error Boundary implemented. | `App.tsx`, `index.tsx` |
| SYS-011 | `Header.tsx` component is dead code | Dead Code | **Low** | `Header.tsx` is never imported or rendered. The `Layout.tsx` has its own header. | `components/Header.tsx` |
| SYS-012 | No data persistence for analysis results | Feature Gap | **High** | AI-generated results exist only in component state. Page refresh or navigation loses all results. No save-to-Firestore flow. | `pages/NewEpisode.tsx:11` |
| SYS-013 | Gemini does NOT actually analyze the YouTube video | Feature Gap | **High** | The prompt says "use inferred transcription based on theme" (line 83). The YouTube URL is passed as text but never fetched, transcribed, or processed. AI guesses content. | `services/geminiService.ts:78-107` |
| SYS-014 | Base64 images stored in React state (memory) | Performance | **Medium** | Generated images are full base64 strings in component state. Large images can cause memory pressure and slow renders. Should upload to Storage and use URLs. | `pages/NewEpisode.tsx:55`, `services/geminiService.ts:163` |
| SYS-015 | No input validation/sanitization | Security | **Medium** | YouTube URL not validated (format, domain). Form uses `alert()` for validation (line 33). No XSS protection on user inputs rendered in results. | `components/SermonForm.tsx:32-33` |
| SYS-016 | Church name and plan hardcoded in sidebar | Feature Gap | **Low** | "Igreja Batista" and "Plano Free" are static strings in `Layout.tsx:64-65`. No church/org management. | `components/Layout.tsx:64-65` |
| SYS-017 | No `src/` directory convention | Structure | **Low** | All source files are at root level. Non-standard for React/Vite projects. Makes .gitignore, build config, and IDE setup harder. | Root directory |
| SYS-018 | `experimentalDecorators` enabled unnecessarily | Config | **Low** | `tsconfig.json:4` enables decorators but no decorator usage exists in codebase. | `tsconfig.json:4` |
| SYS-019 | Missing `postcss.config.js` and `tailwind.config.js` | Build | **Medium** | PostCSS and Tailwind are installed as devDeps but have no config files. The app relies entirely on CDN Tailwind. | Missing files |
| SYS-020 | No loading skeleton or optimistic UI | UX | **Low** | Dashboard and results have no skeleton screens. AI processing shows only a spinner with no progress indication beyond step text. | `pages/NewEpisode.tsx:97-103` |
| SYS-021 | `.env.example` is AIOX framework template, not app-specific | Config | **Medium** | Contains Supabase, DeepSeek, ClickUp, N8N keys irrelevant to Churchify. Missing `GEMINI_API_KEY` and Firebase config guidance. | `.env.example` |
| SYS-022 | No favicon or PWA manifest | UX | **Low** | `index.html` has no favicon link, no manifest.json, no meta tags for social sharing. | `index.html` |

---

## Recommendations (Prioritized)

### P0 -- Critical (Must Fix Before Any Deployment)

1. **SYS-002: Move Gemini API to backend.** Create a serverless function (Firebase Functions, Vercel Edge, etc.) to proxy Gemini API calls. Never expose API keys in client bundles.
2. **SYS-001: Move Firebase config to environment variables.** Use `VITE_FIREBASE_*` env vars and remove hardcoded placeholders.
3. **SYS-003: Remove CDN importmap.** Delete the `<script type="importmap">` block from `index.html`. Let Vite bundle all dependencies from `node_modules`. Align `package.json` versions.

### P1 -- High (Before Beta/User Testing)

4. **SYS-004: Configure Tailwind properly.** Create `tailwind.config.js` and `postcss.config.js`. Remove CDN `<script>` tag. Add `@tailwind` directives to a CSS entry file.
5. **SYS-007 + SYS-008: Add test and lint infrastructure.** Install Vitest, ESLint, Prettier. Add scripts to `package.json`. Configure `strict: true` in tsconfig.
6. **SYS-012: Implement data persistence.** Save analysis results to Firestore with user/church association.
7. **SYS-013: Integrate actual video transcription.** Use YouTube transcript API or a transcription service to feed real content to Gemini instead of guessing.
8. **SYS-005: Connect Dashboard to Firestore.** Replace hardcoded data with real queries.

### P2 -- Medium (Before Production)

9. **SYS-010: Add React Error Boundary.** Wrap app in error boundary to gracefully handle runtime errors.
10. **SYS-014: Upload generated images to Firebase Storage.** Store URLs instead of base64 in state.
11. **SYS-015: Add proper input validation.** Validate YouTube URL format, sanitize inputs, replace `alert()` with inline form errors.
12. **SYS-017: Move source to `src/` directory.** Standard convention for maintainability.
13. **SYS-021: Create app-specific `.env.example`.** Document only the variables Churchify actually needs.

### P3 -- Low (Quality of Life)

14. **SYS-011: Remove dead `Header.tsx`.** Clean up unused code.
15. **SYS-016: Build church/org management.** Dynamic church name, plan selection.
16. **SYS-018: Remove unused `experimentalDecorators`.** Clean tsconfig.
17. **SYS-022: Add favicon, meta tags, PWA manifest.** Basic polish.
