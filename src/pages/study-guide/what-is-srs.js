import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SRSGuideContent from '@/components/SRS/srs-guide-content';

export default function WhatIsSrsPage() {
  const router = useRouter();

  const handleSignup = () => {
    router.push('/api/auth/login');
  };

  return (
    <>
      <Head>
        <title>
          What Is SRS? A Japanese Learner&apos;s Guide to Spaced Repetition -
          ReBabel
        </title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta
          name="description"
          content="Learn what spaced repetition is, how Anki uses SRS, and how to use ReBabel to review Japanese vocabulary and grammar more effectively."
        />
        <meta
          name="keywords"
          content="what is srs, spaced repetition japanese, anki spaced repetition, japanese flashcards, japanese grammar srs, rebabel"
        />
        <meta name="author" content="ReBabel" />
        <meta name="theme-color" content="#e30a5f" />
        <link
          rel="canonical"
          href="https://www.rebabel.org/study-guide/what-is-srs"
        />

        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content="https://www.rebabel.org/study-guide/what-is-srs"
        />
        <meta
          property="og:title"
          content="What Is SRS? A Japanese Learner's Guide to Spaced Repetition"
        />
        <meta
          property="og:description"
          content="Understand spaced repetition, see how Anki uses it, and learn how ReBabel applies SRS to Japanese grammar and vocabulary practice."
        />
        <meta
          property="og:image"
          content="https://www.rebabel.org/og-srs-guide.png"
        />
        <meta
          property="og:image:alt"
          content="What Is SRS? A guide to spaced repetition for Japanese learners"
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="og:locale" content="en_US" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://www.rebabel.org/study-guide/what-is-srs"
        />
        <meta
          property="twitter:title"
          content="What Is SRS? A Japanese Learner's Guide to Spaced Repetition"
        />
        <meta
          property="twitter:description"
          content="Understand spaced repetition, see how Anki uses it, and learn how ReBabel applies SRS to Japanese grammar and vocabulary practice."
        />
        <meta
          property="twitter:image"
          content="https://www.rebabel.org/og-srs-guide.png"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline:
                "What Is SRS? A Japanese Learner's Guide to Spaced Repetition",
              description:
                'Learn what spaced repetition is, how Anki uses SRS, and how to use ReBabel to review Japanese vocabulary and grammar more effectively.',
              image: 'https://www.rebabel.org/og-image.png',
              author: {
                '@type': 'Organization',
                name: 'ReBabel',
              },
              publisher: {
                '@type': 'Organization',
                name: 'ReBabel',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://www.rebabel.org/og-image.png',
                },
              },
              mainEntityOfPage:
                'https://www.rebabel.org/study-guide/what-is-srs',
            }),
          }}
        />
      </Head>

      <nav className="fixed top-0 w-full bg-white/90 dark:bg-[#141f25]/90 backdrop-blur-md border-b border-rose-100 dark:border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#e30a5f]">ReBabel</span>
              <span className="text-xs bg-[#fff1f6] dark:bg-rose-950/40 text-[#b0104f] dark:text-rose-300 px-2 py-1 rounded-full border border-rose-200 dark:border-rose-800/50">
                Study Guide
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/blog"
                className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Blog
              </Link>
              <button
                onClick={handleSignup}
                className="px-4 py-2 text-sm bg-[#e30a5f] hover:bg-[#f41567] text-white font-medium rounded-lg transition-colors"
              >
                Start Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="bg-white dark:bg-[#141f25] overflow-hidden">
        <SRSGuideContent />

        <section className="w-full px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-5xl mx-auto rounded-[2.25rem] bg-gradient-to-r from-[#e30a5f] to-[#f54b8b] text-white p-8 md:p-12 shadow-2xl shadow-rose-200/70 dark:shadow-black/30">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-rose-100 mb-3">
                  Next step
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  If SRS makes sense to you, the best move is to start small and
                  stay consistent.
                </h2>
                <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
                  Create a set, review what is due, and let repetition work
                  quietly in the background while you keep studying Japanese.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <button
                  onClick={handleSignup}
                  className="px-6 py-3 bg-white text-[#b0104f] font-semibold rounded-xl hover:bg-rose-50 transition-colors"
                >
                  Start Free
                </button>
                <a
                  href="https://apps.apple.com/us/app/rebabel/id6758738478"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-center"
                >
                  Download iOS App
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#e30a5f] mb-4">ReBabel</h3>
              <p className="text-sm text-gray-400">
                Building the future of Japanese learning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Learn</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/study-guide/what-is-srs"
                    className="hover:text-white"
                  >
                    What Is SRS?
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help & FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platforms</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="https://apps.apple.com/us/app/rebabel/id6758738478"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    iOS App
                  </a>
                </li>
                <li>
                  <Link href="/api/auth/login" className="hover:text-white">
                    Start Free
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>
              &copy; 2025 ReBabel. All rights reserved. Currently in beta
              development.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
