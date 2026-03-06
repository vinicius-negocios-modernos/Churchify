# Database Audit — Churchify (Firebase/Firestore)

## Audit Summary

**Overall Health: CRITICAL — No persistence layer exists.**

The application initializes Firebase Auth, Firestore, and Storage but only actively uses Auth (Google Sign-In). Firestore and Storage are imported but never consumed. All application data (sermon analysis results, generated images) lives exclusively in React component state and is lost on page refresh. The Dashboard displays hardcoded placeholder data with no database backing.

---

## Technical Debts

| ID | Debt | Severity | Impact | Effort | Notes |
|----|------|----------|--------|--------|-------|
| DB-001 | No data persistence — all analysis results lost on refresh | **Critical** | Users lose all generated content immediately; zero product value retention | High | Need Firestore collections for episodes, results, images |
| DB-002 | Firebase config uses placeholder credentials | **Critical** | App cannot function at all in production | Low | Replace placeholders in `lib/firebase.ts` or use env vars |
| DB-003 | No `firebase.json` — project not initialized with Firebase CLI | **High** | Cannot deploy rules, hosting, or run emulators | Low | Run `firebase init` |
| DB-004 | No Firestore Security Rules | **High** | Default rules (deny all or allow all) — either blocks app or exposes all data | Medium | Design and deploy rules per collection |
| DB-005 | No Storage Security Rules | **High** | If storage is used later, no access control exists | Medium | Design rules for user-scoped uploads |
| DB-006 | Dashboard uses hardcoded mock data | **High** | Dashboard shows fake stats, misleads users | Medium | Query Firestore for real aggregated data |
| DB-007 | Generated images stored as base64 in memory only | **Medium** | Large base64 strings bloat memory; images not downloadable later | Medium | Upload to Firebase Storage, store download URLs in Firestore |
| DB-008 | No user profile collection | **Medium** | Cannot store user preferences, church info, subscription plan | Medium | Create `users` collection on first sign-in |
| DB-009 | No multi-tenancy / church isolation | **Medium** | App sidebar hardcodes "Igreja Batista" / "Plano Free" | High | Design tenant model with church-scoped data |
| DB-010 | Gemini API key via `process.env.API_KEY` — no per-user key management | **Medium** | Single shared API key; no usage tracking per user/church | Medium | Store keys in Firestore or use Firebase Functions as proxy |
| DB-011 | No data export/backup strategy | **Low** | No way to recover user data | Low | Implement Firestore scheduled backups |
| DB-012 | No offline support or caching | **Low** | App requires constant connectivity | Low | Enable Firestore persistence (`enableIndexedDbPersistence`) |

---

## Security Assessment

| Area | Status | Details |
|------|--------|---------|
| **Firestore Security Rules** | MISSING | No `firestore.rules` file. Default rules apply (likely deny-all for new projects) |
| **Storage Security Rules** | MISSING | No `storage.rules` file |
| **Auth Configuration** | PARTIAL | Google provider works but no email verification, no role-based access |
| **Data Validation** | MISSING | No server-side validation. Client-side only checks for empty required fields |
| **API Key Exposure** | RISK | Firebase config is hardcoded in client-side code (normal for Firebase but requires security rules). Gemini API key uses `process.env` which is safer |
| **CORS / Domain Restriction** | UNKNOWN | No `firebase.json` to verify authorized domains |

---

## Performance Assessment

| Area | Status | Details |
|------|--------|---------|
| **Query Patterns** | N/A | No queries exist — nothing to assess |
| **Indexing** | N/A | No collections, no indexes needed yet |
| **Data Denormalization** | N/A | No data model implemented |
| **Bundle Size** | CONCERN | Firebase Auth + Firestore + Storage SDKs are all imported but only Auth is used. Tree-shaking may not eliminate unused SDK initializations |
| **Image Handling** | INEFFICIENT | Base64 images in React state can be 1-5MB each; two images per analysis means 2-10MB in memory per session |

---

## Data Integrity

| Area | Status | Details |
|------|--------|---------|
| **Validation at Write** | N/A | No writes to database |
| **Orphaned Data Risk** | N/A | No data exists to orphan |
| **Referential Integrity** | N/A | No relationships exist |
| **Backup Strategy** | MISSING | No backup mechanism |
| **Audit Trail** | MISSING | No logging of user actions or data changes |

---

## Recommendations (Prioritized)

### P0 — Must Fix Before Launch

1. **[DB-002] Configure Firebase credentials** — Replace placeholders with real project config. Use environment variables via Vite's `import.meta.env` pattern.

2. **[DB-003] Initialize Firebase project** — Run `firebase init` to set up `firebase.json`, emulators, and deployment targets.

3. **[DB-001] Implement Firestore persistence layer** — Design and implement collections:
   - `users/{uid}` — Profile, church association, plan
   - `churches/{churchId}` — Church info, settings
   - `churches/{churchId}/episodes/{episodeId}` — Sermon analysis results
   - `churches/{churchId}/episodes/{episodeId}/images/{imageId}` — Storage references

4. **[DB-004] Write Firestore Security Rules** — User-scoped reads/writes. Church-scoped isolation. Admin roles.

### P1 — Should Fix Soon After Launch

5. **[DB-005] Write Storage Security Rules** — Restrict uploads to authenticated users, size limits, mime type validation.

6. **[DB-006] Replace Dashboard mock data** — Query real episode counts, processing status from Firestore.

7. **[DB-007] Move images to Firebase Storage** — Upload generated base64 to Storage, store `downloadURL` in Firestore document.

8. **[DB-008] Create user profile on sign-up** — Use `onAuthStateChanged` or Cloud Function trigger to create profile document.

### P2 — Plan for Growth

9. **[DB-009] Design multi-tenancy model** — Church-scoped data, member roles, invitation system.

10. **[DB-010] Proxy Gemini API through Cloud Functions** — Rate limiting, usage tracking, key security.

11. **[DB-011] Enable scheduled Firestore backups** — Use `gcloud firestore export` on a schedule.

12. **[DB-012] Enable offline persistence** — `enableIndexedDbPersistence(db)` for offline-first experience.

---

## Proposed Collection Schema (Future Reference)

```
Firestore Root
|
+-- users/{uid}
|   |- displayName: string
|   |- email: string
|   |- photoURL: string
|   |- churchId: string (reference)
|   |- role: "admin" | "editor" | "viewer"
|   |- createdAt: timestamp
|
+-- churches/{churchId}
|   |- name: string
|   |- plan: "free" | "pro" | "enterprise"
|   |- createdAt: timestamp
|   |- ownerId: string (uid reference)
|   |
|   +-- episodes/{episodeId}
|       |- title: string
|       |- preacherName: string
|       |- youtubeUrl: string
|       |- status: "pending" | "processing" | "done" | "error"
|       |- analysisResult: map (AnalysisResult)
|       |- thumbnailUrl: string (Storage reference)
|       |- artworkUrl: string (Storage reference)
|       |- createdAt: timestamp
|       |- createdBy: string (uid)
```

```
Firebase Storage
|
+-- churches/{churchId}/episodes/{episodeId}/
    |- thumbnail-16-9.png
    |- artwork-1-1.png
    |- original-upload.{ext}
```
