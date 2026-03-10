import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaArrowRight,
  FaBrain,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaTasks,
  FaSeedling,
  FaSyncAlt,
} from 'react-icons/fa';
import { FaAngleRight, FaArrowTrendUp } from 'react-icons/fa6';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { LuRepeat } from 'react-icons/lu';
import { TbRepeat } from 'react-icons/tb';

const reviewMoments = [
  {
    day: 'Start',
    title: 'Learn and adopt the item',
    description:
      'A new vocabulary or grammar item enters your review cycle after the first learning pass, so ReBabel can start tracking it instead of leaving it as one-off study.',
  },
  {
    day: 'Same day',
    title: 'Get an early check-in',
    description:
      'Your first scheduled return is soon after learning, which helps catch weak recall early before the item fades too far.',
  },
  {
    day: 'Next few reviews',
    title: 'Move up when recall is clean',
    description:
      'When you get through a review without mistakes, the item levels up and the gap grows from about a day to several days and then weeks.',
  },
  {
    day: 'Long term',
    title: 'Keep mature items alive',
    description:
      'As items become stable, reviews spread out toward monthly and multi-month check-ins, while missed items get pulled closer again so they do not drift away.',
  },
];

const ankiSteps = [
  'You create flashcards with a prompt on the front and an answer on the back.',
  'Anki asks you to grade how hard recall felt after every review.',
  'Its scheduler uses that feedback to decide when each card should appear again.',
  'Easy cards wait longer. Hard cards return sooner. Leeches show up more often until they stick.',
];

const rebabelSteps = [
  {
    title: 'Create or choose a study set',
    description:
      'Build a custom set around textbook chapters, weak grammar, or upcoming JLPT material so your reviews stay relevant.',
    image: '/Feature3.png',
    alt: 'ReBabel custom Japanese study sets',
    tip: 'Use this page as the conceptual guide, then jump into your account to build a review habit around the exact material you are already studying.',
  },
  {
    title: 'Study from the SRS control panel',
    description: (
      <>
        From the{' '}
        <span className="inline-flex items-center align-middle whitespace-nowrap rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-700">
          SRS Dashboard
        </span>
        , use{' '}
        <span className="inline-flex items-center align-middle whitespace-nowrap rounded-md bg-gradient-to-r from-[#e30a5f] to-[#c1084d] px-2 py-0.5 text-sm font-semibold text-white">
          <LuRepeat className="mr-1 h-4 w-4 opacity-80" />
          Due Now
        </span>{' '}
        on the left to review ready items, then{' '}
        <span className="inline-flex items-center align-middle whitespace-nowrap rounded-md bg-gradient-to-r from-[#667eea] to-[#764ba2] px-2 py-0.5 text-sm font-semibold text-white">
          <FaPlus className="mr-1 h-3.5 w-3.5 opacity-80" />
          Learn New
        </span>{' '}
        on the right to bring the next batch into your SRS cycle.
      </>
    ),
    image: '/SRS-Step-2.png',
    alt: 'SRS Control Panel',
    tip: (
      <>
        Make sure the set header shows{' '}
        <span className="inline-flex items-center align-middle whitespace-nowrap gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-sm font-semibold">
          <TbRepeat className="h-4 w-4 text-purple-600" />
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SRS Enabled
          </span>
        </span>{' '}
        before you start.
      </>
    ),
  },
  {
    title: 'Stay in a daily practice rhythm',
    description:
      'Open your queue, clear due reviews, and keep sessions short enough to stay consistent. The goal is steady progress, not marathon cramming.',
    video: '/DEMO.mp4',
    alt: 'ReBabel study dashboard and review flow',
    tip: (
      <>
        Use{' '}
        <span className="inline-flex items-center align-middle whitespace-nowrap gap-1 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] px-2.5 py-1 text-sm font-semibold text-white shadow-sm">
          <HiOutlineLightningBolt className="h-3.5 w-3.5 opacity-80" />
          Fast Review
        </span>{' '}
        to review items due across all of your sets in one go.
      </>
    ),
  },
];

const bestPractices = [
  'Review every day, even if it is only 10 to 15 minutes.',
  'Keep new Items manageable (~10 max) so your due count does not explode later.',
  'Use the mobile app to get notifications for when items are due!',
  'Use other features like quiz or flashcards to review words that cause repeated trouble.',
];

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
          content="https://www.rebabel.org/og-image.png"
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
          content="https://www.rebabel.org/og-image.png"
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

      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-rose-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#e30a5f]">ReBabel</span>
              <span className="text-xs bg-[#fff1f6] text-[#b0104f] px-2 py-1 rounded-full border border-rose-200">
                Study Guide
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/blog"
                className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
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

      <main className="bg-[radial-gradient(circle_at_top_left,_rgba(227,11,92,0.12),_transparent_32%),linear-gradient(to_bottom,_#fffafc,_#f8fafc_55%,_#ffffff)] pt-16 overflow-hidden">
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8 sm:pb-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] sm:gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                What is <span className="text-[#e30a5f]">SRS</span>, and why its
                the best tool for memorizing Japanese
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed mb-4 sm:mb-8">
                SRS stands for spaced repetition system. It is a study method
                that shows you Japanese study items again right before you are
                likely to forget them, so you remember more while wasting less
                time.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-200/50 via-white to-blue-100/50 rounded-[2rem] blur-3xl" />
              <div className="relative bg-white/90 border border-white rounded-[2rem] shadow-2xl shadow-slate-200/70 p-4 md:p-6">
                <div className="sm:grid sm:grid-cols-2 flex w-full gap-4 mb-4">
                  <div className=" w-full rounded-2xl bg-[#fff4f7] border border-rose-200 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1 sm:mb-2">
                      SRS outcome
                    </p>
                    <p className="sm:hidden text-2xl font-bold text-slate-900 mb-2">
                      Better more reliable recall
                    </p>
                    <div className="flex">
                      <p className="hidden sm:flex text-2xl font-bold text-slate-900 mb-2">
                        Better recall
                      </p>
                      <FaArrowTrendUp className="text-[#e30a5f] text-3xl font-black ml-2 " />
                    </div>
                    <p className="text-sm text-slate-600">
                      You review only what matters when it matters. Everything
                      is automated
                    </p>
                  </div>
                  <div className="hidden sm:grid rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
                      For Japanese
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-2">
                      Vocab + grammar
                    </p>
                    <p className="text-sm text-slate-600">
                      Japanese demands heavy memorization across writing,
                      vocabulary, and grammar.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
                  <div className="bg-white/90 border border-rose-100 rounded-2xl p-4 shadow-sm">
                    <FaClock className="text-[#e30a5f] mb-3" />
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Review less often
                    </p>
                    <p className="text-sm text-slate-600">
                      Easy items get spaced farther apart over time.
                    </p>
                  </div>
                  <div className="hidden sm:grid bg-white/90 border border-rose-100 rounded-2xl p-4 shadow-sm">
                    <FaCalendarCheck className="text-[#e30a5f] mb-3" />
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Catch forgetting early
                    </p>
                    <p className="text-sm text-slate-600">
                      Hard items return sooner before they fully disappear.
                    </p>
                  </div>
                  <div className="bg-white/90 border border-rose-100 rounded-2xl p-4 shadow-sm">
                    <FaSeedling className="text-[#e30a5f] mb-3" />
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Build long-term retention
                    </p>
                    <p className="text-sm text-slate-600">
                      Short daily sessions compound into durable knowledge.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-14">
          <div className="max-w-[68rem] mx-auto rounded-[1.45rem] bg-slate-950 text-white p-5 md:p-6 shadow-2xl shadow-slate-300/25">
            <div className="max-w-[46rem] mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-rose-200 mb-3">
                How it works
              </p>
              <h2 className="text-xl md:text-[1.7rem] font-bold mb-3">
                SRS is built around timing, automating reviews for how your
                brain naturally remembers things.
              </h2>
              <p className="max-w-[36rem] text-slate-300 text-sm md:text-base leading-relaxed">
                Instead of reviewing every card every day, an SRS scheduler
                tries to show each item at the point where recall is effortful
                but still possible. That effort is what helps memory stick and
                how long term memory consolidation works.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-5 items-center">
              <div className="bg-white/5 rounded-[1.2rem] border border-white/10 p-3">
                <Image
                  src="/blog/images/srsMemoryCurve.png"
                  alt="Spaced repetition memory curve illustration"
                  width={1200}
                  height={900}
                  className="w-full rounded-[0.9rem] border border-white/10"
                />
              </div>
              <div className="relative pl-8">
                <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-rose-300/70 via-rose-200/40 to-white/10" />
                <div className="space-y-2.5">
                  {reviewMoments.map((moment) => (
                    <div
                      key={moment.day}
                      className="relative rounded-[1rem] bg-white/5 border border-white/10 p-3.5"
                    >
                      <div className="absolute -left-6 top-4 flex h-4 w-4 items-center justify-center rounded-full border border-rose-200 bg-slate-950 shadow-[0_0_0_4px_rgba(15,23,42,1)]">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                      </div>
                      <p className="text-sm font-semibold text-rose-200 mb-1">
                        {moment.day}
                      </p>
                      <h3 className="text-base md:text-lg font-semibold mb-1.5">
                        {moment.title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {moment.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-3">
                Anki and SRS
              </p>
              <h2 className="flex items-center gap-4 text-2xl font-bold text-slate-900 mb-4">
                <div className="flex-shrink-0">
                  <Image
                    src="/AnkiApp.jpeg"
                    alt="Anki app interface"
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-2xl object-cover border border-rose-100"
                  />
                </div>
                <div className="leading-tight">
                  How apps like Anki use spaced repetition
                </div>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Anki is popular because it gives learners a flexible flashcard
                system with a scheduler underneath. The core idea is simple:
                your feedback after each card changes when you see it again.
              </p>
              <div className="space-y-4">
                {ankiSteps.map((step) => (
                  <div key={step} className="flex items-start gap-3">
                    <FaCheckCircle className="text-[#e30a5f] mt-1 flex-shrink-0" />
                    <p className="text-slate-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f5e1e9] via-white to-sky-50 rounded-[2rem] border border-rose-100 p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-3">
                ReBabel AND SRS
              </p>
              <h2 className="flex items-center gap-4 text-2xl font-bold text-slate-900 mb-4">
                <div className="flex-shrink-0">
                  <Image
                    src="/ReBabelLogo.png"
                    alt="ReBabel Logo"
                    width={56}
                    height={56}
                    quality={100}
                    className="w-14 h-14 rounded-2xl object-cover border border-rose-100"
                  />
                </div>
                <div className="leading-tight hidden sm:grid">
                  How ReBabel uses spaced repetition better
                </div>
                <div className="leading-tight sm:hidden">
                  How ReBabel does it better
                </div>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                ReBabel takes the proven idea of spaced repition and integrates
                it with better item introduction tools and a full study
                ecosystem.
              </p>
              {/**ReBabel takes the proven idea of spaced repition and adds more
                engaging multiple choice and translation features instead of
                flashcards. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gray-50 border border-rose-100 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-[#e30a5f] mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 mb-2">
                      Definitive Feedback
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    Leveling is fully automated, no need to guess at how hard an
                    item felt to remember.
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-rose-100 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-[#e30a5f] mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 mb-2">
                      Study Beyond SRS
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    Items you add are not limited to SRS, they are accessible to
                    every feature on the platform.
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-rose-100 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-[#e30a5f] mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 mb-2">
                      New Words Study Faster
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    New words are gradually introduced through custom stages
                    that help memory.
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-rose-100 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-[#e30a5f] mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 mb-2">
                      Forget Flashcards
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    Reviews require typed responses that help engage the learner
                    and improve retention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="how-to-use-srs-on-rebabel"
          className="w-full px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-24"
        >
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mb-12">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-3">
                Using it on ReBabel
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                How to use SRS on our platform
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                ReBabel follows the same memory principles as dedicated
                flashcard tools, but with more automated study flows and a more
                polished, comfortable practice experience.
              </p>
            </div>

            <div className="space-y-12">
              {rebabelSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#b0104f] bg-[#fff1f6] px-3 py-1 rounded-full mb-4">
                      Step 0{index + 1}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                      {step.description}
                    </p>
                    <div className="flex items-start gap-3 text-slate-700">
                      <FaTasks className="text-[#e30a5f] mt-1 flex-shrink-0" />
                      <p>{step.tip}</p>
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="rounded-[2rem] bg-white border border-slate-200 p-4 shadow-sm">
                      {step.video ? (
                        <video
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full rounded-[1.5rem] border border-slate-100"
                          aria-label={step.alt}
                        >
                          <source src={step.video} type="video/mp4" />
                        </video>
                      ) : (
                        <Image
                          src={step.image}
                          alt={step.alt}
                          width={1200}
                          height={900}
                          className="w-full rounded-[1.5rem] border border-slate-100"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 md:p-10">
              <p className="text-sm uppercase tracking-[0.2em] text-rose-200 mb-3">
                Best practices
              </p>
              <h2 className="text-3xl font-bold mb-6">
                How to get the most out of SRS
              </h2>
              <div className="grid gap-4">
                {bestPractices.map((practice) => (
                  <div
                    key={practice}
                    className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4"
                  >
                    <FaCheckCircle className="text-rose-300 mt-1 flex-shrink-0" />
                    <p className="text-slate-200">{practice}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-3">
                Good to know
              </p>
              <h2 className="text-3xl font-bold text-slate-900 mb-5">
                What to expect when starting
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  SRS usually feels more active at the beginning because new
                  items return sooner. As recall improves, the gaps between
                  reviews get longer and the workload becomes easier to manage.
                </p>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <FaAngleRight className="text-rose-400 mt-[0.2rem] h-3.5 w-3.5 flex-shrink-0" />
                      <span>New items come back sooner than mature ones.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaAngleRight className="text-rose-400 mt-[0.2rem] h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        Reviews feel more frequent at first, then spread out
                        over time.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaAngleRight className="text-rose-400 mt-[0.2rem] h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        Missing an item does not break the system - it simply
                        comes back sooner.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaAngleRight className="text-rose-400 mt-[0.2rem] h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        Short daily sessions work better than occasional
                        catch-up marathons.
                      </span>
                    </li>
                  </ul>
                </div>
                <p>
                  If the system feels repetitive at first, that usually means it
                  is doing its job: helping weak memories stick before they
                  fade.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-5xl mx-auto rounded-[2.25rem] bg-gradient-to-r from-[#e30a5f] to-[#f54b8b] text-white p-8 md:p-12 shadow-2xl shadow-rose-200/70">
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
