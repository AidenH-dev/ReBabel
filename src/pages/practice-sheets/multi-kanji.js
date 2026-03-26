import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import { FaArrowLeft } from 'react-icons/fa';
import MultiKanjiControlPanel from '@/components/PracticeSheets/MultiKanjiSheet/MultiKanjiControlPanel';
import MobileBackBubble from '@/components/PracticeSheets/shared/MobileBackBubble';

const MultiKanjiSheetViewer = dynamic(
  () =>
    import('@/components/PracticeSheets/MultiKanjiSheet/MultiKanjiSheetViewer'),
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

const DEFAULT_KANJI_LIST = [
  { kanji: '日', meaning: 'day, sun', onyomi: 'ニチ', kunyomi: 'ひ' },
  { kanji: '月', meaning: 'month, moon', onyomi: 'ゲツ', kunyomi: 'つき' },
  { kanji: '水', meaning: 'water', onyomi: 'スイ', kunyomi: 'みず' },
];

export default function MultiKanjiSheetPage() {
  const router = useRouter();
  const { user } = useUser();
  const [kanjiList, setKanjiList] = useState(DEFAULT_KANJI_LIST);
  const [layoutMode, setLayoutMode] = useState('compact');
  const [practiceRows, setPracticeRows] = useState(3);
  const [showGuides, setShowGuides] = useState(true);
  const [guideStyle, setGuideStyle] = useState('standard');
  const [noBackgroundColor, setNoBackgroundColor] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleReset = () => {
    setKanjiList(DEFAULT_KANJI_LIST);
    setLayoutMode('compact');
    setPracticeRows(3);
    setShowGuides(true);
    setGuideStyle('standard');
    setNoBackgroundColor(true);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const { downloadPdf } = await import('@/lib/practiceSheets/downloadPdf');
      const { default: MultiKanjiSheetDocument } =
        await import('@/components/PracticeSheets/MultiKanjiSheet/MultiKanjiSheetDocument');
      await downloadPdf(
        MultiKanjiSheetDocument,
        {
          kanjiList,
          layoutMode,
          practiceRows,
          showGuides,
          guideStyle,
          noBackgroundColor,
        },
        'multi-kanji-practice.pdf'
      );
    } finally {
      setDownloading(false);
    }
  };

  const viewerProps = {
    kanjiList,
    layoutMode,
    practiceRows,
    showGuides,
    guideStyle,
    noBackgroundColor,
  };

  return (
    <>
      <Head>
        <title>
          Multi-Kanji Writing Practice Sheets — Free Printable PDF | ReBabel
        </title>
        <meta
          name="description"
          content="Build multi-kanji writing practice workbooks with compact, full-page, and grid-only layout options. Free printable PDF export on ReBabel."
        />
        <meta
          name="keywords"
          content="multi kanji worksheet, kanji writing practice, japanese writing sheets, printable kanji pdf, kanji workbook, rebabel"
        />
        <link
          rel="canonical"
          href="https://www.rebabel.org/practice-sheets/multi-kanji"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Multi-Kanji Writing Practice Sheets — Free Printable PDF | ReBabel"
        />
        <meta
          property="og:description"
          content="Build multi-kanji writing practice workbooks with compact, full-page, and grid-only layout options. Free printable PDF."
        />
        <meta
          property="og:url"
          content="https://www.rebabel.org/practice-sheets/multi-kanji"
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://www.rebabel.org/practice-sheets/multi-kanji"
        />
        <meta
          property="twitter:title"
          content="Multi-Kanji Writing Practice Sheets — Free Printable PDF | ReBabel"
        />
        <meta
          property="twitter:description"
          content="Build multi-kanji writing practice workbooks with compact, full-page, and grid-only layout options."
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Multi-Kanji Writing Practice Sheet Generator',
              description:
                'Build multi-kanji writing practice workbooks with compact, full-page, and grid-only layout options. Free printable PDF export.',
              url: 'https://www.rebabel.org/practice-sheets/multi-kanji',
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
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-sm text-gray-700 transition hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:bg-gray-700 ${user ? 'hidden lg:inline-flex' : ''}`}
                aria-label="Go back"
              >
                <FaArrowLeft className="text-xs" />
              </button>
              <span
                className="text-2xl leading-none text-gray-900 dark:text-white"
                style={{ fontFamily: '"Noto Serif JP", serif' }}
              >
                字
              </span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Multi-Kanji Sheet
              </h1>
            </div>

            <MultiKanjiControlPanel
              kanjiList={kanjiList}
              onKanjiListChange={setKanjiList}
              layoutMode={layoutMode}
              onLayoutModeChange={setLayoutMode}
              practiceRows={practiceRows}
              onPracticeRowsChange={setPracticeRows}
              noBackgroundColor={noBackgroundColor}
              onNoBackgroundColorChange={setNoBackgroundColor}
              showGuides={showGuides}
              guideStyle={guideStyle}
              onShowGuidesChange={setShowGuides}
              onGuideStyleChange={setGuideStyle}
              downloading={downloading}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-xl dark:border-gray-700">
            <MultiKanjiSheetViewer {...viewerProps} />
          </section>
        </div>
      </main>
      <MobileBackBubble />
    </>
  );
}
