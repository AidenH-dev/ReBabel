import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import { FaArrowLeft } from 'react-icons/fa';
import MobileBackBubble from '@/components/PracticeSheets/shared/MobileBackBubble';
import { createListItem } from '@/components/PracticeSheets/shared/helpers';
import KanjiControlPanel from '@/components/PracticeSheets/KanjiSheet/KanjiControlPanel';
import {
  recommendedColumns,
  recommendedRows,
} from '@/lib/practiceSheets/constants';

const KanjiSheetViewer = dynamic(
  () => import('@/components/PracticeSheets/KanjiSheet/KanjiSheetViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] w-full flex-col items-center justify-center gap-3">
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid rgba(227,10,95,0.15)',
            borderTopColor: '#e30a5f',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p className="text-sm text-gray-400">Loading preview...</p>
      </div>
    ),
  }
);

export default function KanjiSheetPage() {
  const router = useRouter();
  const { user } = useUser();
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
    setter(items.map((item, i) => (i === index ? { ...item, value } : item)));
  };

  const addListItem = (setter, items, value) => {
    setter([...items, createListItem(value)]);
  };

  const removeListItem = (setter, items, index) => {
    setter(items.filter((_, i) => i !== index));
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
      const { downloadPdf } = await import('@/lib/practiceSheets/downloadPdf');
      const { default: KanjiSheetDocument } =
        await import('@/components/PracticeSheets/KanjiSheet/KanjiSheetDocument');
      await downloadPdf(
        KanjiSheetDocument,
        {
          kanji,
          meaningText,
          onList,
          kunList,
          practiceColumns,
          practiceRows,
          showGuides,
          guideStyle,
          includeTraceRow,
          noBackgroundColor,
        },
        `kanji-practice-${kanji || 'sheet'}.pdf`
      );
    } finally {
      setDownloading(false);
    }
  };

  const viewerProps = {
    kanji,
    meaningText,
    onList,
    kunList,
    practiceColumns,
    practiceRows,
    showGuides,
    guideStyle,
    includeTraceRow,
    noBackgroundColor,
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
        <link
          rel="canonical"
          href="https://www.rebabel.org/practice-sheets/kanji"
        />
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
          content="https://www.rebabel.org/practice-sheets/kanji"
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
          content="https://www.rebabel.org/practice-sheets/kanji"
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Kanji Writing Practice Sheet Generator',
              description:
                'Create printable kanji writing practice sheets with custom readings, meanings, guide styles, and PDF export.',
              url: 'https://www.rebabel.org/practice-sheets/kanji',
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

      <main className="min-h-screen overflow-y-auto bg-surface-page px-3 py-3 text-gray-900 dark:text-white sm:px-4 sm:py-4 lg:h-screen lg:overflow-hidden lg:p-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:mx-12 lg:my-7 lg:max-w-none lg:grid lg:h-[calc(100vh-56px)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-xl border border-gray-200 bg-surface-card p-4 shadow-xl dark:border-gray-700 lg:overflow-y-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="hidden h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-sm text-gray-700 transition hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:bg-gray-700 lg:inline-flex"
                aria-label="Go back"
              >
                <FaArrowLeft className="text-xs" />
              </button>
              <span
                className="text-2xl leading-none text-gray-900 dark:text-white"
                style={{ fontFamily: '"Noto Serif JP", serif' }}
              >
                漢
              </span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Kanji Sheet
              </h1>
            </div>

            <KanjiControlPanel
              kanji={kanji}
              onKanjiChange={setKanji}
              meaningList={meaningList}
              onyomiList={onyomiList}
              kunyomiList={kunyomiList}
              onAddMeaning={(value) =>
                addListItem(setMeaningList, meaningList, value)
              }
              onChangeMeaning={(index, value) =>
                updateListItem(setMeaningList, meaningList, index, value)
              }
              onRemoveMeaning={(index) =>
                removeListItem(setMeaningList, meaningList, index)
              }
              onReorderMeaning={(items) => setMeaningList(items)}
              onAddOnyomi={(value) =>
                addListItem(setOnyomiList, onyomiList, value)
              }
              onChangeOnyomi={(index, value) =>
                updateListItem(setOnyomiList, onyomiList, index, value)
              }
              onRemoveOnyomi={(index) =>
                removeListItem(setOnyomiList, onyomiList, index)
              }
              onReorderOnyomi={(items) => setOnyomiList(items)}
              onAddKunyomi={(value) =>
                addListItem(setKunyomiList, kunyomiList, value)
              }
              onChangeKunyomi={(index, value) =>
                updateListItem(setKunyomiList, kunyomiList, index, value)
              }
              onRemoveKunyomi={(index) =>
                removeListItem(setKunyomiList, kunyomiList, index)
              }
              onReorderKunyomi={(items) => setKunyomiList(items)}
              practiceColumns={practiceColumns}
              practiceRows={practiceRows}
              onColumnsChange={setPracticeColumns}
              onRowsChange={setPracticeRows}
              noBackgroundColor={noBackgroundColor}
              onNoBackgroundColorChange={setNoBackgroundColor}
              showGuides={showGuides}
              guideStyle={guideStyle}
              onShowGuidesChange={setShowGuides}
              onGuideStyleChange={setGuideStyle}
              includeTraceRow={includeTraceRow}
              onIncludeTraceRowChange={setIncludeTraceRow}
              downloading={downloading}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-xl dark:border-gray-700">
            <KanjiSheetViewer {...viewerProps} />
          </section>
        </div>
      </main>
      <MobileBackBubble />
    </>
  );
}
