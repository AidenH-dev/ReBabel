import Head from 'next/head';
import Image from 'next/image';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainSidebar from '@/components/Sidebars/MainSidebar';
import PageHeader from '@/components/ui/PageHeader';
import SRSGuideContent from '@/components/SRS/srs-guide-content';
import {
  TbExternalLink,
  TbSearch,
  TbCertificate,
  TbArrowRight,
  TbArrowLeft,
  TbNews,
  TbBooks,
  TbRepeat,
} from 'react-icons/tb';

export default function Resources() {
  const router = useRouter();
  const [view, setView] = useState('resources');

  useEffect(() => {
    if (router.query.guide === 'srs') {
      setView('srs-guide');
    }
  }, [router.query.guide]);

  useEffect(() => {
    const query = view === 'srs-guide' ? '?guide=srs' : '';
    const path = router.pathname + query;
    if (router.asPath !== path) {
      router.replace(path, undefined, { shallow: true });
    }
  }, [view]);

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
          transformOrigin: '0 0',
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

  const NHKPreviewWindow = ({ height = 750 }) => {
    const IMAGE_SRC = '/nhk_preview_standin.jpg';

    return (
      <section className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1d2a32] overflow-hidden h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <TbNews className="w-4 h-4 text-black/40 dark:text-white/40" />
            <span className="text-sm text-black/70 dark:text-white/70 font-medium">
              NHK Easy News
            </span>
          </div>
          <a
            href="https://news.web.nhk.or.jp/news/easy/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#e30a5f] hover:underline font-medium"
          >
            Open <TbExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div
          className="relative w-full overflow-hidden"
          style={{ height: height }}
        >
          <Image
            src={IMAGE_SRC}
            alt="NHK Easy News Stand-in Preview"
            width={800}
            height={height}
            className="object-cover w-full h-full"
            priority={true}
          />
        </div>
      </section>
    );
  };

  const ExternalTile = ({
    name,
    icon,
    href,
    previewSrc,
    zoom = 0.75,
    height = 360,
  }) => (
    <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1d2a32] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-black/70 dark:text-white/70">
            {name}
          </span>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[#e30a5f] inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          Visit <TbExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      {previewSrc ? (
        <ScaledFrame src={previewSrc} zoom={zoom} height={height} />
      ) : (
        <div className="h-64 w-full flex items-center justify-center text-sm text-black/40 dark:text-white/40 bg-white dark:bg-[#0f171b]">
          Preview unavailable
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />
      <main className="ml-auto max-h-screen flex-1 flex flex-col overflow-hidden">
        <Head>
          <title>
            {view === 'srs-guide'
              ? 'SRS Guide - Resources - ReBabel'
              : 'Resources - ReBabel'}
          </title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="sticky top-0 z-10">
          <PageHeader
            title={
              view === 'srs-guide'
                ? 'ReBabel Spaced Repetition Guide'
                : 'Resources'
            }
            {...(view === 'srs-guide' && {
              onBack: () => setView('resources'),
              backLabel: 'Resources',
            })}
          />
        </div>

        {view === 'resources' && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-[max(1.5rem,var(--cap-safe-top))] lg:pt-6 pb-12">
            <div className="max-w-6xl mx-auto">
              {/* Mobile header */}
              <div className="lg:hidden mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Resources
                </h1>
                <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                  Learn how our platform works and explore recommended tools.
                </p>
              </div>

              {/* SECTION 1: STUDY GUIDES */}
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-3">
                  Study Guides
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    onClick={() => setView('srs-guide')}
                    className="group text-left flex items-start gap-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1d2a32] p-4 hover:shadow-sm hover:-translate-y-px transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <TbRepeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                        How SRS Works and How to Use It
                      </h3>
                      <p className="text-xs text-black/50 dark:text-white/50 mt-1 line-clamp-2">
                        Learn what spaced repetition is and how to get started
                        with SRS on ReBabel.
                      </p>
                    </div>
                    <TbArrowRight className="text-black/20 dark:text-white/20 group-hover:text-[#e30a5f] transition mt-1 shrink-0" />
                  </button>
                </div>
              </section>

              {/* SECTION 2: RECOMMENDED OUTSIDE RESOURCES */}
              <section>
                <h2 className="text-sm font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-3">
                  Recommended Outside Resources
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <NHKPreviewWindow height={400} />
                  </div>
                  <div className="md:col-span-1">
                    <ExternalTile
                      name="Jisho Dictionary"
                      icon={
                        <TbSearch className="w-4 h-4 text-black/40 dark:text-white/40" />
                      }
                      href="https://jisho.org/"
                      previewSrc="https://jisho.org/"
                      height={400}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <ExternalTile
                      name="JLPT Official"
                      icon={
                        <TbCertificate className="w-4 h-4 text-black/40 dark:text-white/40" />
                      }
                      href="https://www.jlpt.jp/e/"
                      previewSrc="https://www.jlpt.jp/e/"
                      height={400}
                    />
                  </div>
                </div>

                {/* How-to helper cards */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1d2a32] p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <TbBooks className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      NHK Easy To Learn
                    </h3>
                    <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed">
                      Skim headlines and choose an interesting topic. NHK Easy
                      is perfect for intermediate learners to engage
                      realistically with the language. Fill in any blanks with
                      Jisho and see if you can successfully translate the
                      article while reading.
                    </p>
                  </div>

                  <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1d2a32] p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <TbSearch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Jisho Quick Tips
                    </h3>
                    <ul className="text-sm text-black/60 dark:text-white/60 space-y-1.5">
                      <li>
                        <span className="font-medium text-black/70 dark:text-white/70">
                          Wildcard:
                        </span>{' '}
                        * for unknown kana
                      </li>
                      <li>
                        <span className="font-medium text-black/70 dark:text-white/70">
                          Kanji pages:
                        </span>{' '}
                        check radicals + stroke order
                      </li>
                      <li>
                        <span className="font-medium text-black/70 dark:text-white/70">
                          Examples:
                        </span>{' '}
                        short, common sentences → better cards
                      </li>
                    </ul>
                    <div className="mt-3">
                      <a
                        href="https://jisho.org/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] text-black/60 dark:text-white/60 text-xs font-medium hover:bg-black/[0.08] dark:hover:bg-white/[0.1] hover:text-[#e30a5f] transition-all"
                      >
                        Open Jisho <TbExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {view === 'srs-guide' && (
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#141f25]">
            {/* Mobile back button */}
            <div className="lg:hidden px-4 pt-[max(1rem,var(--cap-safe-top))] pb-2">
              <button
                onClick={() => setView('resources')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-black/60 dark:text-white/60 hover:text-[#e30a5f] transition"
              >
                <TbArrowLeft className="w-4 h-4" />
                Back to Resources
              </button>
            </div>

            <SRSGuideContent compact />
          </div>
        )}
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
