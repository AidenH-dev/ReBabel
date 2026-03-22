import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import fs from 'fs';
import path from 'path';
import { generateQuestions } from '@/lib/conjugation';
import PublicConfigPanel from '@/components/ConjugationPractice/PublicConfigPanel';
import PublicConjugationCard from '@/components/ConjugationPractice/PublicConjugationCard';
import PublicSessionHeader from '@/components/ConjugationPractice/PublicSessionHeader';
import PublicSummaryView from '@/components/ConjugationPractice/PublicSummaryView';

const VALID_LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'];

export async function getStaticPaths() {
  return {
    paths: VALID_LEVELS.map((level) => ({ params: { level } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const level = params.level;
  const num = parseInt(level.replace('n', ''), 10);

  const filePath = path.join(
    process.cwd(),
    'public',
    'data',
    'conjugation',
    `${level}.json`
  );
  let items = [];
  try {
    items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { notFound: true };
  }

  const levelStats = {
    total: items.length,
    verbs: items.filter((i) => i.c === 'verb').length,
    iAdj: items.filter((i) => i.c === 'i-adjective').length,
    naAdj: items.filter((i) => i.c === 'na-adjective').length,
  };

  return {
    props: { level: num, levelKey: level, levelStats },
    revalidate: 86400,
  };
}

export default function ConjugationPracticeLevelPage({
  level,
  levelKey,
  levelStats,
}) {
  const router = useRouter();
  const [phase, setPhase] = useState('config'); // config | loading | session | summary
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredItems, setAnsweredItems] = useState([]);
  const [animateAccuracy, setAnimateAccuracy] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
    accuracy: 0,
  });

  const handleStart = async (config) => {
    setPhase('loading');
    try {
      let itemsToUse;

      if (config.focalItems && config.focalItems.length > 0) {
        // Use specific items selected by user
        itemsToUse = config.focalItems;
      } else {
        // Fetch full level data
        const res = await fetch(`/data/conjugation/${levelKey}.json`);
        itemsToUse = await res.json();
      }

      // Map compact format to what generateQuestions expects
      const mapped = itemsToUse.map((item) => ({
        kana: item.k,
        kanji: item.j,
        english: item.e,
        lexical_category: item.c,
        verb_group: item.g || null,
      }));

      const count =
        config.count === 'all' || config.count === 9999 ? 9999 : config.count;
      const qs = generateQuestions(
        mapped,
        config.selectedVerbForms,
        config.selectedAdjForms,
        count,
        config.randomMode
      );

      if (qs.length === 0) {
        alert(
          'No questions could be generated. Try selecting different forms.'
        );
        setPhase('config');
        return;
      }

      setQuestions(qs);
      setCurrentIndex(0);
      setAnsweredItems([]);
      setSessionStats({
        correct: 0,
        incorrect: 0,
        totalAttempts: 0,
        accuracy: 0,
      });
      setAnimateAccuracy(false);
      setPhase('session');
    } catch {
      alert('Failed to load practice data.');
      setPhase('config');
    }
  };

  const handleAnswerSubmitted = (result) => {
    if (result.isRetraction) {
      setAnsweredItems((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && !last.isCorrect) {
          updated.pop();
          setSessionStats((s) => {
            const nc = s.correct;
            const ni = s.incorrect - 1;
            const nt = s.totalAttempts - 1;
            return {
              correct: nc,
              incorrect: ni,
              totalAttempts: nt,
              accuracy: nt > 0 ? Math.round((nc / nt) * 100) : 0,
            };
          });
        }
        return updated;
      });
      return;
    }

    setAnsweredItems((prev) => [...prev, result]);
    setSessionStats((prev) => {
      const nc = prev.correct + (result.isCorrect ? 1 : 0);
      const ni = prev.incorrect + (result.isCorrect ? 0 : 1);
      const nt = prev.totalAttempts + 1;
      return {
        correct: nc,
        incorrect: ni,
        totalAttempts: nt,
        accuracy: nt > 0 ? Math.round((nc / nt) * 100) : 0,
      };
    });
  };

  const levelLabels = {
    5: 'Beginner',
    4: 'Elementary',
    3: 'Intermediate',
    2: 'Upper Intermediate',
    1: 'Advanced',
  };
  const title = `JLPT N${level} Japanese Conjugation Practice - Free ${levelLabels[level]} Verb Drills | ReBabel`;
  const description = `Free JLPT N${level} Japanese conjugation practice with ${levelStats.verbs} verbs, ${levelStats.iAdj} i-adjectives, and ${levelStats.naAdj} na-adjectives. Practice te-form, masu form, negative, past, potential, passive, causative and 19 total verb forms. Instant feedback with romaji-to-kana conversion.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content={`JLPT N${level} conjugation, JLPT N${level} verb practice, Japanese N${level} grammar, te-form practice N${level}, masu form drill, Japanese verb conjugator free, godan ichidan verbs JLPT, ${levelLabels[level]} Japanese practice`}
        />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1"
        />
        <link
          rel="canonical"
          href={`https://www.rebabel.org/japanese-conjugation-practice/${levelKey}`}
        />
        <meta name="author" content="ReBabel" />
        <meta name="theme-color" content="#e30a5f" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:url"
          content={`https://www.rebabel.org/japanese-conjugation-practice/${levelKey}`}
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta
          property="og:image"
          content={`https://www.rebabel.org/og-conjugation-${levelKey}.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={`https://www.rebabel.org/og-conjugation-${levelKey}.png`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LearningResource',
              name: title,
              description,
              url: `https://www.rebabel.org/japanese-conjugation-practice/${levelKey}`,
              provider: {
                '@type': 'Organization',
                name: 'ReBabel',
                url: 'https://www.rebabel.org',
                logo: 'https://www.rebabel.org/ReBabelIcon.png',
              },
              educationalLevel: `JLPT N${level}`,
              inLanguage: 'ja',
              isAccessibleForFree: true,
              learningResourceType: 'Practice exercise',
              interactivityType: 'active',
              numberOfItems: levelStats.total,
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
                href="/japanese-conjugation-practice"
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                All Levels
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

      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-page dark:to-surface-card pt-8 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
          {phase === 'config' && (
            <>
              <div className="mb-6">
                <Link
                  href="/japanese-conjugation-practice"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-pink transition-colors"
                >
                  &larr; All Levels
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  JLPT N{level} Conjugation Practice
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Select the conjugation forms you want to practice, then begin.
                </p>
              </div>
              <div className="bg-white dark:bg-surface-card rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-4 sm:p-6">
                <PublicConfigPanel
                  levelStats={levelStats}
                  level={level}
                  levelKey={levelKey}
                  onStart={handleStart}
                />
              </div>
              {/* SEO content -- visible text for search engines */}
              <div className="mt-8 prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  About JLPT N{level} Conjugation
                </h2>
                <p>
                  This free tool lets you practice conjugating{' '}
                  {levelStats.total} Japanese words at the JLPT N{level} (
                  {levelLabels[level]}) level, including {levelStats.verbs}{' '}
                  verbs, {levelStats.iAdj} i-adjectives, and {levelStats.naAdj}{' '}
                  na-adjectives. Choose from 19 verb conjugation forms and 6
                  adjective forms, type your answers in romaji, and get instant
                  feedback as your input is automatically converted to hiragana.
                </p>
                <p>
                  All vocabulary is sourced from official JLPT N{level} word
                  lists and cross-referenced with the JMdict dictionary for
                  accurate part-of-speech classification. Verbs are categorized
                  as godan (Group I), ichidan (Group II), or irregular
                  (する/くる), ensuring correct conjugation rules are applied
                  automatically.
                </p>
              </div>

              <div className="text-center space-y-2 mt-6">
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
                    EDRDG
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
                  . JLPT vocabulary lists by{' '}
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
            </>
          )}

          {phase === 'loading' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink mx-auto" />
                <p className="mt-4 text-sm text-black/60 dark:text-white/60">
                  Generating questions...
                </p>
              </div>
            </div>
          )}

          {phase === 'session' && (
            <>
              <PublicSessionHeader
                level={level}
                sessionStats={sessionStats}
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                onExit={() => setPhase('config')}
              />
              <PublicConjugationCard
                questions={questions}
                currentIndex={currentIndex}
                onAnswerSubmitted={handleAnswerSubmitted}
                onNext={() => setCurrentIndex((i) => i + 1)}
                onComplete={() => {
                  setPhase('summary');
                  setTimeout(() => setAnimateAccuracy(true), 300);
                }}
              />
            </>
          )}

          {phase === 'summary' && (
            <PublicSummaryView
              sessionStats={sessionStats}
              answeredItems={answeredItems}
              animateAccuracy={animateAccuracy}
              onPracticeAgain={() => setPhase('config')}
              level={level}
            />
          )}
        </div>
      </main>
    </>
  );
}
