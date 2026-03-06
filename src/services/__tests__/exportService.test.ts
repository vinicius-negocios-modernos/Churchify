import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToJSON } from '@/services/exportService';
import type { Episode } from '@/types/database';

// ─── DOM mocks ──────────────────────────────────────────────────────────────

let clickedAnchor: HTMLAnchorElement | null = null;
let lastBlobParts: string[] = [];
const OriginalBlob = globalThis.Blob;

beforeEach(() => {
  clickedAnchor = null;
  lastBlobParts = [];

  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    clickedAnchor = node as HTMLAnchorElement;
    return node;
  });
  vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

  // Replace Blob with a class that captures parts
  vi.stubGlobal(
    'Blob',
    class MockBlob {
      size: number;
      type: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(parts?: any[], options?: { type?: string }) {
        lastBlobParts = (parts ?? []) as string[];
        const content = lastBlobParts.join('');
        this.size = content.length;
        this.type = options?.type ?? '';
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  globalThis.Blob = OriginalBlob;
});

// ─── Fixtures ───────────────────────────────────────────────────────────────

const sampleEpisodes: Episode[] = [
  {
    id: 'ep-1',
    church_id: 'church-1',
    title: 'Sunday Sermon',
    youtube_url: 'https://youtube.com/watch?v=abc',
    sermon_date: '2026-03-01',
    status: 'completed',
    analysis_result: { spotifyDescriptionSnippet: 'Great sermon about faith' } as Episode['analysis_result'],
    created_by: 'user-1',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'ep-2',
    church_id: 'church-1',
    title: 'Midweek, "Prayer"',
    youtube_url: null,
    sermon_date: null,
    status: 'draft',
    analysis_result: null,
    created_by: 'user-1',
    created_at: '2026-03-02T10:00:00Z',
    updated_at: '2026-03-02T10:00:00Z',
  },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('exportToCSV', () => {
  it('generates valid CSV content with header and rows', () => {
    exportToCSV(sampleEpisodes, 'test.csv');

    const blobContent = lastBlobParts[0];
    const lines = blobContent.split('\n');
    expect(lines[0]).toBe('title,description,date,status,church_id,created_at');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[1]).toContain('Sunday Sermon');
    expect(lines[1]).toContain('Great sermon about faith');
  });

  it('escapes fields containing commas and double quotes', () => {
    exportToCSV(sampleEpisodes, 'test.csv');

    const blobContent = lastBlobParts[0];
    const lines = blobContent.split('\n');
    // Episode 2 title is: Midweek, "Prayer" — should be escaped
    expect(lines[2]).toContain('"Midweek, ""Prayer"""');
  });

  it('triggers a download with correct filename', () => {
    exportToCSV(sampleEpisodes, 'episodes-export.csv');

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickedAnchor?.download).toBe('episodes-export.csv');
    expect(clickedAnchor?.href).toContain('blob:mock-url');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('exportToJSON', () => {
  it('generates valid JSON with correct fields', () => {
    exportToJSON(sampleEpisodes, 'test.json');

    const parsed = JSON.parse(lastBlobParts[0]);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      title: 'Sunday Sermon',
      description: 'Great sermon about faith',
      date: '2026-03-01',
      status: 'completed',
      church_id: 'church-1',
      created_at: '2026-03-01T10:00:00Z',
    });
  });

  it('handles null analysis_result gracefully', () => {
    exportToJSON(sampleEpisodes, 'test.json');

    const parsed = JSON.parse(lastBlobParts[0]);
    expect(parsed[1].description).toBe('');
  });

  it('triggers a download with correct filename', () => {
    exportToJSON(sampleEpisodes, 'episodes.json');

    expect(clickedAnchor?.download).toBe('episodes.json');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
