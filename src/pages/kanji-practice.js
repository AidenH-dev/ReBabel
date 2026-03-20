/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';

const KanjiPracticeViewer = dynamic(
  () => import('@/components/KanjiPractice/KanjiPracticeViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] w-full items-center justify-center text-sm text-slate-400">
        Loading preview…
      </div>
    ),
  }
);
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FaArrowLeft,
  FaDownload,
  FaMagic,
  FaUndo,
  FaTimes,
} from 'react-icons/fa';

const cellSizePx = 48;
const recommendedColumns = 14;
const recommendedRows = 12;
const labelFontFamily =
  'Hiragino Maru Gothic ProN, Hiragino Sans, Hiragino Kaku Gothic ProN, Yu Gothic, Meiryo, sans-serif';
const japaneseUiFontFamily =
  'Hiragino Maru Gothic ProN, Hiragino Sans, Hiragino Kaku Gothic ProN, Yu Gothic, Meiryo, sans-serif';
const kanjiFontFamily =
  'ui-serif, Georgia, Cambria, Times New Roman, Times, serif';
const japaneseHeaderFontFamily =
  'Hiragino Maru Gothic ProN, Hiragino Sans, Yu Gothic, Meiryo, sans-serif';
const accentColor = '#B0104F';

function getTextWidthPx(text) {
  if (typeof document === 'undefined') return 40;
  const canvas = getTextWidthPx.canvas || document.createElement('canvas');
  getTextWidthPx.canvas = canvas;
  const context = canvas.getContext('2d');
  if (!context) return 40;
  context.font =
    '14px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  return Math.ceil(context.measureText(text || '').width);
}

function createListItem(value) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    value,
  };
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function SvgText({
  text,
  width,
  height,
  fontSize,
  color = '#111111',
  weight = '600',
  letterSpacing = '0',
  family = 'Arial, sans-serif',
  align = 'left',
  baseline = '50%',
  strokeColor,
  strokeWidth = 0,
}) {
  const x = align === 'center' ? '50%' : align === 'right' ? '100%' : '0';
  const anchor =
    align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="${x}" y="${baseline}" dominant-baseline="middle" text-anchor="${anchor}" font-family="${family}" font-size="${fontSize}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="${color}" stroke="${strokeColor || 'none'}" stroke-width="${strokeWidth}" paint-order="stroke fill">${String(
    text || ''
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</text></svg>`;

  return (
    <img
      src={svgToDataUri(svg)}
      alt={typeof text === 'string' ? text : ''}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  );
}

function ExportStableText({
  text,
  width,
  height,
  fontSize,
  color,
  weight = '600',
  letterSpacing = '0',
  family = 'Arial, sans-serif',
  align = 'left',
  baseline = '50%',
  strokeColor,
  strokeWidth,
}) {
  return (
    <SvgText
      text={text}
      width={width}
      height={height}
      fontSize={fontSize}
      color={color}
      weight={weight}
      letterSpacing={letterSpacing}
      family={family}
      align={align}
      baseline={baseline}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
}

getTextWidthPx.canvas = null;

function BubbleListField({
  label,
  items,
  onAdd,
  onChange,
  onRemove,
  onReorder,
  placeholder,
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const submitDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus-within:border-[#e30a5f] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#e30a5f]/20">
        <div
          ref={scrollRef}
          className="flex min-h-[28px] items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={horizontalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableBubbleChip
                  key={item.id}
                  item={item}
                  index={index}
                  onChange={onChange}
                  onRemove={onRemove}
                />
              ))}
            </SortableContext>
          </DndContext>

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitDraft();
              }
            }}
            placeholder={placeholder}
            className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </label>
  );
}

function SortableBubbleChip({ item, index, onChange, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
      }}
      className="flex shrink-0 cursor-grab select-none items-center gap-1 rounded-full border border-[#e30a5f]/25 bg-[#e30a5f]/10 px-2 py-0.5 text-[#e30a5f] active:cursor-grabbing"
    >
      <input
        value={item.value}
        onChange={(event) => onChange(index, event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ width: `${Math.max(getTextWidthPx(item.value) + 3, 22)}px` }}
        className="bg-transparent text-sm text-[#e30a5f] outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="rounded-sm pl-0.5 pr-0 text-xs text-[#e30a5f]/80 transition hover:text-[#e30a5f]"
        aria-label="Remove item"
      >
        <FaTimes className="text-[10px]" />
      </button>
    </div>
  );
}

function PracticeCell({ value, faint, showGuides, guideStyle }) {
  return (
    <div
      className="relative border border-[#d0d0d0] bg-white"
      style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
    >
      {showGuides ? (
        guideStyle === 'dotted-cross' ? (
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${cellSizePx} ${cellSizePx}`}
            aria-hidden="true"
          >
            <line
              x1={cellSizePx / 2}
              y1="0"
              x2={cellSizePx / 2}
              y2={cellSizePx}
              stroke="#e3e3e3"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <line
              x1="0"
              y1={cellSizePx / 2}
              x2={cellSizePx}
              y2={cellSizePx / 2}
              stroke="#e3e3e3"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
          </svg>
        ) : (
          <>
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#ececec]" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#ececec]" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49.4%,#ececec_49.4%,#ececec_50.6%,transparent_50.6%),linear-gradient(135deg,transparent_49.4%,#ececec_49.4%,#ececec_50.6%,transparent_50.6%)]" />
          </>
        )
      ) : null}
      <div className="relative z-10 flex h-full items-center justify-center">
        {value ? (
          <SvgText
            text={value}
            width={34}
            height={34}
            fontSize={34}
            color={faint ? '#b8b8b8' : '#111111'}
            weight="400"
            family={kanjiFontFamily}
            align="center"
            baseline={faint ? '61%' : '54%'}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function KanjiPdfTestPage() {
  const [kanji, setKanji] = useState('水');
  const [meaningList, setMeaningList] = useState([createListItem('water')]);
  const [onyomiList, setOnyomiList] = useState([createListItem('スイ')]);
  const [kunyomiList, setKunyomiList] = useState([createListItem('みず')]);
  const [practiceColumns, setPracticeColumns] = useState(recommendedColumns);
  const [practiceRows, setPracticeRows] = useState(recommendedRows);
  const [showGuides, setShowGuides] = useState(true);
  const [guideStyle, setGuideStyle] = useState('standard');
  const [includeTraceRow, setIncludeTraceRow] = useState(true);
  const [noBackgroundColor, setNoBackgroundColor] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const meaningText = useMemo(
    () =>
      meaningList
        .map((item) => item.value.trim())
        .filter(Boolean)
        .join(', '),
    [meaningList]
  );
  const onList = useMemo(
    () => onyomiList.map((item) => item.value.trim()).filter(Boolean),
    [onyomiList]
  );
  const kunList = useMemo(
    () => kunyomiList.map((item) => item.value.trim()).filter(Boolean),
    [kunyomiList]
  );

  const updateListItem = (setter, items, index, value) => {
    setter(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, value } : item
      )
    );
  };

  const addListItem = (setter, items, value) => {
    setter([...items, createListItem(value)]);
  };

  const removeListItem = (setter, items, index) => {
    setter(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleReset = () => {
    setKanji('水');
    setMeaningList([createListItem('water')]);
    setOnyomiList([createListItem('スイ')]);
    setKunyomiList([createListItem('みず')]);
    setPracticeColumns(recommendedColumns);
    setPracticeRows(recommendedRows);
    setShowGuides(true);
    setGuideStyle('standard');
    setIncludeTraceRow(true);
    setNoBackgroundColor(true);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const [{ pdf }, { default: KanjiPracticeDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/KanjiPractice/KanjiPracticeDocument'),
      ]);

      const blob = await pdf(
        <KanjiPracticeDocument
          kanji={kanji}
          meaningText={meaningText}
          onList={onList}
          kunList={kunList}
          practiceColumns={practiceColumns}
          practiceRows={practiceRows}
          showGuides={showGuides}
          guideStyle={guideStyle}
          includeTraceRow={includeTraceRow}
          noBackgroundColor={noBackgroundColor}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanji-practice-${kanji || 'sheet'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Kanji Writing Practice Sheet Generator | ReBabel</title>
        <meta
          name="description"
          content="Create printable kanji writing practice sheets with custom readings, meanings, guide styles, and PDF export on ReBabel."
        />
        <meta
          name="keywords"
          content="kanji worksheet generator, kanji writing practice, japanese writing sheets, printable kanji pdf, rebabel"
        />
        <link rel="canonical" href="https://www.rebabel.org/kanji-practice" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Kanji Writing Practice Sheet Generator | ReBabel"
        />
        <meta
          property="og:description"
          content="Build clean printable kanji practice PDFs with custom rows, guides, and readings."
        />
        <meta
          property="og:url"
          content="https://www.rebabel.org/kanji-practice"
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta
          property="og:image"
          content="https://www.rebabel.org/og-kanji-practice.png"
        />
        <meta
          property="og:image:alt"
          content="Kanji writing practice sheet generator with grid and guide lines"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://www.rebabel.org/kanji-practice"
        />
        <meta
          property="twitter:title"
          content="Kanji Writing Practice Sheet Generator | ReBabel"
        />
        <meta
          property="twitter:description"
          content="Build clean printable kanji practice PDFs with custom rows, guides, and readings."
        />
        <meta
          property="twitter:image"
          content="https://www.rebabel.org/og-kanji-practice.png"
        />

        {/* JSON-LD SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Kanji Writing Practice Sheet Generator',
              description:
                'Create printable kanji writing practice sheets with custom readings, meanings, guide styles, and PDF export.',
              url: 'https://www.rebabel.org/kanji-practice',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Organization',
                name: 'ReBabel',
                url: 'https://www.rebabel.org',
              },
            }),
          }}
        />
      </Head>

      <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(64,79,125,0.18),_transparent_28%),linear-gradient(180deg,_#fcfaf7_0%,_#f4ede3_52%,_#eef3f6_100%)] px-3 py-3 text-slate-900 sm:px-4 sm:py-4 lg:h-screen lg:overflow-hidden lg:px-6 lg:py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:grid lg:h-full lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-4 lg:overflow-y-auto">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#e30a5f]/20 bg-[#fff5f8] text-sm font-semibold text-[#b0104f] transition hover:border-[#e30a5f]/40 hover:bg-white"
                aria-label="Back to home"
              >
                <FaArrowLeft className="text-xs" />
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B0104F] text-white shadow-lg shadow-[#B0104F]/20">
                <FaMagic />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Kanji PDF Editor</h1>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Kanji
                </span>
                <input
                  value={kanji}
                  onChange={(event) => setKanji(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              <BubbleListField
                label="Meaning"
                items={meaningList}
                onAdd={(value) =>
                  addListItem(setMeaningList, meaningList, value)
                }
                onChange={(index, value) =>
                  updateListItem(setMeaningList, meaningList, index, value)
                }
                onRemove={(index) =>
                  removeListItem(setMeaningList, meaningList, index)
                }
                onReorder={(items) => setMeaningList(items)}
                placeholder="Add meaning"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <BubbleListField
                  label="On'yomi"
                  items={onyomiList}
                  onAdd={(value) =>
                    addListItem(setOnyomiList, onyomiList, value)
                  }
                  onChange={(index, value) =>
                    updateListItem(setOnyomiList, onyomiList, index, value)
                  }
                  onRemove={(index) =>
                    removeListItem(setOnyomiList, onyomiList, index)
                  }
                  onReorder={(items) => setOnyomiList(items)}
                  placeholder="Add on'yomi"
                />

                <BubbleListField
                  label="Kun'yomi"
                  items={kunyomiList}
                  onAdd={(value) =>
                    addListItem(setKunyomiList, kunyomiList, value)
                  }
                  onChange={(index, value) =>
                    updateListItem(setKunyomiList, kunyomiList, index, value)
                  }
                  onRemove={(index) =>
                    removeListItem(setKunyomiList, kunyomiList, index)
                  }
                  onReorder={(items) => setKunyomiList(items)}
                  placeholder="Add kun'yomi"
                />
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Columns
                    </span>
                    <input
                      type="range"
                      min="4"
                      max="14"
                      value={practiceColumns}
                      onChange={(event) =>
                        setPracticeColumns(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Rows
                    </span>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      value={practiceRows}
                      onChange={(event) =>
                        setPracticeRows(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </label>
                </div>

                <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={noBackgroundColor}
                    onChange={(event) =>
                      setNoBackgroundColor(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#e30a5f] focus:ring-[#e30a5f]"
                  />
                  No background color
                </label>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Guides
                    </p>
                    <div className="grid grid-cols-3 rounded-2xl bg-white p-1 ring-1 ring-[#e30a5f]/20">
                      <button
                        type="button"
                        onClick={() => setShowGuides(false)}
                        className={`rounded-xl px-2 py-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                          !showGuides
                            ? 'bg-[#e30a5f] text-white'
                            : 'text-slate-600 hover:bg-[#e30a5f]/10 hover:text-[#e30a5f]'
                        }`}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGuides(true);
                          setGuideStyle('standard');
                        }}
                        className={`rounded-xl px-2 py-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                          showGuides && guideStyle === 'standard'
                            ? 'bg-[#e30a5f] text-white'
                            : 'text-slate-600 hover:bg-[#e30a5f]/10 hover:text-[#e30a5f]'
                        }`}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGuides(true);
                          setGuideStyle('dotted-cross');
                        }}
                        className={`rounded-xl px-2 py-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                          showGuides && guideStyle === 'dotted-cross'
                            ? 'bg-[#e30a5f] text-white'
                            : 'text-slate-600 hover:bg-[#e30a5f]/10 hover:text-[#e30a5f]'
                        }`}
                      >
                        Dotted
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Model row
                    </p>
                    <div className="grid grid-cols-2 rounded-2xl bg-white p-1 ring-1 ring-[#e30a5f]/20">
                      <button
                        type="button"
                        onClick={() => setIncludeTraceRow(true)}
                        className={`rounded-xl px-2 py-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                          includeTraceRow
                            ? 'bg-[#e30a5f] text-white'
                            : 'text-slate-600 hover:bg-[#e30a5f]/10 hover:text-[#e30a5f]'
                        }`}
                      >
                        Show
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncludeTraceRow(false)}
                        className={`rounded-xl px-2 py-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                          !includeTraceRow
                            ? 'bg-[#e30a5f] text-white'
                            : 'text-slate-600 hover:bg-[#e30a5f]/10 hover:text-[#e30a5f]'
                        }`}
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-[#e30a5f] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#b0104f] disabled:cursor-wait disabled:opacity-70"
                >
                  <FaDownload />
                  {downloading ? 'Rendering PDF...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-[#e30a5f]/30 bg-white px-4 py-3 text-xs font-semibold text-[#b0104f] transition hover:border-[#e30a5f] hover:bg-[#e30a5f]/10"
                >
                  <FaUndo />
                  Reset sample
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/40 p-1 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-2 lg:overflow-hidden">
            <KanjiPracticeViewer
              kanji={kanji}
              meaningText={meaningText}
              onList={onList}
              kunList={kunList}
              practiceColumns={practiceColumns}
              practiceRows={practiceRows}
              showGuides={showGuides}
              guideStyle={guideStyle}
              includeTraceRow={includeTraceRow}
              noBackgroundColor={noBackgroundColor}
            />
          </section>
        </div>
      </main>
    </>
  );
}
