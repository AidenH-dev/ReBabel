import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { getAllResearch } from '@/lib/research/markdown';
import ResearchCard from '@/components/research/ResearchCard';
import ResearchSearchBar from '@/components/research/ResearchSearchBar';
import CategorySidebar from '@/components/research/CategorySidebar';

export async function getStaticProps() {
  const research = getAllResearch();

  return {
    props: {
      research,
    },
    revalidate: 3600, // Revalidate every hour
  };
}

export default function Research({ research }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Extract unique categories from all articles
  const allCategories = useMemo(() => {
    const categories = new Set();
    research.forEach((article) => {
      if (article.frontmatter.tags && Array.isArray(article.frontmatter.tags)) {
        article.frontmatter.tags.forEach((tag) => categories.add(tag));
      }
    });
    return Array.from(categories);
  }, [research]);

  // Filter articles based on search and categories
  const filteredResearch = useMemo(() => {
    return research.filter((article) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        article.frontmatter.title.toLowerCase().includes(query) ||
        article.frontmatter.abstract?.toLowerCase().includes(query) ||
        article.frontmatter.authors?.toString().toLowerCase().includes(query) ||
        article.frontmatter.journal?.toLowerCase().includes(query);

      const matchesCategories =
        selectedCategories.length === 0 ||
        (article.frontmatter.tags &&
          selectedCategories.some((cat) =>
            article.frontmatter.tags.includes(cat)
          ));

      return matchesSearch && matchesCategories;
    });
  }, [research, searchQuery, selectedCategories]);

  return (
    <>
      <Head>
        <title>ReBabel Research - Independent Publications & Studies</title>
        <meta name="description" content="Independent, non-peer-reviewed research articles and publications on learning, cognitive science, and educational technology from ReBabel." />
        <meta name="keywords" content="language learning research, educational technology, cognitive science, linguistics, second language acquisition, research publications" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ReBabel Research - Independent Publications & Studies" />
        <meta property="og:description" content="Independent research articles and publications on language and educational technology." />
        <meta property="og:image" content="https://rebabel.org/og-image.png" />
        <meta property="og:url" content="https://rebabel.org/research" />
        <meta property="og:site_name" content="ReBabel" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ReBabel Research - Independent Publications & Studies" />
        <meta name="twitter:description" content="Independent research articles and publications on language and educational technology." />
        <meta name="twitter:image" content="https://rebabel.org/og-image.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://www.rebabel.org/research" />

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: 'ReBabel Research',
              description: 'Independent research publications on language learning and educational technology',
              url: 'https://rebabel.org/research',
              publisher: {
                '@type': 'Organization',
                name: 'ReBabel',
                url: 'https://rebabel.org',
                image: 'https://rebabel.org/og-image.png',
              },
            })
          }}
        />
      </Head>

      <main className="dark:bg-[#141f25] bg-gray-50 min-h-screen flex flex-col" style={{ fontFamily: 'IBM Plex Serif' }}>

        <div className="dark:bg-gradient-to-b dark:from-gray-900 dark:to-[#141f25] bg-gradient-to-b from-gray-50 to-white py-3 px-6 dark:border-b dark:border-gray-800 border-b border-gray-200">
          <div className="max-w-5xl mx-auto">
            <h1 className="flex items-center gap-2">
              <Link href='/' className="flex items-center gap-0.5 hover:opacity-80 transition-opacity">
                <Image
                  src="/ReBabel_Icon.png"
                  alt="ReBabel"
                  width={80}
                  height={80}
                  className="w-10 h-10 object-contain"
                  priority
                />
                <span className="text-2xl font-bold text-[#e30a5f] font-fredoka leading-none">ReBabel</span>
              </Link>
              <span className="text-lg dark:text-gray-300 text-gray-600" style={{ fontFamily: 'IBM Plex Serif, serif', fontWeight: 700 }}>
                Research & Development
              </span>
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Search Bar */}
          <div className="mb-8">
            <ResearchSearchBar
              onSearch={setSearchQuery}
              placeholder="Search by title, abstract, authors, or journal..."
            />
          </div>

          {/* Layout with Sidebar and Articles */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <CategorySidebar
                categories={allCategories}
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
            </div>

            {/* Research Articles */}
            <div className="lg:col-span-3">
              {filteredResearch.length > 0 ? (
                <div className="space-y-4">
                  {filteredResearch.map((article) => (
                    <ResearchCard
                      key={article.slug}
                      slug={article.slug}
                      frontmatter={article.frontmatter}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg
                    className="w-16 h-16 dark:text-gray-600 text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold dark:text-gray-300 text-gray-700 mb-2">
                    No articles found
                  </h3>
                  <p className="dark:text-gray-400 text-gray-600 max-w-sm">
                    {searchQuery || selectedCategories.length > 0
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No research articles available yet.'}
                  </p>
                  {(searchQuery || selectedCategories.length > 0) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategories([]);
                      }}
                      className="mt-4 px-4 py-2 rounded-lg bg-[#e30a5f] text-white hover:bg-[#ff1f75] transition-colors font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {/* Results info */}
              {filteredResearch.length > 0 && (
                <div className="mt-8 text-center text-sm dark:text-gray-400 text-gray-600">
                  Showing {filteredResearch.length} of {research.length} articles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="dark:bg-gray-900 bg-white dark:border-t dark:border-gray-800 border-t border-gray-300 py-8 px-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Disclaimer */}
            <div className="rounded-lg dark:bg-gray-800 bg-gray-50 p-4 border dark:border-gray-700 border-gray-200">
              <p
                className="dark:text-gray-300 text-gray-700 text-xs leading-relaxed"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                <span className="font-semibold">Disclaimer:</span> The research articles presented here are independent, non-peer-reviewed research and development conducted by ReBabel. These publications represent exploratory work and do not undergo formal peer review processes. Readers should critically evaluate the content and methodologies presented. This research is intended for educational purposes and discussion within the learning technology community.
              </p>
            </div>

            {/* Contact Info */}
            <p
              className="dark:text-gray-400 text-gray-600 text-sm text-center"
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
