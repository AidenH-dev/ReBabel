import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRightLong } from "react-icons/fa6";



export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between h-screen overflow-hidden px-10 py-4">
      <div className="flex flex-col items-center justify-center w-full">
          <Head>
              <title>Create Next App</title>
              <link rel="icon" href="/favicon.ico" />
          </Head>

          <main className="flex flex-col items-center justify-center mt-24">
            <h1 className="text-center m-0 mb-4 text-6xl font-semibold leading-tight">
                Welcome To <a className="text-blue-600 no-underline ">{"日本語 "}</a> Tutor! {/*hover:underline focus:underline active:underline*/}
            </h1>

            <p className="text-center text-2xl leading-loose mb-8">
                Get started by clicking on <code className="font-bold">Learn</code>
            </p>

            <div className="flex items-center justify-center flex-wrap max-w-screen-md mt-2 mx-auto">
                <a href="https://nextjs.org/docs" className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-blue-600 hover:border-blue-600">
                    <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                        Documentation <span className="ml-2"><FaArrowRightLong /></span>
                    </h3>
                    <p className="m-0 text-md leading-loose">Find in-depth information how to use the tutor.</p>
                </a>

                <Link href="/learn" className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-blue-600 hover:border-blue-600">
                    <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                        Learn <span className="ml-2"><FaArrowRightLong /></span>
                    </h3>
                    <p className="m-0 text-md leading-loose">Learn Japanese through graded translation!</p>
                </Link>

                <a href="https://github.com/vercel/next.js/tree/canary/examples" className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-blue-600 hover:border-blue-600">
                    <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                        Examples <span className="ml-2"><FaArrowRightLong /></span>
                    </h3>
                    <p className="m-0 text-md leading-loose">Walkthrough examples.</p>
                </a>

                <a href="https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app" className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-blue-600 hover:border-blue-600">
                    <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                        Upload <span className="ml-2"><FaArrowRightLong /></span>
                    </h3>
                    <p className="m-0 text-md leading-loose">
                        Upload coursework documents to be assesed on.
                    </p>
                </a>
            </div>
          </main>
      </div>
    </main>

  );
}
