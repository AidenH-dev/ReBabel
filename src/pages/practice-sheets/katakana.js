import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import { FaArrowLeft } from 'react-icons/fa';
import { KATAKANA_ROWS, PRESETS } from '@/lib/practiceSheets/kanaData';
import MobileBackBubble from '@/components/PracticeSheets/shared/MobileBackBubble';
import KanaControlPanel from '@/components/PracticeSheets/KanaSheet/KanaControlPanel';

const KanaSheetViewer = dynamic(
  () => import('@/components/PracticeSheets/KanaSheet/KanaSheetViewer'),
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

export default function KatakanaPracticePage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedRowIds, setSelectedRowIds] = useState(
    new Set(PRESETS.full.rowIds)
  );
  const [practiceRows, setPracticeRows] = useState(3);
  const [showGuides, setShowGuides] = useState(true);
  const [guideStyle, setGuideStyle] = useState('standard');
  const [noBackgroundColor, setNoBackgroundColor] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const characters = useMemo(
    () =>
      KATAKANA_ROWS.filter((row) => selectedRowIds.has(row.id)).flatMap(
        (row) => row.chars
      ),
    [selectedRowIds]
  );

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const { downloadPdf } = await import('@/lib/practiceSheets/downloadPdf');
      const { default: KanaSheetDocument } =
        await import('@/components/PracticeSheets/KanaSheet/KanaSheetDocument');
      await downloadPdf(
        KanaSheetDocument,
        {
          characters,
          characterType: 'katakana',
          practiceRows,
          showGuides,
          guideStyle,
          noBackgroundColor,
        },
        'katakana-practice.pdf'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setSelectedRowIds(new Set(PRESETS.full.rowIds));
    setPracticeRows(3);
    setShowGuides(true);
    setGuideStyle('standard');
    setNoBackgroundColor(true);
  };

  return (
    <>
      <Head>
        <title>
          Katakana Writing Practice Sheets — Free Printable PDF | ReBabel
        </title>
        <meta
          name="description"
          content="Create free printable katakana writing practice sheets. Select rows or use presets for the full alphabet, vowels, dakuten, and more. Download as PDF."
        />
        <meta
          name="keywords"
          content="katakana practice, katakana writing sheets, printable katakana pdf, japanese writing practice, rebabel"
        />
        <link
          rel="canonical"
          href="https://www.rebabel.org/practice-sheets/katakana"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Katakana Writing Practice Sheets | ReBabel"
        />
        <meta
          property="og:description"
          content="Create free printable katakana writing practice sheets with custom row selection and guide styles."
        />
        <meta
          property="og:url"
          content="https://www.rebabel.org/practice-sheets/katakana"
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Katakana Writing Practice Sheet Generator',
              description:
                'Create printable katakana writing practice sheets with custom row selection, guide styles, and PDF export.',
              url: 'https://www.rebabel.org/practice-sheets/katakana',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-sm text-gray-700 transition hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:bg-gray-700 hidden lg:inline-flex`}
                aria-label="Go back"
              >
                <FaArrowLeft className="text-xs" />
              </button>
              <span
                className="text-2xl leading-none text-gray-900 dark:text-white"
                style={{ fontFamily: '"Noto Serif JP", serif' }}
              >
                ア
              </span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Katakana Sheet
              </h1>
            </div>

            <KanaControlPanel
              characterType="katakana"
              selectedRowIds={selectedRowIds}
              onSelectedRowIdsChange={setSelectedRowIds}
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
            <KanaSheetViewer
              characters={characters}
              characterType="katakana"
              practiceRows={practiceRows}
              showGuides={showGuides}
              guideStyle={guideStyle}
              noBackgroundColor={noBackgroundColor}
            />
          </section>
        </div>
      </main>
      <MobileBackBubble />
    </>
  );
}
