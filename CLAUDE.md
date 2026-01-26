# CLAUDE.md - Churchify Development Guide

## Project Overview

**Churchify** is an AI-powered sermon content automation platform designed for churches. It analyzes sermon videos and automatically generates:
- Viral-ready content cuts with precise timestamps
- SEO-optimized titles and descriptions for Spotify/podcasts
- Professional artwork (YouTube thumbnails 16:9, podcast covers 1:1)
- Marketing materials (tags, hooks, poll questions)

Currently supporting: Campos 85 & Campos 153

## Development Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Build for production (TypeScript + Vite)
npm run preview  # Preview production build
```

**Note:** No test/lint commands currently configured.

## Technology Stack

- **Frontend:** React 19 + TypeScript 5.2 + Vite 7.2
- **Backend:** Firebase (Firestore + Auth)
- **AI Models:** Google Gemini API (@google/genai)
- **Styling:** Tailwind CSS
- **Utilities:** date-fns, lucide-react

## Architecture

### Directory Structure (No src/ directory)

```
churchify/
├── components/         # Reusable UI (Header, SermonForm, ResultsDisplay)
├── pages/             # Route components (Dashboard, EpisodeCreator, Login)
├── services/          # Business logic (geminiService.ts)
├── lib/               # Integrations (firebase.ts)
├── utils/             # Utilities (schedule.ts, constants)
├── contexts/          # React Context (AuthContext.tsx)
├── types.ts           # TypeScript interfaces
├── App.tsx            # Main app with routing
├── main.tsx           # React entry point
└── index.html         # HTML template
```

### Core Data Flow

```
Dashboard (Calendar)
  ↓ (User inputs sermon data)
EpisodeCreator (Form)
  ↓ (AI analysis)
Gemini Flash (Fast text analysis)
  ↓ (Generate visual assets)
Gemini Pro (High-quality images)
  ↓ (Display results)
ResultsDisplay
  ↓ (Save metadata)
Firestore (Firebase)
```

### Key Architectural Decisions

1. **Dual-Model Strategy**: Uses Gemini 3 Flash for fast text analysis and Gemini 3 Pro for high-quality image generation
2. **No Image Storage**: Base64 images are generated and displayed but intentionally NOT persisted to Firestore (cost optimization)
3. **Calendar Merge**: Generated schedule from config merged with real Firebase events
4. **Inference-Based Analysis**: AI analyzes sermon structure without direct video access - infers from metadata
5. **Flat Directory Structure**: No src/ directory, direct imports from root
6. **AIOS Development Tooling Only**: Framework in .aios-core/, .aios/, .claude/ is for development workflow only, not runtime

## Gemini API Integration

### Models Used

- `gemini-3-flash-preview` - Text analysis with structured output (fast, cost-effective)
- `gemini-3-pro-image-preview` - High-quality image generation (detailed visuals)

### Pattern: Structured Output (analyzeSermonContent)

The service layer enforces response schemas to ensure consistent data structure:

```typescript
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    keyMoments: Type.ARRAY,           // 3-5 viral-worthy moments
    spotifyTitles: Type.ARRAY,        // SEO-optimized titles
    biblicalReferences: Type.ARRAY,   // Scripture citations
    tags: Type.ARRAY,                 // Content tags
    hooks: Type.ARRAY,                // Attention-grabbing hooks
    pollQuestions: Type.ARRAY,        // Engagement questions
    // ... additional 6+ fields
  }
}

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: analysisSchema
  }
});
```

### Pattern: Multimodal Image Generation

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: {
    parts: [
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
      { text: detailedPrompt }
    ]
  },
  config: {
    responseModalities: [Modality.IMAGE],
    imageConfig: { aspectRatio: "16:9" }  // or "1:1" for podcast covers
  }
});
```

### Error Handling

All Gemini calls include try-catch blocks with:
- API key validation before requests
- Detailed error logging with context
- User-friendly error messages in UI
- Graceful fallbacks or retry prompts

## Firebase Integration

### Firestore Structure

**Collection:** `episodes`

**Document ID Format:** `{campusId}_{YYYY-MM-DD}_{HHmm}[_EXTRA]`

**Document Fields:**
- `campusId` - 'campos85' or 'campos153'
- `date` - ISO8601 date string
- `time` - HH:mm format
- `status` - 'pending', 'published', or 'no-media'
- `weekDay` - Day of week (Monday, Tuesday, etc.)
- `aiAnalysis` - Structured analysis object (WITHOUT generatedImages field)
- `isExtra` - Boolean (true for manually created events)
- `updatedAt` - ISO8601 timestamp

### Pattern: Merge Strategy

```typescript
export const saveEpisode = async (episodeId: string, data: any) => {
  await setDoc(doc(db, 'episodes', episodeId), {
    ...data,
    updatedAt: new Date().toISOString()
  }, { merge: true });  // Allows partial updates without overwriting entire doc
};
```

This pattern enables safe updates where only specified fields are changed.

### Pattern: Querying Episodes

Episodes are fetched by campus and date range, typically in Dashboard component:
```typescript
const querySnapshot = await getDocs(
  query(collection(db, 'episodes'), where('campusId', '==', campusId))
);
```

## Critical Code Patterns

### 1. Service Layer (services/geminiService.ts)

- Pure functions with explicit error handling
- API key validation as first step
- Try-catch with detailed context logging
- Schema-enforced responses ensure predictable data

Example structure:
```typescript
export const analyzeSermonContent = async (
  input: SermonInput
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) throw new Error('API key missing');
  try {
    // Validate input
    // Make API call
    // Parse and validate response
    return result;
  } catch (error) {
    console.error('Sermon analysis failed:', error);
    throw new Error(`Failed to analyze sermon: ${error.message}`);
  }
};
```

### 2. Calendar Generation (utils/schedule.ts)

```typescript
export const generateMonthSchedule = (campusId: string, year: number, month: number) => {
  // Algorithm:
  // 1. Iterate through all days in month
  // 2. Check CHURCH_CONFIG for service times
  // 3. Generate ServiceEvent for each configured day
  // 4. Sort by date and time
  // Returns: ServiceEvent[]
};
```

Uses date-fns for date manipulation. CHURCH_CONFIG defines which weekdays have services.

### 3. React Component Patterns

**Data Fetching:**
```typescript
useEffect(() => {
  // Fetch data on mount or dependency change
  const fetchData = async () => {
    // Make async calls
    // Update state
  };
  fetchData();
}, [dependency]);  // Include all dependencies
```

**State Management:**
- useState for local component state
- useParams/useNavigate for routing
- AuthContext for global auth state
- No external state management (Redux/Zustand)

**Merge Logic:**
- Calendar generated from config
- Firebase events fetched separately
- Merged in memory for display
- Firebase is single source of truth for edits

### 4. TypeScript Interfaces (types.ts)

Key interfaces provide strong typing throughout:
- `SermonInput` - Form submission data
- `AnalysisResult` - Gemini analysis response
- `KeyMoment` - Individual viral moment
- `GeneratedImages` - Artwork container (base64 + metadata)
- `Episode` - Complete Firestore document

Strong typing enforced everywhere except Firebase merge operations (where `any` is acceptable).

## Environment Variables

**Required:**
- `API_KEY` - Google Gemini API key (validated in geminiService.ts)

**Notes:**
- Firebase credentials are hardcoded in `lib/firebase.ts`
- Add API_KEY to `.env.local` for local development
- Build includes API_KEY via process.env

## AIOS Framework Context

**CRITICAL:** AIOS is DEVELOPMENT TOOLING ONLY and does NOT affect runtime code.

**Location:** `.aios-core/`, `.aios/`, `.claude/`

**Provides:**
- Agent personas for team workflows (@dev, @qa, @architect, @pm, @po, @sm, @analyst)
- Story-driven development tracking
- Task management and workflow automation
- Development guidelines and checklists

**Does NOT provide:**
- Runtime functionality for Churchify
- Any imports in application code
- Configuration for production builds

Use AIOS when planning features, tracking progress, and coordinating development work. It's completely separate from the running application.

## Important Notes

### Image Generation and Storage

- **Generated:** Images created as base64-encoded PNG files
- **Displayed:** Shown in ResultsDisplay component for user preview
- **Downloaded:** Users can manually save via browser download
- **NOT Persisted:** Images intentionally excluded from Firestore to avoid storage costs
- **To Enable Persistence:** Modify `saveEpisode()` to upload base64 to Firebase Storage

### Routing

- Uses `HashRouter` (not BrowserRouter) for hash-based routing
- Main routes:
  - `/` - Dashboard (calendar view)
  - `/#/editor/:campusId/:episodeId` - Episode Editor

### Authentication

- Currently simplified: fake authenticated user on app load
- `AuthContext` prepared for Google OAuth but disabled
- No login screen active
- To enable: Update `AuthProvider` and restore Google sign-in flow

### Status State Machine

Valid status transitions:
- `pending` → `published` (after successful analysis)
- `pending` → `no-media` (manual marking)
- `no-media` → `pending` (revert for retry)

### Cost Optimization

The architecture intentionally skips image persistence:
- Gemini Pro image generation is expensive
- Storing base64 in Firestore adds storage costs
- Users can manually save needed images
- Future: Add option for selective persistence to Storage

## Debugging Tips

1. **API Key Issues:** Verify `process.env.API_KEY` is set and valid in console
2. **Firebase Errors:** Check browser console for Firestore error details with operation context
3. **Gemini Response Errors:** Log full error object including status code and message
4. **Calendar Generation Issues:** Review `CHURCH_CONFIG` in `utils/schedule.ts` for correct service times
5. **Image Generation Failures:** Confirm base64 format and mimeType match expected values
6. **Type Errors:** Check TypeScript compilation with `npm run build` (Vite includes TypeScript checking)

## Development Workflow

When adding features:
1. Check existing patterns in similar files
2. Maintain flat directory structure and module imports
3. Add TypeScript types to `types.ts`
4. Use services layer for business logic
5. Keep components focused on presentation
6. Test Firebase operations in browser console if needed

When modifying Gemini calls:
1. Update schema in `responseSchema` prop
2. Validate new fields are returned correctly
3. Update TypeScript types
4. Add error handling for missing fields
5. Test with real sermon data if possible

## Claude Code Standards for Churchify Development

### NEVER
- Implement without showing options first (always use 1, 2, 3 format)
- Delete or remove content without asking first
- Delete anything created in the last 7 days without explicit approval
- Change something that was already working without verification
- Pretend work is done when it isn't complete
- Process batch operations without validating one item first
- Add features that weren't explicitly requested
- Use mock data when real data exists in database
- Explain or justify when receiving criticism (just fix the issue)
- Trust AI/subagent output without verification
- Create from scratch when similar functionality exists elsewhere

### ALWAYS
- Present options as numbered format: "1. Option A, 2. Option B, 3. Option C"
- Use AskUserQuestion tool when clarification is needed
- Check existing components and utilities before creating new ones
- Read COMPLETE schema before proposing database changes
- Investigate root cause when an error persists across attempts
- Commit changes before moving to the next task
- Create a handoff document in `docs/sessions/YYYY-MM/` at the end of the session
- Verify changes don't break existing functionality before marking complete
- Show specific file paths and line numbers when referencing code

---

*Last Updated: 2026-01-26*
*For use with Claude Code and future development work on Churchify*
