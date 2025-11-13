import Head from 'next/head';
import Link from 'next/link';
import { getAllResearch, getResearchBySlug, getRelatedResearch } from '@/lib/research/markdown';
import { extractHeadings } from '@/lib/research/extractHeadings';
import ResearchMarkdown from '@/components/research/ResearchMarkdown';
import ResearchCard from '@/components/research/ResearchCard';
import TableOfContents from '@/components/research/TableOfContents';
import { formatDate } from '@/lib/blog/date';
import { FiArrowLeft, FiCopy, FiExternalLink } from 'react-icons/fi';
import { useState } from 'react';

export async function getStaticPaths() {
  const research = getAllResearch();

  return {
    paths: research.map((article) => ({
      params: {
        slug: article.slug,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const article = getResearchBySlug(params.slug);
  const relatedResearch = getRelatedResearch(params.slug);

  return {
    props: {
      article,
      relatedResearch,
    },
    revalidate: 3600, // Revalidate every hour
  };
}

export default function ResearchArticle({ article, relatedResearch }) {
  const { slug, content, frontmatter } = article;
  const { title, abstract, date, authors, journal, doi, citation } = frontmatter;
  const [copied, setCopied] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const headings = extractHeadings(content);

  const fullUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citation || `${authors}. (${new Date(date).getFullYear()}). ${title}. ${journal}.`);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  return (
    <>
      <Head>
        <title>{title} - ReBabel Research</title>
        <meta name="description" content={abstract} />
        <meta name="keywords" content="research, language learning, linguistics" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={abstract} />
        <meta property="og:url" content={`https://rebabel.org/research/${slug}`} />
        <meta property="og:site_name" content="ReBabel Research" />

        {/* Article-specific meta tags */}
        <meta property="article:published_time" content={date} />
        <meta property="article:modified_time" content={date} />
        {authors && <meta property="article:author" content={Array.isArray(authors) ? authors.join(', ') : authors} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={abstract} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.rebabel.org/research/${slug}`} />

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* JSON-LD Structured Data for ScholarlyArticle */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ScholarlyArticle',
              headline: title,
              abstract: abstract,
              datePublished: date,
              dateModified: date,
              author: Array.isArray(authors) ? authors.map(name => ({ '@type': 'Person', name })) : [{ '@type': 'Person', name: authors }],
              publisher: {
                '@type': 'Organization',
                name: 'ReBabel',
                url: 'https://rebabel.org',
              },
              url: `https://rebabel.org/research/${slug}`,
            })
          }}
        />
      </Head>

      <main className="dark:bg-[#141f25] bg-gray-50 min-h-screen flex flex-col">
        {/* Academic Header Navigation */}
        <div className="dark:bg-gray-900 dark:border-b dark:border-[#e30a5f] bg-white border-b-2 border-[#e30a5f] sticky top-0 z-40 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link
              href="/research"
              className="flex items-center gap-1 dark:text-gray-400 dark:hover:text-[#e30a5f] text-gray-600 hover:text-[#e30a5f] transition-colors font-fredoka font-medium text-sm"
            >
              <FiArrowLeft size={16} />
              Back to Research
            </Link>

            <div className="flex items-center gap-2">
              {doi && (
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 dark:hover:bg-gray-800 hover:bg-gray-100 rounded-md transition-colors text-xs font-mono"
                  title="View on DOI"
                >
                  <FiExternalLink className="dark:text-gray-400 text-gray-600" size={14} />
                  <span className="dark:text-gray-400 text-gray-600">DOI</span>
                </a>
              )}
              <button
                onClick={handleCopyLink}
                className="relative p-1.5 dark:hover:bg-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy link"
              >
                <FiCopy className="dark:text-gray-400 dark:hover:text-[#e30a5f] text-gray-600 hover:text-[#e30a5f]" size={16} />
                {copied && (
                  <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-200 text-xs rounded whitespace-nowrap font-fredoka">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Article Header - Academic Style */}
        <div className="dark:bg-gray-900 bg-white py-8 px-6 border-b dark:border-gray-800 border-gray-200">
          <div className="max-w-3xl mx-auto">
            <h1
              className="text-3xl font-bold dark:text-white text-gray-900 mb-4 leading-tight text-center"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {title}
            </h1>

            {/* Authors */}
            {authors && (
              <p
                className="text-base dark:text-gray-300 text-gray-700 mb-3 text-center"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {Array.isArray(authors) ? authors.join(', ') : authors}
              </p>
            )}

            {/* Journal & Date */}
            <div
              className="text-center mb-4 dark:text-gray-400 text-gray-600 text-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {journal && <span className="italic">{journal}</span>}
              {journal && date && <span className="mx-2">•</span>}
              <span>{formatDate(date)}</span>
            </div>

            {/* DOI and Citation */}
            <div className="flex flex-wrap gap-3 justify-center items-center pt-3 border-t dark:border-gray-700 border-gray-300">
              {doi && (
                <div className="text-xs" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  <span className="dark:text-gray-500 text-gray-600">DOI:</span>{' '}
                  <a
                    href={`https://doi.org/${doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#e30a5f] hover:text-[#ff1f75] font-mono"
                  >
                    {doi}
                  </a>
                </div>
              )}
              <button
                onClick={handleCopyCitation}
                className="relative px-3 py-1.5 text-xs dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-fredoka flex items-center gap-1.5"
                title="Copy citation"
              >
                <FiCopy size={12} />
                Copy Citation
                {copiedCitation && (
                  <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-200 text-xs rounded whitespace-nowrap font-fredoka">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Abstract Section */}
        {abstract && (
          <div className="dark:bg-gray-800 bg-gray-100 py-6 px-6">
            <div className="max-w-3xl mx-auto">
              <h2
                className="text-lg font-bold dark:text-white text-gray-900 mb-3"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Abstract
              </h2>
              <p
                className="text-sm dark:text-gray-300 text-gray-700 leading-relaxed text-justify"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {abstract}
              </p>
            </div>
          </div>
        )}

        {/* Article Body */}
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-8 flex gap-12 items-start justify-center ml-55">
            {/* Main Content - Centered */}
            <div className="max-w-3xl">
              <ResearchMarkdown content={content} />
            </div>
            {/* Table of Contents - Sticky */}
            <TableOfContents headings={headings} />
          </div>
        </div>

        {/* Related Research */}
        {relatedResearch.length > 0 && (
          <section className="dark:bg-gray-900 bg-white dark:border-t dark:border-[#e30a5f] border-t-2 border-[#e30a5f] py-10 px-6">
            <div className="max-w-4xl mx-auto">
              <h2
                className="text-xl font-bold dark:text-white text-gray-900 mb-2"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Related Publications
              </h2>
              <p
                className="dark:text-gray-400 text-gray-600 mb-6 italic text-sm"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Explore more research on similar topics
              </p>

              <div className="space-y-4">
                {relatedResearch.map((relatedArticle) => (
                  <ResearchCard
                    key={relatedArticle.slug}
                    slug={relatedArticle.slug}
                    frontmatter={relatedArticle.frontmatter}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="dark:bg-gray-900 bg-white dark:border-t dark:border-gray-800 border-t border-gray-300 py-6 px-6 mt-auto">
          <div className="max-w-3xl mx-auto text-center">
            <p
              className="dark:text-gray-400 text-gray-600 text-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              For inquiries, contact{' '}
              <a
                href="mailto:rebabel.development@gmail.com"
                className="text-[#e30a5f] hover:text-[#ff1f75] transition-colors underline"
              >
                rebabel.development@gmail.com
              </a>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
