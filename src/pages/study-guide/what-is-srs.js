import Head from 'next/head';
import { useRouter } from 'next/router';
import SRSGuideContent from '@/components/SRS/srs-guide-content';
import PublicLayout from '@/components/ui/PublicLayout';

export default function WhatIsSrsPage() {
  const router = useRouter();

  const handleSignup = () => {
    router.push('/api/auth/login');
  };

  return (
    <PublicLayout
      title="What Is SRS? A Japanese Learner's Guide to Spaced Repetition - ReBabel"
      footerColumns={['learn', 'support', 'platforms']}
      mainClassName="bg-white dark:bg-surface-page overflow-hidden"
    >
      <Head>
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

      <SRSGuideContent />

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto rounded-[2.25rem] bg-gradient-to-r from-brand-pink to-[#f54b8b] text-white p-8 md:p-12 shadow-2xl shadow-rose-200/70 dark:shadow-black/30">
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
                className="px-6 py-3 bg-white text-brand-pink-dark font-semibold rounded-xl hover:bg-rose-50 transition-colors"
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
    </PublicLayout>
  );
}
