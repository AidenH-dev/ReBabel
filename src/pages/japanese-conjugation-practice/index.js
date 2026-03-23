import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { TbLanguageHiragana } from 'react-icons/tb';
import { FaChevronDown } from 'react-icons/fa';
import SignupCTA from '@/components/Conjugation/Public/SignupCTA';

export async function getStaticProps() {
  const levels = {};
  for (const n of [5, 4, 3, 2, 1]) {
    try {
      const filePath = path.join(
        process.cwd(),
        'public',
        'data',
        'conjugation',
        `n${n}.json`
      );
      const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      levels[n] = {
        total: items.length,
        verbs: items.filter((i) => i.c === 'verb').length,
        iAdj: items.filter((i) => i.c === 'i-adjective').length,
        naAdj: items.filter((i) => i.c === 'na-adjective').length,
      };
    } catch {
      levels[n] = { total: 0, verbs: 0, iAdj: 0, naAdj: 0 };
    }
  }
  return { props: { levels }, revalidate: 86400 };
}

const LEVEL_COLORS = {
  5: 'from-green-500 to-emerald-600',
  4: 'from-blue-500 to-cyan-600',
  3: 'from-yellow-500 to-orange-500',
  2: 'from-purple-500 to-violet-600',
  1: 'from-red-500 to-rose-600',
};

const LEVEL_LABELS = {
  5: 'Beginner',
  4: 'Elementary',
  3: 'Intermediate',
  2: 'Upper Intermediate',
  1: 'Advanced',
};

function CollapsibleSection({ title, children }) {
  return (
    <details className="border border-black/5 dark:border-white/10 rounded-xl overflow-hidden group">
      <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {title}
        <FaChevronDown
          size={12}
          className="transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </details>
  );
}

export default function ConjugationPracticeHub({ levels }) {
  const title =
    'Japanese Conjugation Practice - Free JLPT Verb & Adjective Drills | ReBabel';
  const description =
    'Free Japanese verb conjugation practice for JLPT N5 to N1. Interactive drills for te-form, masu form, negative, past, potential, passive, causative and more. Type in romaji, get instant kana conversion and grading. 3,700+ words from godan, ichidan, and irregular verbs plus i-adjectives and na-adjectives.';

  const totalWords = Object.values(levels).reduce((sum, l) => sum + l.total, 0);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="Japanese conjugation practice, Japanese verb conjugator, JLPT verb practice, te-form drill, masu form practice, Japanese grammar practice free, godan ichidan verbs, i-adjective conjugation, na-adjective conjugation, JLPT N5 N4 N3 N2 N1, learn Japanese verbs, Japanese verb forms, conjugation quiz Japanese"
        />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1"
        />
        <link
          rel="canonical"
          href="https://www.rebabel.org/japanese-conjugation-practice"
        />
        <meta name="author" content="ReBabel" />
        <meta name="theme-color" content="#e30a5f" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:url"
          content="https://www.rebabel.org/japanese-conjugation-practice"
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta
          property="og:image"
          content="https://www.rebabel.org/og-conjugation-practice.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content="https://www.rebabel.org/og-conjugation-practice.png"
        />
        {/* LearningResource schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LearningResource',
              name: 'Japanese Conjugation Practice',
              description,
              url: 'https://www.rebabel.org/japanese-conjugation-practice',
              provider: {
                '@type': 'Organization',
                name: 'ReBabel',
                url: 'https://www.rebabel.org',
                logo: 'https://www.rebabel.org/og-conjugation-practice.png',
              },
              inLanguage: 'ja',
              isAccessibleForFree: true,
              educationalLevel: [
                'JLPT N5',
                'JLPT N4',
                'JLPT N3',
                'JLPT N2',
                'JLPT N1',
              ],
              learningResourceType: 'Practice exercise',
              interactivityType: 'active',
              numberOfItems: totalWords,
            }),
          }}
        />
        {/* FAQ schema for educational content -- enables rich snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is the difference between godan and ichidan verbs?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Ichidan (one-step) verbs end in -ru and conjugate by dropping ru and adding a suffix. Godan (five-step) verbs can end in any of 9 kana and change their final consonant depending on the form.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does Japanese te-form conjugation work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'For ichidan verbs, drop ru and add te. For godan verbs: u/tsu/ru become tte, nu/bu/mu become nde, ku becomes ite, gu becomes ide, su becomes shite. Exception: iku becomes itte.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do Japanese i-adjectives conjugate?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'I-adjectives end in i and conjugate by replacing i with the suffix: kunai (negative), katta (past), kunakatta (past negative), kute (te-form), ku (adverbial). Exception: ii (good) uses yo- as its stem.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How many conjugation forms do Japanese verbs have?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Standard Japanese verbs have around 19 commonly practiced forms including dictionary, negative, past, past negative, te-form, masu (polite), potential, passive, causative, causative-passive, imperative, volitional, conditional, and tai (desire) forms.',
                  },
                },
              ],
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
          {/* Hero */}
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-pink/10 text-brand-pink text-sm font-medium mb-4">
              <TbLanguageHiragana size={18} />
              Free Practice Tool
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Japanese Conjugation Practice
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Master verb and adjective conjugation for JLPT N5 through N1. Type
              in romaji, get instant kana conversion and feedback. No account
              required.
            </p>
          </div>

          {/* Level Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[5, 4, 3, 2, 1].map((n) => (
              <Link
                key={n}
                href={`/japanese-conjugation-practice/n${n}`}
                className="group bg-white dark:bg-surface-card rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${LEVEL_COLORS[n]} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    N{n}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      JLPT N{n}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {LEVEL_LABELS[n]}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>{levels[n].verbs} verbs</span>
                  <span>{levels[n].iAdj} i-adj</span>
                  <span>{levels[n].naAdj} na-adj</span>
                </div>
                <div className="text-sm font-medium text-brand-pink group-hover:underline">
                  Practice N{n} &rarr;
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mb-10">
            <SignupCTA />
          </div>

          {/* Educational Content */}
          <div className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How Japanese Conjugation Works
            </h2>
            <div className="space-y-3">
              <CollapsibleSection title="Godan vs Ichidan Verbs">
                <p className="mb-2">
                  Japanese verbs fall into two main groups.{' '}
                  <strong>Ichidan</strong> (one-step) verbs always end in -る
                  and conjugate by simply dropping る and adding the suffix. For
                  example: 食べる (taberu) &rarr; 食べます (tabemasu).
                </p>
                <p>
                  <strong>Godan</strong> (five-step) verbs can end in any of 9
                  kana (う, く, ぐ, す, つ, ぬ, ぶ, む, る) and change their
                  final consonant depending on the form. For example: 書く
                  (kaku) &rarr; 書きます (kakimasu), where く changes to き.
                </p>
              </CollapsibleSection>

              <CollapsibleSection title="Te-form Rules">
                <p className="mb-2">
                  The te-form is one of the most important conjugations. For
                  ichidan verbs, drop る and add て. For godan verbs, the ending
                  changes based on the final kana:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>う, つ, る &rarr; って (買う &rarr; 買って)</li>
                  <li>ぬ, ぶ, む &rarr; んで (飲む &rarr; 飲んで)</li>
                  <li>く &rarr; いて (書く &rarr; 書いて)</li>
                  <li>ぐ &rarr; いで (泳ぐ &rarr; 泳いで)</li>
                  <li>す &rarr; して (話す &rarr; 話して)</li>
                </ul>
                <p className="mt-2">
                  Exception: 行く (iku) &rarr; 行って (itte), not 行いて.
                </p>
              </CollapsibleSection>

              <CollapsibleSection title="I-Adjective Conjugation">
                <p className="mb-2">
                  I-adjectives end in い and conjugate by replacing い with the
                  appropriate suffix:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Negative: い &rarr; くない (高い &rarr; 高くない)</li>
                  <li>Past: い &rarr; かった (高い &rarr; 高かった)</li>
                  <li>Te-form: い &rarr; くて (高い &rarr; 高くて)</li>
                  <li>Adverbial: い &rarr; く (高い &rarr; 高く)</li>
                </ul>
                <p className="mt-2">
                  Exception: いい (good) uses よ- as its stem: よくない,
                  よかった.
                </p>
              </CollapsibleSection>

              <CollapsibleSection title="Na-Adjective Conjugation">
                <p>
                  Na-adjectives conjugate by adding suffixes to the stem: だ
                  (present), じゃない (negative), だった (past), じゃなかった
                  (past negative), で (te-form), に (adverbial). For example:
                  静か (shizuka) &rarr; 静かだ, 静かじゃない, 静かだった.
                </p>
              </CollapsibleSection>

              <CollapsibleSection title="Irregular Verbs">
                <p>
                  Japanese has only two truly irregular verbs: する (suru, to
                  do) and くる (kuru, to come). する compounds (勉強する,
                  料理する) all follow the same pattern. Additionally, 行く
                  (iku, to go) has an irregular te-form: 行って instead of the
                  expected 行いて.
                </p>
              </CollapsibleSection>
            </div>
          </div>

          {/* Related resources -- internal links for SEO */}
          <div className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
              More Study Resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/study-guide/what-is-srs"
                className="group bg-white dark:bg-surface-card rounded-xl shadow-sm border border-black/5 dark:border-white/5 p-4 hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-pink transition-colors">
                  What is Spaced Repetition?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Learn how SRS can help you retain conjugation patterns
                  long-term.
                </p>
              </Link>
              <Link
                href="/kanji-practice"
                className="group bg-white dark:bg-surface-card rounded-xl shadow-sm border border-black/5 dark:border-white/5 p-4 hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-pink transition-colors">
                  Kanji Writing Practice PDF Generator
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Generate custom kanji writing practice sheets to print and
                  study offline.
                </p>
              </Link>
            </div>
          </div>

          {/* Attribution */}
          <div className="text-center space-y-2 mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-600">
              Dictionary data from{' '}
              <a
                href="https://www.edrdg.org/jmdict/j_jmdict.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                JMdict
              </a>{' '}
              &mdash; copyright the{' '}
              <a
                href="https://www.edrdg.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Electronic Dictionary Research and Development Group
              </a>
              , used under{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                CC BY-SA 4.0
              </a>
              .
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-600">
              JLPT vocabulary lists by{' '}
              <a
                href="https://www.tanos.co.uk/jlpt/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Jonathan Waller
              </a>{' '}
              (
              <a
                href="https://www.tanos.co.uk/jlpt/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                tanos.co.uk
              </a>
              ).
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
