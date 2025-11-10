import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { getAllPosts } from '@/lib/blog/markdown';
import BlogCard from '@/components/blog/BlogCard';

export async function getStaticProps() {
  const posts = getAllPosts();

  return {
    props: {
      posts,
    },
    revalidate: 3600, // Revalidate every hour
  };
}

export default function Blog({ posts }) {
  const [selectedTag, setSelectedTag] = useState(null);

  // Get all unique tags
  const allTags = Array.from(
    new Set(posts.flatMap((post) => post.frontmatter.tags || []))
  ).sort();

  // Filter posts by selected tag
  const filteredPosts = selectedTag
    ? posts.filter((post) => (post.frontmatter.tags || []).includes(selectedTag))
    : posts;

  return (
    <>
      <Head>
        <title>ReBabel Blog - Language Learning Tips & Study Strategies</title>
        <meta name="description" content="Discover effective language learning techniques, science-backed study strategies, and Japanese language tips to accelerate your learning journey." />
        <meta name="keywords" content="language learning, study strategies, spaced repetition, Japanese learning tips, JLPT preparation, language learning methods" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ReBabel Blog - Language Learning Tips & Study Strategies" />
        <meta property="og:description" content="Discover effective language learning techniques, science-backed study strategies, and Japanese language tips." />
        <meta property="og:image" content="https://rebabel.org/og-image.png" />
        <meta property="og:url" content="https://rebabel.org/blog" />
        <meta property="og:site_name" content="ReBabel" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ReBabel Blog - Language Learning Tips & Study Strategies" />
        <meta name="twitter:description" content="Discover effective language learning techniques, science-backed study strategies, and Japanese language tips." />
        <meta name="twitter:image" content="https://rebabel.org/og-image.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://rebabel.org/blog" />

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: 'ReBabel Blog',
              description: 'Language learning tips, study strategies, and educational articles',
              url: 'https://rebabel.org/blog',
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

      <main className="dark:bg-[#141f25] bg-white min-h-screen">
        {/* Header Section */}
        <div className="dark:bg-gradient-to-b dark:from-gray-900 dark:to-[#141f25] bg-gradient-to-b from-gray-50 to-white py-8 px-4 dark:border-b dark:border-gray-800 border-b border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <Link href='/' className="text-4xl font-bold text-[#e30a5f] font-inter">ReBabel</Link>
              <span className="text-lg dark:text-gray-300 text-gray-700 font-inter">Blog</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Tag Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full font-fredoka font-medium transition-all ${selectedTag === null
                    ? 'bg-[#e30a5f] text-white shadow-lg'
                    : 'dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
              >
                All Articles
              </button>

              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full font-fredoka font-medium transition-all ${selectedTag === tag
                      ? 'bg-[#e30a5f] text-white shadow-lg'
                      : 'dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {selectedTag && (
              <p className="dark:text-gray-400 text-gray-600 mt-4">
                Showing {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} tagged with &quot;{selectedTag}&quot;
              </p>
            )}
          </div>

          {/* Blog Posts Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <BlogCard
                  key={post.slug}
                  slug={post.slug}
                  frontmatter={post.frontmatter}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="dark:text-gray-400 text-gray-600 text-lg">
                No articles found for &quot;{selectedTag}&quot;. Try a different tag!
              </p>
              <button
                onClick={() => setSelectedTag(null)}
                className="mt-4 px-4 py-2 bg-[#e30a5f] hover:bg-[#ff1f75] text-white rounded-lg transition-colors font-fredoka"
              >
                View All Articles
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 dark:border-t dark:border-gray-800 bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200 py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h3 className="text-2xl font-bold dark:text-white text-gray-900 mb-4 font-fredoka">
              Want more learning insights?
            </h3>
            <p className="dark:text-gray-300 text-gray-700 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter for weekly tips, study strategies, and language learning techniques delivered to your inbox.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/learn" className="px-6 py-3 bg-[#e30a5f] hover:bg-[#ff1f75] text-white rounded-lg font-fredoka font-medium transition-colors">
                Start Learning Now
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
