import Head from "next/head";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";
import { FaClock, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function DueNow() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>Due Now - Review Cards</title>
        <meta name="description" content="Review cards that are due now" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <AcademySidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Link
              href={`/learn/academy/sets/study/${id}`}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Study</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <FaClock className="text-3xl text-purple-500" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Due Now
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Review cards that are due for practice
              </p>
            </div>

            {/* Placeholder Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
              <div className="text-center">
                <FaClock className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This feature is currently under development. You&apos;ll be able to review your due cards here soon.
                </p>
                <div className="inline-block px-6 py-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-900 dark:text-purple-300">
                    SRS review system coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = withPageAuthRequired();
