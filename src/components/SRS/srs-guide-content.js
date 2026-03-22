import Image from 'next/image';
import {
  FaCheckCircle,
  FaClock,
  FaCalendarCheck,
  FaSeedling,
  FaPlus,
  FaTasks,
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
        <span className="inline-flex items-center align-middle whitespace-nowrap rounded-md border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          SRS Dashboard
        </span>
        , use{' '}
        <span className="inline-flex items-center align-middle whitespace-nowrap rounded-md bg-gradient-to-r from-brand-pink to-[#c1084d] px-2 py-0.5 text-sm font-semibold text-white">
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
    image: '/DEMO.gif',
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

/**
 * SRSGuideContent — shared content body for the SRS guide.
 * Used by both /study-guide/what-is-srs (public marketing page)
 * and /learn/academy/resources (in-app guide view).
 *
 * @param {string} [heroTopPadding] - override top padding on the hero section
 */
export default function SRSGuideContent({
  heroTopPadding = 'pt-24 sm:pt-28',
  compact = false,
}) {
  return (
    <>
      {/* Hero */}
      <section
        className={`w-full px-4 sm:px-6 lg:px-8 ${compact ? 'pt-6 sm:pt-8' : heroTopPadding} pb-8 sm:pb-10`}
      >
        {compact ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] sm:gap-10 items-center">
            <div>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-4 sm:mb-8">
                Spaced repetition (SRS) times your reviews so you see each item
                right before you would forget it. You spend less time reviewing
                and remember more of what you study.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/90 dark:bg-surface-card/90 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 shadow-sm">
                <FaClock className="text-brand-pink mb-3" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Review less often
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Easy items get spaced farther apart over time.
                </p>
              </div>
              <div className="bg-white/90 dark:bg-surface-card/90 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 shadow-sm">
                <FaCalendarCheck className="text-brand-pink mb-3" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Catch forgetting early
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Hard items return sooner before they fully disappear.
                </p>
              </div>
              <div className="bg-white/90 dark:bg-surface-card/90 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 shadow-sm">
                <FaSeedling className="text-brand-pink mb-3" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Build long-term retention
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Short daily sessions compound into durable knowledge.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] sm:gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                What is <span className="text-brand-pink">SRS</span>, and why
                its the best tool for memorizing Japanese
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-4 sm:mb-8">
                Spaced repetition (SRS) times your reviews so you see each item
                right before you would forget it. You spend less time reviewing
                and remember more of what you study.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-200/50 dark:from-rose-900/30 via-white dark:via-transparent to-blue-100/50 dark:to-blue-900/20 rounded-[2rem] blur-3xl" />
              <div className="relative bg-white/90 dark:bg-surface-card/90 border border-white dark:border-white/10 rounded-[2rem] shadow-2xl shadow-slate-200/70 dark:shadow-black/30 p-4 md:p-6">
                <div className="sm:grid sm:grid-cols-2 flex w-full gap-4 mb-4">
                  <div className="w-full rounded-2xl bg-[#fff4f7] dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
                      SRS outcome
                    </p>
                    <p className="sm:hidden text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Better more reliable recall
                    </p>
                    <div className="flex">
                      <p className="hidden sm:flex text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Better recall
                      </p>
                      <FaArrowTrendUp className="text-brand-pink text-3xl font-black ml-2 " />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      You review only what matters when it matters. Everything
                      is automated
                    </p>
                  </div>
                  <div className="hidden sm:grid rounded-2xl bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                      For Japanese
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Vocab + grammar
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Japanese demands heavy memorization across writing,
                      vocabulary, and grammar.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
                  <div className="bg-white/90 dark:bg-surface-card/90 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 shadow-sm">
                    <FaClock className="text-brand-pink mb-3" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Review less often
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Easy items get spaced farther apart over time.
                    </p>
                  </div>
                  <div className="hidden sm:grid bg-white/90 dark:bg-surface-card/90 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 shadow-sm">
                    <FaCalendarCheck className="text-brand-pink mb-3" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Catch forgetting early
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Hard items return sooner before they fully disappear.
                    </p>
                  </div>
                  <div className="bg-white/90 dark:bg-surface-card/90 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 shadow-sm">
                    <FaSeedling className="text-brand-pink mb-3" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Build long-term retention
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Short daily sessions compound into durable knowledge.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-14">
        <div className="max-w-[68rem] mx-auto rounded-[1.45rem] bg-slate-950 dark:bg-surface-deep text-white p-5 md:p-6 shadow-2xl shadow-slate-300/25 dark:shadow-black/30">
          <div className="max-w-[46rem] mb-6">
            <p className="text-sm uppercase tracking-[0.24em] text-rose-200 mb-3">
              How it works
            </p>
            <h2 className="text-xl md:text-[1.7rem] font-bold mb-3">
              SRS is built around timing, automating reviews for how your brain
              naturally remembers things.
            </h2>
            <p className="max-w-[36rem] text-slate-300 text-sm md:text-base leading-relaxed">
              Instead of reviewing every card every day, an SRS scheduler tries
              to show each item at the point where recall is effortful but still
              possible. That effort is what helps memory stick and how long term
              memory consolidation works.
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
                    <div className="absolute -left-6 top-4 flex h-4 w-4 items-center justify-center rounded-full border border-rose-200 bg-slate-950 dark:bg-surface-deep shadow-[0_0_0_4px_rgba(15,23,42,1)]">
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

      {/* Anki vs ReBabel */}
      {!compact && (
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-card rounded-[2rem] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
                Anki and SRS
              </p>
              <h2 className="flex items-center gap-4 text-2xl font-bold text-slate-900 dark:text-white mb-4">
                <div className="flex-shrink-0">
                  <Image
                    src="/AnkiApp.jpeg"
                    alt="Anki app interface"
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-2xl object-cover border border-rose-100 dark:border-rose-900/50"
                  />
                </div>
                <div className="leading-tight">
                  How apps like Anki use spaced repetition
                </div>
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Anki is popular because it gives learners a flexible flashcard
                system with a scheduler underneath. The core idea is simple:
                your feedback after each card changes when you see it again.
              </p>
              <div className="space-y-4">
                {ankiSteps.map((step) => (
                  <div key={step} className="flex items-start gap-3">
                    <FaCheckCircle className="text-brand-pink mt-1 flex-shrink-0" />
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f5e1e9] dark:from-[#2a1f25] via-white dark:via-surface-card to-sky-50 dark:to-[#1a2530] rounded-[2rem] border border-rose-100 dark:border-white/10 p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
                ReBabel AND SRS
              </p>
              <h2 className="flex items-center gap-4 text-2xl font-bold text-slate-900 dark:text-white mb-4">
                <div className="flex-shrink-0">
                  <Image
                    src="/ReBabelLogo.png"
                    alt="ReBabel Logo"
                    width={56}
                    height={56}
                    quality={100}
                    className="w-14 h-14 rounded-2xl object-cover border border-rose-100 dark:border-rose-900/50"
                  />
                </div>
                <div className="leading-tight hidden sm:grid">
                  How ReBabel uses spaced repetition better
                </div>
                <div className="leading-tight sm:hidden">
                  How ReBabel does it better
                </div>
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                ReBabel takes the proven idea of spaced repition and integrates
                it with better item introduction tools and a full study
                ecosystem.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-rose-100 dark:border-white/10 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-brand-pink mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">
                      Definitive Feedback
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Leveling is fully automated, no need to guess at how hard an
                    item felt to remember.
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-rose-100 dark:border-white/10 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-brand-pink mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">
                      Study Beyond SRS
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Items you add are not limited to SRS, they are accessible to
                    every feature on the platform.
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-rose-100 dark:border-white/10 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-brand-pink mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">
                      New Words Study Faster
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    New words are gradually introduced through custom stages
                    that help memory.
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-rose-100 dark:border-white/10 p-4">
                  <div className="flex">
                    <FaCheckCircle className="text-brand-pink mt-1 flex-shrink-0 mr-1" />
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">
                      Forget Flashcards
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Reviews require typed responses that help engage the learner
                    and improve retention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How to use SRS on ReBabel */}
      <section
        id="how-to-use-srs-on-rebabel"
        className="w-full px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-24"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
              Using it on ReBabel
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How to use SRS on our platform
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              ReBabel follows the same memory principles as dedicated flashcard
              tools, but with more automated study flows and a more polished,
              comfortable practice experience.
            </p>
          </div>

          <div className="space-y-12">
            {rebabelSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-pink-dark dark:text-rose-300 bg-[#fff1f6] dark:bg-rose-950/40 px-3 py-1 rounded-full mb-4">
                    Step 0{index + 1}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {step.description}
                  </p>
                  <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <FaTasks className="text-brand-pink mt-1 flex-shrink-0" />
                    <p>{step.tip}</p>
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="rounded-[2rem] bg-surface-card border border-slate-200 dark:border-white/10 p-4 shadow-sm">
                    {step.image.endsWith('.gif') ? (
                      <img
                        src={step.image}
                        alt={step.alt}
                        className="w-full rounded-[1.5rem] border border-slate-100 dark:border-white/10"
                      />
                    ) : (
                      <Image
                        src={step.image}
                        alt={step.alt}
                        width={1200}
                        height={900}
                        className="w-full rounded-[1.5rem] border border-slate-100 dark:border-white/10"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best practices + What to expect */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="bg-slate-900 dark:bg-surface-deep text-white rounded-[2rem] p-8 md:p-10">
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

          <div className="bg-surface-card rounded-[2rem] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
              Good to know
            </p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-5">
              What to expect when starting
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                SRS usually feels more active at the beginning because new items
                return sooner. As recall improves, the gaps between reviews get
                longer and the workload becomes easier to manage.
              </p>
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <FaAngleRight className="text-rose-400 mt-[0.2rem] h-3.5 w-3.5 flex-shrink-0" />
                    <span>New items come back sooner than mature ones.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaAngleRight className="text-rose-400 mt-[0.2rem] h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Reviews feel more frequent at first, then spread out over
                      time.
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
                      Short daily sessions work better than occasional catch-up
                      marathons.
                    </span>
                  </li>
                </ul>
              </div>
              <p>
                If the system feels repetitive at first, that usually means it
                is doing its job: helping weak memories stick before they fade.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
