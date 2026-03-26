import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { TbFileDescription } from 'react-icons/tb';

const SHEET_TYPES = [
  {
    href: '/practice-sheets/kanji',
    char: '漢',
    title: 'Kanji Practice Sheets',
    description:
      'Create custom practice sheets for individual kanji with readings, meanings, and guide lines.',
  },
  {
    href: '/practice-sheets/multi-kanji',
    char: '字',
    title: 'Multi-Kanji Workbook',
    description:
      'Build multi-kanji practice sheets with compact, full-page, or grid-only layouts.',
  },
  {
    href: '/practice-sheets/hiragana',
    char: 'あ',
    title: 'Hiragana Practice Sheets',
    description:
      'Practice hiragana writing with presets for the full alphabet, vowels, or custom row selection.',
  },
  {
    href: '/practice-sheets/katakana',
    char: 'ア',
    title: 'Katakana Practice Sheets',
    description:
      'Practice katakana writing with presets for the full alphabet, vowels, or custom row selection.',
  },
];

export default function PracticeSheetsHub() {
  const title =
    'Japanese Writing Practice Sheets — Free Printable PDFs | ReBabel';
  const description =
    'Create free printable Japanese writing practice sheets. Custom kanji, hiragana, and katakana practice PDFs with guide lines, model rows, and multiple layout options.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="japanese writing practice, kanji practice sheets, hiragana practice, katakana practice, printable japanese pdf, rebabel"
        />
        <link rel="canonical" href="https://www.rebabel.org/practice-sheets" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:url"
          content="https://www.rebabel.org/practice-sheets"
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Japanese Writing Practice Sheet Generator',
              description,
              url: 'https://www.rebabel.org/practice-sheets',
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

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-surface-page/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/ReBabelIcon.png"
                alt="ReBabel"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-brand-pink">
                ReBabel
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/api/auth/login"
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/api/auth/login"
                className="px-4 py-2 text-sm bg-brand-pink hover:bg-brand-pink-hover text-white font-medium rounded-lg transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-surface-page dark:to-surface-card pt-8 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
          {/* Hero */}
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-pink/10 text-brand-pink text-sm font-medium mb-4">
              <TbFileDescription size={18} />
              Practice Sheets
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Japanese Writing Practice
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create printable practice sheets for kanji, hiragana, and
              katakana. Customize guide styles, grid sizes, and layout options.
              Download as PDF — no account required.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {SHEET_TYPES.map((sheet) => (
              <Link
                key={sheet.href}
                href={sheet.href}
                className="group bg-white dark:bg-surface-card rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-2xl leading-none text-gray-900 transition-colors group-hover:text-brand-pink dark:text-white"
                    style={{ fontFamily: '"Noto Serif JP", serif' }}
                  >
                    {sheet.char}
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {sheet.title}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {sheet.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
