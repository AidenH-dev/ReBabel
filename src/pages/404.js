import Head from "next/head";
import { useRouter } from "next/router";

export default function Custom404() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>404 - Page Not Found | ReBabel</title>
      </Head>

      <main className="min-h-screen bg-[#141f25] flex items-center justify-center relative overflow-hidden px-4">
        {/* Decorative blurred circles */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#e30a5f]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#667eea]/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          <p className="text-7xl sm:text-9xl font-bold bg-gradient-to-r from-[#e30a5f] to-[#764ba2] bg-clip-text text-transparent">
            404
          </p>

          <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-white">
            This page got lost in translation
          </h1>

          <p className="mt-3 text-gray-400">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <button
            onClick={() => router.back()}
            className="mt-8 px-6 py-3 bg-[#e30a5f] hover:bg-[#f41567] text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </main>
    </>
  );
}
