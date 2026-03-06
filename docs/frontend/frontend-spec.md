# Frontend Specification -- Churchify

## Overview

Churchify is a SaaS platform for churches that uses AI (Google Gemini) to transform sermon/worship videos into optimized digital content for Spotify and YouTube. Target users are church media teams and pastors who need to create show notes, thumbnails, SEO tags, and short-form video suggestions from sermon recordings.

The application is currently in early prototype/MVP stage with placeholder data on the Dashboard and two functional placeholder routes (Library, Settings).

## Tech Stack (Frontend)

| Technology | Version | Usage |
|-----------|---------|-------|
| React | ^18.2.0 (importmap loads ^19.2.0) | UI framework |
| Vite | ^5.1.4 | Build tool, dev server |
| TypeScript | ^5.2.2 | Type safety |
| Tailwind CSS | CDN (cdn.tailwindcss.com) | Utility-first styling |
| React Router DOM | ^6.22.0 | Client-side routing |
| Lucide React | ^0.344.0 (importmap loads ^0.554.0) | Icon library |
| Firebase | ^10.8.0 | Auth (Google SSO), Firestore, Storage |
| @google/genai | ^0.1.1 | Gemini AI integration |
| Inter (Google Fonts) | CDN | Typography |

### Critical Version Mismatch (index.html importmap vs package.json)

The `index.html` importmap declares React 19.2.0, react-router-dom 6.22.0, lucide-react 0.554.0, and @google/genai 1.30.0, while `package.json` declares React 18.2.0, lucide-react 0.344.0, and @google/genai 0.1.1. The importmap references `aistudiocdn.com`, suggesting the app was originally prototyped in Google AI Studio and then migrated to Vite. This dual dependency system is a significant technical debt.

## Component Architecture

### Component Tree

```
<React.StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        +-- /login -> <Login />
        +-- / -> <ProtectedRoute> -> <Layout>
            +-- / (index) -> <Dashboard />
            +-- /new-episode -> <NewEpisode />
            |   +-- <SermonForm />
            |   +-- <ResultsDisplay />  (conditional)
            +-- /library -> placeholder <div>
            +-- /settings -> placeholder <div>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
</React.StrictMode>
```

### Component Details

#### App (`App.tsx`)
- **Purpose:** Root routing configuration with auth protection
- **Props:** None
- **State:** None (delegates to AuthContext)
- **Dependencies:** AuthContext, Layout, Login, Dashboard, NewEpisode
- **UX Notes:** `ProtectedRoute` inline component handles auth guard with a centered spinner. Clean routing structure. Library and Settings routes render inline placeholder divs (no dedicated components).

#### Layout (`components/Layout.tsx`)
- **Purpose:** Shell layout with responsive sidebar navigation and mobile hamburger menu
- **Props:** None (uses `<Outlet />`)
- **State:** `isMobileMenuOpen: boolean`
- **Dependencies:** AuthContext (user info, logout), react-router-dom (Link, useLocation, Outlet)
- **UX Notes:** Responsive sidebar with overlay on mobile. Hardcoded church name ("Igreja Batista") and plan ("Plano Free") -- not dynamic. User avatar uses `ui-avatars.com` fallback. Active nav item uses dark bg (bg-gray-900). Logout button in sidebar footer.

#### Header (`components/Header.tsx`)
- **Purpose:** Top header bar with branding and platform badges
- **Props:** None
- **State:** None
- **Dependencies:** Lucide icons (Mic2, Music, Youtube)
- **UX Notes:** **UNUSED COMPONENT** -- not imported or rendered anywhere in the application. The Layout component has its own header implementation. This is dead code.

#### SermonForm (`components/SermonForm.tsx`)
- **Purpose:** Input form for sermon analysis (YouTube URL, preacher name, title, optional thumbnail)
- **Props:** `onSubmit: (data: SermonInput) => void`, `isLoading: boolean`
- **State:** `formData: SermonInput`
- **Dependencies:** types.ts (SermonInput)
- **UX Notes:** Uses native `alert()` for validation (line 33) instead of inline error messages. File upload area supports drag-and-drop visually but does NOT implement actual drag-and-drop handlers -- only click-to-upload works. No file size validation despite "10MB" label. Required fields marked with red asterisk.

#### ResultsDisplay (`components/ResultsDisplay.tsx`)
- **Purpose:** Multi-section display of AI-generated content (Spotify optimization, images, key moments, marketing hooks)
- **Props:** `result: AnalysisResult`
- **State:** `copiedField: string | null`
- **Dependencies:** types.ts (AnalysisResult)
- **UX Notes:** Largest component (305 lines). Well-structured with copy-to-clipboard for each section. Description assembly visualizer shows the exact order that will be copied. Spotify poll section has dark theme card. Copy feedback with 2-second timeout. Generated images have hover-to-download overlay.

#### AuthContext (`contexts/AuthContext.tsx`)
- **Purpose:** Firebase authentication state management with Google SSO
- **Props (Provider):** `children: React.ReactNode`
- **State:** `user: User | null`, `loading: boolean`
- **Dependencies:** Firebase Auth (onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut)
- **UX Notes:** Clean context pattern with proper error boundary via `useAuth()` hook throwing if used outside provider. Error handling logs to console but does not surface to UI on logout failure.

#### Login (`pages/Login.tsx`)
- **Purpose:** Split-screen login page with branding + Google SSO button
- **Props:** None
- **State:** `loading: boolean`, `error: string | null`
- **Dependencies:** AuthContext, react-router-dom (useNavigate)
- **UX Notes:** Attractive split-screen layout. Left panel has gradient background with feature bullets. Right panel has centered login card. Error message displayed inline. Only Google SSO available -- no email/password option.

#### Dashboard (`pages/Dashboard.tsx`)
- **Purpose:** Overview page with stats cards and pending tasks list
- **Props:** None
- **State:** None
- **Dependencies:** react-router-dom (Link)
- **UX Notes:** **ENTIRELY HARDCODED PLACEHOLDER DATA** (lines 7-17). Stats (12 analyzed, 3 pending, 18h saved) and pending services list are static arrays. No real data fetching. "Ver todos" link points to /library (also placeholder). Empty state UI exists but is unreachable due to hardcoded non-empty array.

#### NewEpisode (`pages/NewEpisode.tsx`)
- **Purpose:** Main workflow page -- form input + AI processing + results display
- **Props:** None
- **State:** `isLoading`, `loadingStep`, `result`, `error`
- **Dependencies:** SermonForm, ResultsDisplay, geminiService
- **UX Notes:** Two-step async process: text analysis then optional image generation. Loading state shows step description. Error displayed with left-border alert style. Image generation failure is non-fatal (line 56-59). Uses `animate-fade-in-up` CSS class that is not defined anywhere.

## Page Flows

### Login Flow
1. User lands on any protected route -> redirected to `/login`
2. Login page shows split-screen with Google SSO button
3. User clicks "Continuar com Google" -> Firebase popup opens
4. On success -> `navigate('/')` to Dashboard
5. On error -> inline error message displayed

### Dashboard Flow
1. Authenticated user sees stats cards (hardcoded)
2. Pending tasks list shows with status badges (Pendente/Atrasado)
3. Hover on task row reveals arrow button linking to `/new-episode`
4. "Ver todos" links to `/library` (placeholder)

### New Episode Flow
1. User fills SermonForm: YouTube URL + Preacher Name + Title + optional Thumbnail
2. Clicks "Analisar Video e Gerar Conteudo"
3. Loading spinner with step description appears
4. Step 1: Gemini analyzes content and generates metadata
5. Step 2 (if thumbnail uploaded): Gemini generates 16:9 and 1:1 images
6. ResultsDisplay renders with all sections
7. User can copy individual fields or full description to clipboard

## Design System Assessment

### Colors
- **Primary:** Indigo-600 (`#4F46E5`) -- used for branding, active states, CTA buttons
- **Secondary gradient:** Indigo-600 to Violet-600 -- submit button
- **Accent (Spotify):** Green-500/600 -- Spotify optimization section
- **Accent (YouTube):** Red -- YouTube badges, error states
- **Accent (Images):** Purple -- Generated images section
- **Neutral:** Gray-50 to Gray-900 -- backgrounds, text, borders
- **Dark theme:** Slate-800/900 -- Marketing hooks section, Spotify poll card
- **Consistency:** Generally consistent. Each results section has its own color theme (green=Spotify, indigo=YouTube moments, purple=images, dark=marketing) which works well for visual separation.

### Typography
- **Font:** Inter (Google Fonts CDN), weights 300-700
- **Headings:** `text-2xl font-bold` (page titles), `text-lg font-bold` (section headers)
- **Body:** `text-sm` (most content), `text-xs` (labels, metadata)
- **Consistency:** Good. Consistent use of `uppercase tracking-wide/wider` for section labels.

### Spacing
- **Page padding:** `p-4 md:p-8` (responsive)
- **Section gaps:** `space-y-8` between major sections
- **Card padding:** `p-6` or `p-5` consistently
- **Grid gaps:** `gap-6` for card grids
- **Consistency:** Good internal consistency.

### Icons
- **Library:** Lucide React -- modern, consistent stroke-based icons
- **Usage:** Icons paired with labels in nav, section headers, form labels, and action buttons
- **Consistency:** Good. Consistent sizing (`w-4 h-4` to `w-6 h-6`).

## UI Patterns Identified

| Pattern | Location | Quality | Notes |
|---------|----------|---------|-------|
| Protected Routes | App.tsx:11-27 | Good | Clean inline component with loading state |
| Responsive Sidebar | Layout.tsx:30-129 | Good | Mobile overlay + fixed sidebar on desktop |
| Context + Hook Auth | AuthContext.tsx | Good | Standard pattern with error boundary |
| Copy to Clipboard | ResultsDisplay.tsx | Good | Per-field copy with visual feedback |
| Loading Steps | NewEpisode.tsx:37-44 | Good | Progressive feedback during multi-step async |
| Form Validation | SermonForm.tsx:32-35 | Poor | Uses native `alert()` instead of inline errors |
| Drag & Drop Upload | SermonForm.tsx:104 | Poor | Visual cue exists but no drop handlers |
| Placeholder Routes | App.tsx:42-43 | Fair | Inline divs acceptable for MVP |
| Error Display | NewEpisode.tsx:87-95 | Good | Clear left-border alert pattern |
| Hardcoded Data | Dashboard.tsx:7-17 | Poor | Entire page is non-functional placeholder |

## Accessibility (a11y) Audit

| Issue | Location | Severity | WCAG Level |
|-------|----------|----------|------------|
| No skip-to-content link | Layout.tsx | Medium | A |
| Mobile menu button has no aria-label | Layout.tsx:119 | High | A |
| Close menu button has no aria-label | Layout.tsx:52-57 | High | A |
| Sidebar overlay has no aria attributes | Layout.tsx:33-36 | Medium | A |
| Copy buttons lack descriptive aria-labels | ResultsDisplay.tsx (multiple) | Medium | A |
| Color contrast: text-gray-400 on white bg | Multiple locations | Medium | AA |
| Color contrast: text-indigo-600 on bg-indigo-50 | Layout.tsx:65 | Low | AA |
| No focus management on mobile menu open/close | Layout.tsx:18 | Medium | AA |
| No keyboard trap prevention in mobile overlay | Layout.tsx:32-37 | Medium | AA |
| `title` attribute used instead of aria-label | SermonForm.tsx:59, ResultsDisplay.tsx:192 | Low | A |
| No `lang` attribute changes for mixed PT/EN | Multiple | Low | AAA |
| Form validation uses `alert()` -- not screen reader friendly | SermonForm.tsx:33 | High | A |
| Loading state announcements not via aria-live | NewEpisode.tsx:97-103 | Medium | A |
| Images in ResultsDisplay lack meaningful alt text | ResultsDisplay.tsx:195,220 | Medium | A |
| No heading hierarchy in ResultsDisplay sections | ResultsDisplay.tsx | Low | A |

## Responsiveness Assessment

- **Mobile sidebar:** Implemented with slide-in/overlay pattern -- works well
- **Mobile header:** Separate mobile header with hamburger menu -- good
- **Grid layouts:** Use `md:grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-3` -- responsive
- **Login page:** `flex-col md:flex-row` split -- good
- **Form:** `grid-cols-1 md:grid-cols-2` for name/title fields -- good
- **ResultsDisplay:** Responsive grids for all sections -- good
- **Potential issue:** No `max-width` on main content area -- on very wide screens (>1920px) content stretches indefinitely
- **Overall:** Good responsive implementation for an MVP. Mobile-first considerations are present.

## Performance Assessment

### Bundle Size Concerns
- **Tailwind CSS via CDN** (`cdn.tailwindcss.com`): This loads the ENTIRE Tailwind CSS library (~3MB unminified) on every page load. This is explicitly documented by Tailwind as "not for production." Should use PostCSS build pipeline (already configured in devDependencies but not used).
- **Firebase SDK:** Full Firebase SDK loaded (app + auth + firestore + storage). Firestore and Storage are imported but only Auth is actively used. Tree-shaking may not fully help since they're initialized at module level.
- **Import Map vs Bundle:** The `index.html` importmap loads dependencies from `aistudiocdn.com` CDN, bypassing Vite's bundling entirely. This means NO tree-shaking, NO code splitting, NO minification for these dependencies.

### Rendering Patterns
- No `React.lazy()` or `Suspense` for code splitting
- No `useMemo` or `useCallback` in any component
- ResultsDisplay (305 lines) re-renders entirely on any `copiedField` state change
- No virtualization for potentially long lists (keyMoments, tags)

### Image Optimization
- Generated images are base64 data URLs stored in React state -- potentially very large strings in memory
- User avatar uses external URL (`ui-avatars.com`) -- no caching strategy
- Google favicon loaded from `google.com` on Login page
- No lazy loading for images

### CDN Usage
- Tailwind CSS: CDN (production anti-pattern)
- Inter font: Google Fonts CDN (acceptable)
- Dependencies: `aistudiocdn.com` CDN via importmap (bypasses build)

## User Experience Issues

| ID | Issue | Impact | Severity | Recommendation |
|----|-------|--------|----------|----------------|
| UX-001 | Dashboard is entirely hardcoded placeholder data | Users see fake stats/tasks with no way to interact meaningfully | High | Connect to Firestore to show real episode history and actual stats |
| UX-002 | `alert()` used for form validation | Jarring native dialog breaks the polished UI feel | Medium | Replace with inline validation messages under each field |
| UX-003 | Drag-and-drop upload area visually suggests D&D but does not work | Users expect D&D behavior from the dashed-border area | Medium | Implement `onDrop`/`onDragOver` handlers or remove visual D&D cue |
| UX-004 | No file size validation for thumbnail upload | User can upload >10MB file despite stated limit, causing slow base64 conversion | Medium | Add client-side file size check before setting state |
| UX-005 | No way to save/export generated results | All AI-generated content is lost on page navigation or refresh | Critical | Add save-to-Firestore and/or export-to-PDF/JSON functionality |
| UX-006 | No loading skeleton on Dashboard | Page renders instantly with hardcoded data -- will flash when real data is added | Low | Add skeleton loading pattern for future data fetching |
| UX-007 | Church name/plan hardcoded in sidebar | "Igreja Batista" and "Plano Free" are static strings | Medium | Pull from user profile or organization data |
| UX-008 | No confirmation before logout | Single-click logout with no confirmation | Low | Add confirmation dialog for logout action |
| UX-009 | No error recovery on Gemini API failure | User must manually re-submit the entire form | Medium | Add retry button that preserves form data |
| UX-010 | CSS animation classes referenced but not defined | `animate-fade-in` and `animate-fade-in-up` used in NewEpisode.tsx but not defined in any CSS | Low | Add custom Tailwind animation definitions or remove classes |
| UX-011 | No progress indicator for AI processing duration | User has no idea how long to wait during Gemini analysis | Medium | Add estimated time or progress bar |
| UX-012 | Terms of Service and Privacy Policy links are plain text | Login page mentions TOS/Privacy but they are not clickable links | Low | Add actual links or remove the text |

## Technical Debts (Frontend/UX)

| ID | Debt | Category | Severity | Impact | Notes |
|----|------|----------|----------|--------|-------|
| FE-001 | Tailwind CSS loaded via CDN instead of build pipeline | Performance | Critical | ~3MB unminified CSS on every page load. Explicitly not for production per Tailwind docs | PostCSS + Tailwind already in devDependencies but not configured |
| FE-002 | Import map loads from aistudiocdn.com, bypassing Vite bundling | Architecture | Critical | No tree-shaking, no code splitting, no minification for React, Router, Lucide, Firebase, GenAI | Migrate to proper npm imports via Vite |
| FE-003 | Version mismatch: importmap (React 19) vs package.json (React 18) | Architecture | High | Potential runtime inconsistencies between CDN and bundled versions | Align versions, remove importmap |
| FE-004 | Firebase config has hardcoded placeholder values | Security/Config | High | App cannot function without manual code editing. Should use environment variables | Move to `.env` via `import.meta.env.VITE_*` pattern |
| FE-005 | Gemini API key exposed via `process.env.API_KEY` in client bundle | Security | Critical | API key is embedded in the client-side JavaScript bundle, visible to any user | Move to backend/serverless function (Firebase Functions) |
| FE-006 | Header.tsx is dead code (never imported) | Maintenance | Low | Unused component adds confusion | Remove or integrate into Layout |
| FE-007 | Dashboard uses entirely hardcoded data | Functionality | High | Page provides no real value to users | Implement data layer with Firestore |
| FE-008 | No state management beyond React Context | Architecture | Medium | Will become problematic as app grows with episode library, settings, org data | Consider Zustand or React Query for server state |
| FE-009 | No test files exist | Quality | High | Zero test coverage for any component or service | Add Jest/Vitest + React Testing Library |
| FE-010 | No ESLint or Prettier configuration | Quality | Medium | No code style enforcement | Add linting configuration |
| FE-011 | No error boundary component | Reliability | Medium | Unhandled errors crash the entire app | Add React Error Boundary at Layout level |
| FE-012 | Base64 images stored in React state | Performance | Medium | Large base64 strings in memory; lost on navigation | Upload to Firebase Storage, store URLs |
| FE-013 | Firestore and Storage initialized but never used | Bundle Size | Low | Unnecessary SDK code loaded | Remove unused imports or implement features |
| FE-014 | No `tailwind.config.js` file | Build | Medium | Custom animations (fade-in-up) not defined, cannot customize theme | Create proper Tailwind config |
| FE-015 | `tsconfig.json` not present or not examined | Build | Medium | TypeScript configuration unknown | Ensure strict mode, path aliases aligned with vite.config.ts |

## Recommendations

### Priority 1 -- Critical (Before any public deployment)

1. **Remove CDN Tailwind and configure build pipeline** (FE-001): Install and configure PostCSS + Tailwind properly. The devDependencies already include `tailwindcss`, `postcss`, and `autoprefixer` but there is no `tailwind.config.js` or `postcss.config.js`.

2. **Remove importmap and use Vite bundling** (FE-002, FE-003): Delete the `<script type="importmap">` block from `index.html`. Let Vite resolve all dependencies from `node_modules`. This fixes version mismatches and enables tree-shaking.

3. **Move Gemini API key to a backend** (FE-005): Create a Firebase Cloud Function or similar backend endpoint to proxy Gemini API calls. The API key must NEVER be in client-side code.

4. **Use environment variables for Firebase config** (FE-004): Replace hardcoded placeholder values with `import.meta.env.VITE_FIREBASE_*` variables.

### Priority 2 -- High (Before beta users)

5. **Implement Firestore data layer** for Dashboard (FE-007): Save episode analysis results to Firestore and display real data on Dashboard.

6. **Add React Error Boundary** (FE-011): Wrap the app in an error boundary to prevent white-screen crashes.

7. **Add test infrastructure** (FE-009): Set up Vitest + React Testing Library. Start with AuthContext and SermonForm tests.

8. **Fix form validation UX** (UX-002): Replace `alert()` with inline error messages.

### Priority 3 -- Medium (Before public launch)

9. **Fix accessibility issues**: Add aria-labels to interactive elements, implement focus management for mobile menu, add aria-live for loading states.

10. **Implement save/export for results** (UX-005): This is the most impactful UX improvement -- users currently lose all generated content on navigation.

11. **Add proper file upload validation** (UX-003, UX-004): Implement drag-and-drop handlers and file size validation.

12. **Remove dead code** (FE-006): Delete `Header.tsx` or refactor Layout to use it.

### Priority 4 -- Low (Polish)

13. Add Tailwind custom animations for `animate-fade-in-up` (UX-010).
14. Add loading skeletons for Dashboard (UX-006).
15. Make church name/plan dynamic from user profile (UX-007).
16. Add confirmation dialog for logout (UX-008).
