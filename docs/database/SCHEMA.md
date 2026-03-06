# Database Schema — Churchify (Firebase/Firestore)

## Overview

Churchify uses **Firebase** as its backend platform with three services initialized:

| Service | SDK Import | Status |
|---------|-----------|--------|
| **Firebase Auth** | `getAuth()` | Active — Google Sign-In implemented |
| **Cloud Firestore** | `getFirestore()` | Initialized but **NOT USED** — zero reads/writes in codebase |
| **Firebase Storage** | `getStorage()` | Initialized but **NOT USED** — zero uploads/downloads in codebase |

**Firebase Config Status:** Placeholder credentials (`YOUR_API_KEY_HERE`). The app includes a runtime guard that logs a warning when unconfigured but still calls `initializeApp()`.

**Critical Finding:** The application has **NO data persistence layer**. All data (sermon analysis results, generated images) exists only in React component state and is lost on page refresh or navigation.

---

## Authentication

### Auth Providers

| Provider | Implementation | File |
|----------|---------------|------|
| **Google (OAuth)** | `GoogleAuthProvider` + `signInWithPopup` | `contexts/AuthContext.tsx` |
| Email/Password | Not implemented | — |
| Anonymous | Not implemented | — |

### Auth Flow

1. `AuthProvider` wraps entire app (`App.tsx`)
2. `onAuthStateChanged` listener sets `user` state on mount
3. Unauthenticated users are redirected to `/login` via `ProtectedRoute`
4. Google Sign-In via popup (`signInWithPopup`)
5. `signOut` clears session
6. User object provides: `displayName`, `email`, `photoURL`, `uid`

### Auth Data Used in UI

| Property | Location | Usage |
|----------|----------|-------|
| `user.photoURL` | `Layout.tsx` | Sidebar avatar |
| `user.displayName` | `Layout.tsx` | Sidebar user name |
| `user.email` | `Layout.tsx` | Sidebar email |
| `user` (existence) | `App.tsx` | Route protection |

---

## Firestore Collections

**NONE.** No Firestore collections exist or are referenced anywhere in the codebase.

The `db` export from `lib/firebase.ts` is never imported by any other file. There are:
- Zero `collection()` calls
- Zero `doc()` calls
- Zero `getDoc()` / `getDocs()` / `setDoc()` / `addDoc()` calls
- Zero `query()` / `where()` / `orderBy()` calls
- Zero real-time listeners (`onSnapshot`)

---

## Firestore Queries

| Location | Collection | Query Type | Filters | Notes |
|----------|-----------|------------|---------|-------|
| — | — | — | — | No queries exist in the codebase |

---

## Firebase Storage

**NOT USED.** The `storage` export from `lib/firebase.ts` is never imported.

Image handling in the app:
- Thumbnail upload: converted to base64 in-browser (`FileReader.readAsDataURL`) and sent directly to Gemini API
- Generated images: returned as base64 data URIs from Gemini, rendered as inline `<img src="data:image/png;base64,...">` tags
- No images are persisted to Firebase Storage or any other storage service

---

## Data Flow

### Current Architecture (Stateless)

```
User Input (SermonForm)
    |
    v
React State (NewEpisode.tsx)
    |
    v
Gemini API (geminiService.ts) — external, no persistence
    |
    v
React State (AnalysisResult)
    |
    v
UI Render (ResultsDisplay.tsx) — data lost on refresh
```

### Data Models (TypeScript only, no DB mapping)

#### SermonInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| youtubeUrl | string | Yes | YouTube video URL |
| preacherName | string | Yes | Preacher's name |
| title | string | Yes | Sermon title |
| thumbnailFile | File \| null | No | Image for AI-generated thumbnails |

#### AnalysisResult (Gemini API response)
| Field | Type | Description |
|-------|------|-------------|
| keyMoments | KeyMoment[] | 3-5 viral clip suggestions with timestamps |
| spotifyTitles | string[] | 3 SEO-optimized title options |
| spotifyDescriptionSnippet | string | SEO snippet (max 120 chars) |
| spotifyDescriptionBody | string | Show notes body |
| spotifyCTA | string | Call-to-action question |
| spotifyPollQuestion | string | Spotify poll question |
| spotifyPollOptions | string[] | 5 poll options |
| biblicalReferences | string[] | Bible references |
| tags | string[] | 10-15 SEO keywords |
| marketingHooks | string[] | 3 promo sentences |
| generatedImages | GeneratedImages? | AI-generated thumbnail + artwork |

#### KeyMoment
| Field | Type | Description |
|-------|------|-------------|
| title | string | Clip title |
| timestamp | string | Estimated timestamp range |
| reasoning | string | Engagement rationale |
| hook | string | Social media caption hook |
| estimatedContext | string | Segment summary |

#### GeneratedImages
| Field | Type | Description |
|-------|------|-------------|
| thumbnail16_9 | string | Base64 data URI (YouTube thumbnail) |
| artwork1_1 | string | Base64 data URI (Spotify cover) |

### Dashboard Data

The Dashboard (`pages/Dashboard.tsx`) uses **hardcoded placeholder data** — no database queries. Stats ("12 cultos analisados", "3 pendentes", "18h economizado") and pending services list are static constants.

---

## Security Rules

**No Firestore or Storage security rules files exist** in the project (`firestore.rules`, `storage.rules`).

No `firebase.json` configuration file exists — Firebase has not been fully initialized as a project (no `firebase init` was run).

---

## External APIs

| API | Service | Auth Method | Used In |
|-----|---------|-------------|---------|
| Google Gemini 2.5 Flash | Text analysis | `process.env.API_KEY` | `geminiService.ts` |
| Google Gemini 2.5 Flash Image | Image generation | `process.env.API_KEY` | `geminiService.ts` |
