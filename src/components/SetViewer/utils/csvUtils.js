export { toSlug } from '@/lib/slug';

export function escapeCSVCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const needsQuotes = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCSV(items) {
  const headers = [
    'id',
    'type',
    'english',
    'kana',
    'kanji',
    'lexical_category',
    'title',
    'description',
    'topic',
    'status',
    'srs_level',
    'example_sentences',
    'tags',
  ];

  const rows = items.map((it) => {
    const ex = Array.isArray(it.example_sentences) ? it.example_sentences : [];
    const exJoined = ex.join(' || ');
    const tagsJoined = Array.isArray(it.tags) ? it.tags.join(' | ') : '';

    return [
      it.id ?? '',
      it.type ?? '',
      it.english ?? '',
      it.kana ?? '',
      it.kanji ?? '',
      it.lexical_category ?? '',
      it.title ?? '',
      it.description ?? '',
      it.topic ?? '',
      it.status ?? '',
      it.srs_level ?? '',
      exJoined,
      tagsJoined,
    ];
  });

  const lines = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map((r) => r.map(escapeCSVCell).join(',')),
  ];

  return '\uFEFF' + lines.join('\r\n');
}

export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
