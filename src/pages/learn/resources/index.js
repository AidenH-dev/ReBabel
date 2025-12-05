import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState, useMemo } from "react";
import MainSidebar from "../../../components/Sidebars/MainSidebar";
import {
  TbExternalLink,
  TbX,
  TbSearch,
  TbCertificate,
  TbClock,
  TbSparkles,
  TbListDetails,
  TbArrowRight,
  TbNews,
  TbBooks,
} from "react-icons/tb";

/**
 * Resources Dashboard (JS)
 * - Single scrollable page
 * - Section 1: About Our Platform (SRS & JLPT widgets with modal popups)
 * - Section 2: Recommended Outside Resources (NHK tall preview on the left; Jisho + JLPT landscape tiles stacked on the right)
 * - NHK Easy window preview (iframe) without traffic-light dots
 * - Colorful logos for outside resources — place files in /public/logos/* (see paths below)
 */
export default function Information() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);

  const openArticle = (article) => {
    setActiveArticle(article);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setActiveArticle(null);
  };

  // In-app article widgets (About section)
  const articles = useMemo(
    () => ({
      srs_basics: {
        id: "srs_basics",
        title: "Spaced Repetition (SRS): The 5‑minute Primer",
        badge: "Study Method",
        content: (
          <div className="space-y-4">
            <p>
              Spaced Repetition schedules reviews right before you would forget,
              strengthening memory with minimal time. A practical starter
              schedule:{" "}
              <span className="font-medium">10m → 1d → 3d → 1w → 1m → 3m</span>.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="font-medium">Keep cards tiny:</span> one idea
                per card (word meaning, example cloze, or single grammar cue).
              </li>
              <li>
                <span className="font-medium">Mix skills:</span> vocab (60%),
                grammar (25%), kanji (15%) to start; adjust by weaknesses.
              </li>
              <li>
                <span className="font-medium">Daily cadence:</span> 10–20 new
                cards is sustainable while keeping accuracy ≥ 85%.
              </li>
            </ul>
          </div>
        ),
        cta: { label: "Build SRS Decks", href: "/learn/academy/sets" },
      },
      why_tracks: {
        id: "why_tracks",
        title: "Why Academy vs Certificate Tracks",
        badge: "Program Structure",
        content: (
          <div className="space-y-4">
            <p>
              The <span className="font-medium">Academy</span> is flexible,
              material‑driven learning (your textbooks, classes, and custom
              units). The
              <span className="font-medium"> Certificate</span> track aligns
              study to standardized goals (JLPT N5–N1) for test‑day performance.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="font-medium">Academy:</span> upload materials,
                generate drills, track section progress.
              </li>
              <li>
                <span className="font-medium">Certificate:</span> level‑tagged
                decks, mock tests, milestone dates (July/Dec).
              </li>
              <li>
                <span className="font-medium">Together:</span> Academy builds
                breadth; Certificate turns it into exam‑ready skills.
              </li>
            </ul>
          </div>
        ),
        cta: { label: "Explore Tracks", href: "/learn/jlpt" },
      },
      jlpt_overview: {
        id: "jlpt_overview",
        title: "JLPT Overview (N5 → N1)",
        badge: "Certification",
        content: (
          <div className="space-y-4">
            <p>
              JLPT measures{" "}
              <span className="font-medium">reading and listening</span>. Use
              level‑tagged SRS decks and graded reading to progress.
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Pick your test window and backplan 12–16 weeks.</li>
              <li>Seed level‑specific vocab/grammar/kanji decks (N‑tags).</li>
              <li>Checkpoint with short mocks weekly; full mocks monthly.</li>
            </ol>
          </div>
        ),
        cta: { label: "Open JLPT Tracks", href: "/learn/jlpt" },
      },
    }),
    []
  );

  const WidgetCard = ({ icon, title, subtitle, onOpen, badge, gradient }) => (
    <button
      onClick={onOpen}
      className="group text-left bg-white dark:bg-[#1c2b35] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition overflow-hidden"
    >
      <div
        className={`h-1 ${
          gradient || "bg-gradient-to-r from-gray-200 to-gray-300"
        }`}
      />
      <div className="p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {badge && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {badge}
              </span>
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {subtitle}
          </p>
        </div>
        <TbArrowRight className="text-gray-400 group-hover:text-[#e30a5f] transition" />
      </div>
    </button>
  );

  const Modal = ({ open, onClose, article }) => {
    if (!open || !article) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c2b35] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              {article.title}
            </h4>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <TbX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="p-5">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {article.content}
            </div>
            {article.cta && (
              <div className="mt-5 flex gap-3">
                <Link
                  href={article.cta.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white hover:shadow-lg transition"
                >
                  {article.cta.label}
                  <TbArrowRight />
                </Link>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // NHK window WITHOUT traffic‑light dots (tall/portrait)
  const ScaledFrame = ({ src, zoom = 0.8, height = 640 }) => (
    <div
      className="relative w-full overflow-hidden bg-white dark:bg-[#0f171b]"
      style={{ height }}
    >
      <div
        className="w-full h-full"
        style={{
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <iframe
          src={src}
          className="w-full h-full block"
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  );

  // NHK window WITHOUT traffic‑light dots (tall/portrait)
  // NHK window WITHOUT traffic‑light dots (tall/portrait)
  // MODIFIED to accept and use the height prop
  const NHKPreviewWindow = ({ height = 750 }) => {
    const IMAGE_SRC = "/nhk_preview_standin.jpg";
    // HEIGHT is now received via props, defaulting to 720

    return (
      <section className="bg-white dark:bg-[#1c2b35] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              NHK Easy Live Preview
            </span>
          </div>
          <a
            href="https://news.web.nhk/news/easy/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#e30a5f] hover:underline"
          >
            Open <TbExternalLink />
          </a>
        </div>
        {/* Image Stand-in uses the received height prop */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: height }}
        >
          <Image
            src={IMAGE_SRC}
            alt="NHK Easy News Stand-in Preview"
            width={800}
            height={height} // Use the prop here
            className="object-cover w-full h-full"
            priority={true}
          />
        </div>
      </section>
    );
  };

  // Landscape/shorter tiles for right side
  const ExternalTile = ({
    name,
    logoSrc,
    href,
    previewSrc,
    accent,
    zoom = 0.75,
    height = 360,
  }) => (
    <div className="bg-white dark:bg-[#1c2b35] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {name}
          </span>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[#e30a5f] inline-flex items-center gap-1 text-sm hover:opacity-80"
        >
          Visit <TbExternalLink />
        </a>
      </div>
      {previewSrc ? (
        <ScaledFrame src={previewSrc} zoom={zoom} height={height} />
      ) : (
        <div className="h-64 w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-[#0f171b]">
          Preview unavailable
        </div>
      )}
    </div>
  );

  const Header = () => (
    <div className="mb-6">
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Information
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Learn how our platform works, then explore recommended outside
              tools below.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />
      <main className="ml-auto max-h-screen overflow-y-auto flex-1 px-8 py-6">
        <Head>
          <title>Resources • ReBabel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header />

        {/* SECTION 1: ABOUT OUR PLATFORM 
                <section aria-labelledby="about-heading" className="mb-8">
                    <h2 id="about-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About Our Platform</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30">
                                    <TbBooks className="text-rose-500" />
                                </span>
                                SRS (Spaced Repetition)
                            </h3>
                            <WidgetCard
                                icon={<TbClock className="text-rose-500" />}
                                title="SRS: Why timing wins"
                                subtitle="Learn the logic behind intervals and how to keep daily study lightweight."
                                badge="Study Method"
                                gradient="bg-gradient-to-r from-[#e30a5f] to-[#f41567]"
                                onOpen={() => openArticle(articles.srs_basics)}
                            />
                            <WidgetCard
                                icon={<TbSparkles className="text-rose-500" />}
                                title="Designing great cards"
                                subtitle="Minimal prompts, sentence cloze, audio + pitch — examples included."
                                badge="SRS"
                                gradient="bg-gradient-to-r from-[#f41567] to-[#e30a5f]"
                                onOpen={() => openArticle({
                                    title: "Designing great SRS cards",
                                    content: (
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>One fact per card; avoid paragraphs.</li>
                                            <li>Prefer sentences for grammar/usage; bold the target token.</li>
                                            <li>Add audio and pitch pattern where possible.</li>
                                        </ul>
                                    ),
                                    cta: { label: "Build Decks", href: "/learn/academy/sets" },
                                })}
                            />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                    <TbCertificate className="text-indigo-600" />
                                </span>
                                JLPT (Certification)
                            </h3>
                            <WidgetCard
                                icon={<TbCertificate className="text-indigo-600" />}
                                title="Why Academy vs Certificate"
                                subtitle="How free‑form study and exam‑aligned tracks work together."
                                badge="Program Structure"
                                gradient="bg-gradient-to-r from-indigo-500 to-blue-600"
                                onOpen={() => openArticle(articles.why_tracks)}
                            />
                            <WidgetCard
                                icon={<TbListDetails className="text-indigo-600" />}
                                title="JLPT Overview (N5 → N1)"
                                subtitle="Milestones, deck tagging, mocks, and a 12–16 week backplan."
                                badge="Certification"
                                gradient="bg-gradient-to-r from-blue-600 to-indigo-500"
                                onOpen={() => openArticle(articles.jlpt_overview)}
                            />
                        </div>
                    </div>

                    <Modal open={modalOpen} onClose={closeModal} article={activeArticle} />
                </section>*/}

        {/* SECTION 2: RECOMMENDED OUTSIDE RESOURCES */}
        <section aria-labelledby="external-heading" className="mt-2">
          <h2
            id="external-heading"
            className="text-lg font-semibold text-gray-900 dark:text-white mb-3"
          >
            Recommended Outside Resources
          </h2>

          {/* NEW LAYOUT: Three equal columns side-by-side (1/3 width each) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. NHK Easy To Learn News (1/3 width) */}
            <div className="md:col-span-1">
              <NHKPreviewWindow height={400} />
            </div>

            {/* 2. Jisho Japanese Dictionary (1/3 width) */}
            <div className="md:col-span-1">
              <ExternalTile
                name="Jisho Japanese Dictionary"
                logoSrc="/logos/jisho.png"
                href="https://jisho.org/"
                previewSrc="https://jisho.org/"
                accent="linear-gradient(90deg, #e0e7ff, #dbeafe)"
                height={400}
              />
            </div>

            {/* 3. JLPT — Official Information (1/3 width) */}
            <div className="md:col-span-1">
              <ExternalTile
                name="JLPT — Official Information"
                logoSrc="/logos/jlpt.png"
                href="https://www.jlpt.jp/e/"
                previewSrc="https://www.jlpt.jp/e/"
                accent="linear-gradient(90deg, #fee2e2, #ffe4e6)"
                height={400}
              />
            </div>
          </div>

          {/* How-to helpers under the tiles (Unchanged) */}
          <div
            id="nhk-how"
            className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-[#1c2b35] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <TbBooks /> NHK Easy To Learn
              </h3>
              <p className="dark:text-white">
                Skim headlines; choose an interesting topic! NKH Easy is perfect
                for intermediate to engage realistically with the language. Fill
                in any blanks with Jisho and see if you can successfully
                translate the article while reading
              </p>
            </section>

            <section className="bg-white dark:bg-[#1c2b35] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <TbSearch /> Jisho quick tips
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>
                  <span className="font-medium">Wildcard:</span> * for unknown
                  kana (例: *つもり)
                </li>
                <li>
                  <span className="font-medium">Kanji pages:</span> check
                  radicals + stroke order
                </li>
                <li>
                  <span className="font-medium">Examples:</span> short, common
                  sentences → better cards
                </li>
              </ul>
              <div className="mt-3">
                <a
                  href="https://jisho.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Open Jisho <TbExternalLink />
                </a>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
