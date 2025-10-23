import Head from "next/head";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";
import { FaBrain, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function LearnNew() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>Learn New - Add Cards</title>
        <meta name="description" content="Learn new cards in your study set" />
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
                <FaBrain className="text-3xl text-blue-500" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Learn New Cards
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Add new cards to your spaced repetition system
              </p>
            </div>

            {/* Placeholder Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
              <div className="text-center">
                <FaBrain className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This feature is currently under development. You'll be able to learn new cards here soon.
                </p>
                <div className="inline-block px-6 py-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    New card learning system coming soon
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
