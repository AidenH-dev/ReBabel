import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog/markdown';
import BlogMarkdown from '@/components/blog/BlogMarkdown';
import BlogCard from '@/components/blog/BlogCard';
import { formatDate } from '@/lib/blog/date';
import { FiArrowLeft, FiShare2, FiCopy } from 'react-icons/fi';
import { useState } from 'react';

export async function getStaticPaths() {
  const posts = getAllPosts();

  return {
    paths: posts.map((post) => ({
      params: {
        slug: post.slug,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);
  const relatedPosts = getRelatedPosts(params.slug);

  return {
    props: {
      post,
      relatedPosts,
    },
    revalidate: 3600, // Revalidate every hour
  };
}

export default function BlogPost({ post, relatedPosts }) {
  const { slug, content, frontmatter } = post;
  const { title, excerpt, date, author, tags, image } = frontmatter;
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: excerpt,
          url: fullUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    }
  };

  return (
    <>
      <Head>
        <title>{title} - ReBabel Blog</title>
        <meta name="description" content={excerpt} />
        <meta name="keywords" content={tags?.join(', ') || 'language learning, language tips'} />

        {/* Open Graph / Facebook - using 'property' not 'name' */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt} />
        {image && <meta property="og:image" content={image} />}
        <meta property="og:url" content={`https://rebabel.org/blog/${slug}`} />
        <meta property="og:site_name" content="ReBabel Blog" />

        {/* Article-specific meta tags */}
        <meta property="article:published_time" content={date} />
        <meta property="article:modified_time" content={date} />
        {author && <meta property="article:author" content={author} />}
        {tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={excerpt} />
        {image && <meta name="twitter:image" content={image} />}

        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.rebabel.org/blog/${slug}`} />

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* JSON-LD Structured Data for Article */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: title,
              description: excerpt,
              image: image || 'https://rebabel.org/og-image.png',
              datePublished: date,
              dateModified: date,
              author: author ? {
                '@type': 'Person',
                name: author,
              } : undefined,
              keywords: tags?.join(', '),
              articleBody: content,
              url: `https://rebabel.org/blog/${slug}`,
            })
          }}
        />
      </Head>

      <main className="dark:bg-[#141f25] bg-white min-h-screen">
        {/* Hero/Header Section */}
        {image && (
          <div className="relative h-96 dark:bg-gray-900 bg-gray-200 overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 dark:bg-gradient-to-t dark:from-[#141f25] dark:to-transparent bg-gradient-to-t from-white to-transparent" />
          </div>
        )}

        {/* Back Button & Article Meta */}
        <div className="dark:bg-gray-900 dark:border-b dark:border-gray-800 bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/blog" className="flex items-center gap-2 dark:text-gray-400 dark:hover:text-[#e30a5f] text-gray-600 hover:text-[#e30a5f] transition-colors font-fredoka font-medium">
              <FiArrowLeft size={20} />
              Back to Blog
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="relative p-2 dark:hover:bg-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy link"
              >
                <FiCopy className="dark:text-gray-400 dark:hover:text-[#e30a5f] text-gray-600 hover:text-[#e30a5f]" size={20} />
                {copied && (
                  <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-200 text-sm rounded whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-4 py-12">
          {/* Article Header */}
          <header className="mb-6">
            <h1 className="text-5xl font-bold dark:text-white text-gray-900 mb-4 font-fredoka leading-tight">
              {title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags?.map((tag) => (
                <Link key={tag} href={`/blog?tag=${tag}`} className="px-3 py-1 bg-[#e30a5f] bg-opacity-20 text-white text-sm rounded-full hover:bg-opacity-30 transition-colors font-fredoka">
                  {tag}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 dark:text-gray-400 text-gray-600 pb-6 dark:border-b dark:border-gray-800 border-b border-gray-200">
              <div>
                <span className="font-fredoka dark:text-gray-500 text-gray-600">Published</span>
                <p className="dark:text-white text-gray-900">{formatDate(date)}</p>
              </div>
              {author && (
                <div>
                  <span className="font-fredoka dark:text-gray-500 text-gray-600">Author</span>
                  <p className="dark:text-white text-gray-900">{author}</p>
                </div>
              )}
              <div>
                <span className="font-fredoka dark:text-gray-500 text-gray-600">Reading Time</span>
                <p className="dark:text-white text-gray-900">~{Math.ceil(content.split(' ').length / 200)} min</p>
              </div>
            </div>
          </header>

          {/* Article Body */}
          <BlogMarkdown content={content} />
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="dark:bg-gray-900 bg-gray-50 dark:border-t dark:border-gray-800 border-t border-gray-200 py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold dark:text-white text-gray-900 mb-2 font-fredoka">Related Articles</h2>
              <p className="dark:text-gray-400 text-gray-600 mb-8">Explore more on similar topics</p>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard
                    key={relatedPost.slug}
                    slug={relatedPost.slug}
                    frontmatter={relatedPost.frontmatter}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div className="dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 dark:border-t dark:border-gray-800 bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold dark:text-white text-gray-900 mb-4 font-fredoka">
              Ready to improve your language skills?
            </h3>
            <p className="dark:text-gray-300 text-gray-700 mb-6">
              Start practicing with interactive lessons and spaced repetition today.
            </p>
            <Link href="/learn" className="inline-block px-8 py-3 bg-[#e30a5f] hover:bg-[#ff1f75] text-white rounded-lg font-fredoka font-medium transition-colors">
              Start Learning
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
