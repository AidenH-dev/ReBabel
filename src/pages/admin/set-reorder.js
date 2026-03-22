// Admin: Set Item Reordering (CSV bulk reorder)
// Load a set by ID, download current order as CSV, re-upload to reorder.
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { TbLoader3 } from 'react-icons/tb';
import { FiDownload, FiUpload, FiSearch } from 'react-icons/fi';

// ── CSV helpers ────────────────────────────────────────────────────────────

function escapeCell(value) {
  const str = String(value ?? '');
  const needsQuotes = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function buildReorderCSV(items) {
  const headers = ['position', 'item_id', 'type', 'label'];
  const rows = items.map((item, idx) => {
    let label = '';
    if (item.type === 'vocab') {
      const parts = [
        item.english,
        item.kana && `(${item.kana})`,
        item.kanji && `— ${item.kanji}`,
      ].filter(Boolean);
      label = parts.join(' ');
    } else {
      label = item.title || '';
    }
    return [idx + 1, item.id, item.type, label];
  });
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map((v) => escapeCell(String(v))).join(',')),
  ];
  return '\uFEFF' + lines.join('\r\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse a single CSV line, respecting quoted fields
function parseCSVLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  cells.push(current);
  return cells;
}

function parseReorderCSV(csvText) {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) return null;
  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const posIdx = header.indexOf('position');
  const idIdx = header.indexOf('item_id');
  if (posIdx === -1 || idIdx === -1) return null;

  const rows = lines
    .slice(1)
    .map((line) => {
      const cells = parseCSVLine(line);
      return {
        position: parseInt(cells[posIdx], 10),
        item_id: cells[idIdx]?.trim(),
      };
    })
    .filter((r) => !isNaN(r.position) && r.item_id);

  rows.sort((a, b) => a.position - b.position);
  return rows.map((r) => r.item_id);
}

// ── Page component ─────────────────────────────────────────────────────────

function SetReorderPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [setIdInput, setSetIdInput] = useState('');
  const [loadedSetId, setLoadedSetId] = useState('');
  const [setTitle, setSetTitle] = useState('');
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [isLoadingSet, setIsLoadingSet] = useState(false);

  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Auth check
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/api/auth/login');
      return;
    }
    const isAdmin =
      user?.['https://rebabel.org/app_metadata']?.isAdmin || false;
    if (!isAdmin) {
      router.push('/');
      return;
    }
    setIsAuthorized(true);
  }, [user, isLoading, router]);

  // Load set
  const handleLoadSet = async () => {
    const id = setIdInput.trim();
    if (!id) return;
    setIsLoadingSet(true);
    setLoadError(null);
    setItems([]);
    setSetTitle('');
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const res = await fetch(
        `/api/admin/set-reorder?setId=${encodeURIComponent(id)}`
      );
      const json = await res.json();
      if (!res.ok) {
        setLoadError(json.error || 'Failed to load set.');
        return;
      }
      const { set, items: setItems } = json.message;
      setLoadedSetId(id);
      setSetTitle(set?.title || id);
      setItems(setItems || []);
    } catch (err) {
      setLoadError('Network error — could not load set.');
    } finally {
      setIsLoadingSet(false);
    }
  };

  // Download current order as CSV
  const handleDownload = () => {
    const csv = buildReorderCSV(items);
    downloadCSV(csv, `set-order-${loadedSetId.slice(0, 8)}.csv`);
  };

  // Upload CSV and apply reorder
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setUploadError('Please select a valid CSV file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => applyCSV(ev.target.result);
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const applyCSV = async (csvText) => {
    setUploadError(null);
    setUploadSuccess(false);

    const itemIds = parseReorderCSV(csvText);
    if (!itemIds || itemIds.length < 2) {
      setUploadError(
        'Could not parse CSV. Ensure it has position and item_id columns with at least 2 rows.'
      );
      return;
    }

    // Verify all item_ids belong to this set
    const knownIds = new Set(items.map((i) => i.id));
    const unknown = itemIds.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) {
      setUploadError(
        `CSV contains item IDs not in this set: ${unknown.slice(0, 3).join(', ')}${unknown.length > 3 ? '…' : ''}`
      );
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/set-reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: loadedSetId, itemIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || 'Failed to apply reorder.');
        return;
      }
      setUploadSuccess(true);
      // Re-load the set to reflect new order
      handleLoadSet();
    } catch (err) {
      setUploadError('Network error — could not apply reorder.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-surface-elevated">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout
      sidebar="admin"
      title="Set Reorder - Admin - ReBabel"
      wrapperClassName="text-[#4e4a4a] dark:text-white"
      mainClassName="overflow-auto bg-white dark:bg-surface-elevated"
    >
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-1">Set Item Reorder</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Load a set by ID, download the current order as CSV, edit positions,
          and re-upload to apply.
        </p>

        {/* Set ID loader */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Set entity UUID"
            value={setIdInput}
            onChange={(e) => setSetIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadSet()}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-elevated text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
          />
          <button
            onClick={handleLoadSet}
            disabled={isLoadingSet || !setIdInput.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-pink text-white text-sm font-medium hover:bg-[#c00950] disabled:opacity-50 transition-colors"
          >
            {isLoadingSet ? (
              <TbLoader3 className="w-4 h-4 animate-spin" />
            ) : (
              <FiSearch className="w-4 h-4" />
            )}
            Load Set
          </button>
        </div>

        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {loadError}
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* Set header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{setTitle}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {items.length} items
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  Download CSV
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-pink text-white text-sm font-medium hover:bg-[#c00950] disabled:opacity-50 transition-colors"
                >
                  {isUploading ? (
                    <TbLoader3 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiUpload className="w-4 h-4" />
                  )}
                  Upload CSV
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* CSV format hint */}
            <div className="mb-4 px-3 py-2 rounded-lg bg-gray-50 dark:bg-surface-card border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              CSV columns:{' '}
              <code className="font-mono">position, item_id, type, label</code>.
              Edit <code className="font-mono">position</code> values to
              reorder, then re-upload.
              <code className="font-mono">item_id</code> is authoritative — do
              not edit it.
            </div>

            {uploadError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                Reorder applied successfully.
              </div>
            )}

            {/* Items list */}
            <div className="bg-white dark:bg-surface-card rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  <span className="flex-shrink-0 w-7 text-center text-xs font-mono text-gray-400 dark:text-gray-500 pt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {item.type === 'vocab' ? (
                      <>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.english}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-japanese">
                          {item.kana} {item.kanji && `(${item.kanji})`}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default SetReorderPage;
