import type { Episode } from '@/types/database';

const CSV_COLUMNS = ['title', 'description', 'date', 'status', 'church_id', 'created_at'] as const;

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function episodeToCsvRow(episode: Episode): string {
  const values = [
    episode.title,
    episode.analysis_result?.spotifyDescriptionSnippet ?? '',
    episode.sermon_date ?? '',
    episode.status,
    episode.church_id,
    episode.created_at,
  ];
  return values.map((v) => escapeCsvField(String(v))).join(',');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportToCSV(episodes: Episode[], filename = 'episodes.csv'): void {
  const header = CSV_COLUMNS.join(',');
  const rows = episodes.map(episodeToCsvRow);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportToJSON(episodes: Episode[], filename = 'episodes.json'): void {
  const data = episodes.map((ep) => ({
    title: ep.title,
    description: ep.analysis_result?.spotifyDescriptionSnippet ?? '',
    date: ep.sermon_date,
    status: ep.status,
    church_id: ep.church_id,
    created_at: ep.created_at,
  }));
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}
