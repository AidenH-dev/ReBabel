import Head from 'next/head';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Predefined footer column sets — pages pick which ones to show
const FOOTER_COLUMNS = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '#' },
      { label: 'Roadmap', href: '#' },
      { label: 'Curriculum', href: '#' },
    ],
  },
  'product-simple': {
    title: 'Product',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  learn: {
    title: 'Learn',
    links: [
      { label: 'What Is SRS?', href: '/study-guide/what-is-srs' },
      { label: 'Blog', href: '/blog' },
      { label: 'Help & FAQ', href: '/help' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Help & FAQ', href: '/help' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '#' },
    ],
  },
  community: {
    title: 'Community',
    links: [
      {
        label: 'Discord',
        href: 'https://discord.gg/2g6BHuaBtD',
        external: true,
      },
    ],
  },
  platforms: {
    title: 'Platforms',
    links: [
      { label: 'Web App', href: '/' },
      {
        label: 'iOS App',
        href: 'https://apps.apple.com/us/app/rebabel/id6758738478',
        external: true,
      },
    ],
  },
};

/**
 * Shared layout for public (unauthenticated) pages.
 * Provides the fixed navbar, footer with configurable columns, ThemeToggle, and Head.
 *
 * Usage:
 *   <PublicLayout title="Help & FAQ" footerColumns={['product-simple', 'support', 'community']}>
 *     {page content}
 *   </PublicLayout>
 */
export default function PublicLayout({
  title,
  children,
  footerColumns = ['product', 'learn', 'legal'],
  mainClassName = '',
}) {
  return (
    <>
      {title && (
        <Head>
          <title>{title}</title>
        </Head>
      )}

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-surface-page/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <span className="text-2xl font-bold text-brand-pink cursor-pointer">
                ReBabel
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/api/auth/login">
                <button className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/api/auth/login">
                <Button variant="primary" size="md">
                  Join
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className={mainClassName}>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-brand-pink mb-4">
                ReBabel
              </h3>
              <p className="text-sm text-gray-400">
                Building the future of Japanese learning.
              </p>
            </div>
            {footerColumns.map((colKey) => {
              const col = FOOTER_COLUMNS[colKey];
              if (!col) return null;
              return (
                <div key={colKey}>
                  <h4 className="font-semibold mb-4">{col.title}</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    {col.links.map((link) => (
                      <li key={link.href + link.label}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className="hover:text-white">
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-gray-400">
            <div className="flex items-center justify-between">
              <p>
                &copy; 2025 ReBabel. All rights reserved. Currently in beta
                development.
              </p>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// Export for pages that need custom footer columns
export { FOOTER_COLUMNS };
