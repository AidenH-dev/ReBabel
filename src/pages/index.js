import Footer from "@/components/landing-page/footer";
import Navbar from "@/components/landing-page/navbar";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import { useRouter } from "next/router";

export default function Home() {
  const animationsRef = useRef(null);
  const router = useRouter();

  const handleSignup = () => {
    router.push("/api/auth/login"); // Navigate to the Auth0 login route
  };
  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-between overflow-hidden px-10 py-4">
        <div className="flex flex-col items-center justify-center w-full">
          <Head>
            <title>Create Next App</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <main className="flex flex-col items-center justify-center mt-24">
            <div className="flex flex-row">
              <div className="flex items-center justify-center flex-wrap max-w-screen-md mt-2 mx-auto">
                <Image
                  src="/LPI.png"
                  alt="Landing Page Icon"
                  width={1000} // Adjust as needed
                  height={1000} // Adjust as needed
                  quality={100} // Maximum image quality
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col items-center justify-center mb-8 text-center">
                <p className="text-3xl font-[500] leading-[1.4] max-w-[40ch] text-center mb-4 text-[#4e4a4a]">
                  The adaptive learning system that makes mastering languages
                  fun and effective!
                </p>

                <div className="relative inline-block">
                  <div className="absolute inset-x-0 bottom-0 bg-[#B0104F] rounded-lg translate-y-1 h-[90%] transition-transform duration-200"></div>
                  <button
                    onClick={handleSignup}
                    className="relative px-24 py-2 text-lg text-white bg-[#E30B5C] active:bg-[#f41567] font-[500] rounded-lg transform transition-transform duration-200 active:translate-y-1"
                  >
                    Get Started
                  </button>
                </div>
                <Link href="/api/auth/logout">
                  <button>Log Out</button>
                </Link>
              </div>
            </div>
            ;
            {/*            <div className="flex items-center justify-center flex-wrap max-w-screen-md mt-2 mx-auto">
              <a
                href="https://nextjs.org/docs"
                className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-[#da1c60] hover:border-[#da1c60]"
              >
                <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                  Documentation{" "}
                  <span className="ml-2">
                    <FaArrowRightLong />
                  </span>
                </h3>
                <p className="m-0 text-md leading-loose">
                  Find in-depth information how to use the tutor.
                </p>
              </a>

              <Link
                href="/learn"
                className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-[#da1c60] hover:border-[#da1c60]"
              >
                <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                  Learn{" "}
                  <span className="ml-2">
                    <FaArrowRightLong />
                  </span>
                </h3>
                <p className="m-0 text-md leading-loose">
                  Learn Japanese through graded translation!
                </p>
              </Link>

              <a
                href="https://github.com/vercel/next.js/tree/canary/examples"
                className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-[#da1c60] hover:border-[#da1c60]"
              >
                <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                  Statistics{" "}
                  <span className="ml-2">
                    <FaArrowRightLong />
                  </span>
                </h3>
                <p className="m-0 text-md leading-loose">
                  Full dashboard of learning statistics between the different
                  mediums.
                </p>
              </a>

              <a
                href="https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                className="m-4 flex-grow-0 flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 hover:text-[#da1c60] hover:border-[#da1c60]"
              >
                <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                  Upload{" "}
                  <span className="ml-2">
                    <FaArrowRightLong />
                  </span>
                </h3>
                <p className="m-0 text-md leading-loose">
                  Upload coursework documents to be assessed on.
                </p>
              </a>
            </div>*/}
            <div className="min-h-screen">
              <div>
                <div className="pb-10 mx-4 sm:mx-16 md:mx-24 lg:mx-80">
                  <div className="mx-auto container">
                    {/* Feature #1 */}
                    <div className="flex flex-col md:flex-row items-center justify-between py-5">
                      <div
                        ref={animationsRef}
                        className="relative flex flex-col justify-start p-4 sm:p-6 md:p-8 max-w-lg animate-fade-right animate-once"
                        data-animation="fade-right"
                      >
                        <h6 className="text-xs sm:text-sm font-sans font-bold text-gray-400">
                          #1 Feature
                        </h6>
                        <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-sans font-bold text-[#2c2b2b]">
                          Generated Practice Material
                        </h2>
                        <p className="mt-4 text-md sm:text-lg"></p>
                      </div>
                      <div
                        className="flex justify-center p-4 sm:p-6 md:p-8 animate-fade-right animate-once"
                        data-animation="fade-right"
                      >
                        <img
                          src="http://api.writesonic.com/static/images/marginalia-order-complete.png"
                          alt=""
                          className="object-cover w-full sm:w-10/12 md:w-5/12"
                        />
                      </div>
                    </div>

                    {/* Feature #2 */}
                    <div
                      ref={animationsRef}
                      className="flex flex-col-reverse md:flex-row items-center justify-between py-10 animate-fade-left animate-once"
                      data-animation="fade-left"
                    >
                      <div className="flex justify-center pl-4 sm:pl-6 md:pl-8">
                        <img
                          src="/AdobeStock_285912706.jpeg"
                          alt=""
                          className="object-cover w-full sm:w-10/12 md:w-5/12"
                        />
                      </div>
                      <div className="flex flex-col justify-start p-4 sm:p-6 md:p-8 max-w-lg">
                        <h6 className="text-xs sm:text-sm font-sans font-bold text-gray-400">
                          #2 Feature
                        </h6>
                        <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-sans font-bold text-[#2c2b2b]">
                          Custom Learning Sets
                        </h2>
                        <p className="mt-4 text-md sm:text-lg"></p>
                      </div>
                    </div>

                    {/* Feature #3 */}
                    <div
                      className="flex flex-col md:flex-row items-center justify-between py-5 animate-fade-right animate-once"
                      data-animation="fade-right"
                    >
                      <div className="flex flex-col justify-start p-4 sm:p-6 md:p-8 max-w-lg">
                        <h6 className="text-xs sm:text-sm font-sans font-bold text-gray-400">
                          #3 Feature
                        </h6>
                        <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-sans font-bold text-[#2c2b2b]">
                          Learn Character & Kanji Readings
                        </h2>
                        <p className="mt-4 text-md sm:text-lg"></p>
                      </div>
                      <div className="flex justify-center p-4 sm:p-6 md:p-8">
                        <img
                          src="http://api.writesonic.com/static/images/marginalia-coming-soon.png"
                          alt=""
                          className="object-cover w-full sm:w-10/12 md:w-5/12"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </main>
      <Footer />
    </>
  );
}
