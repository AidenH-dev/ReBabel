import Head from 'next/head';
import MainSidebar from '@/components/Sidebars/MainSidebar';
import AcademySidebar from '@/components/Sidebars/AcademySidebar';
import AdminSidebar from '@/components/Sidebars/AdminSidebar';

const SIDEBARS = {
  main: MainSidebar,
  academy: AcademySidebar,
  admin: AdminSidebar,
};

const WRAPPER_VARIANTS = {
  // Standard scrollable page
  default: 'flex min-h-screen bg-surface-page',
  // Full-height locked (no page scroll, content area scrolls internally)
  fixed: 'flex flex-row h-screen overflow-hidden bg-surface-page',
  // Gradient background (quiz, flashcards, SRS sessions)
  gradient:
    'flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-page dark:to-surface-card',
};

/**
 * Shared layout for all authenticated pages.
 * Handles the sidebar, page wrapper, Head meta, and main content area.
 *
 * Usage:
 *   <AuthenticatedLayout sidebar="academy" title="Sets">
 *     {page content}
 *   </AuthenticatedLayout>
 *
 *   <AuthenticatedLayout sidebar="main" title="Dashboard" variant="fixed">
 *     {page content}
 *   </AuthenticatedLayout>
 */
export default function AuthenticatedLayout({
  sidebar = 'main',
  title,
  variant = 'default',
  mainClassName = '',
  wrapperClassName = '',
  children,
}) {
  const Sidebar = SIDEBARS[sidebar] || SIDEBARS.main;
  const wrapperClasses = WRAPPER_VARIANTS[variant] || WRAPPER_VARIANTS.default;

  return (
    <div className={`${wrapperClasses} ${wrapperClassName}`}>
      <Sidebar />
      <main
        className={`ml-auto flex-1 flex flex-col ${
          variant === 'fixed' ? 'overflow-y-auto' : ''
        } ${mainClassName}`}
      >
        {title && (
          <Head>
            <title>{title}</title>
          </Head>
        )}
        {children}
      </main>
    </div>
  );
}
