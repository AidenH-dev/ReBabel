import Script from "next/script";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FaBrain,
  FaChartLine,
  FaCheckCircle,
  FaRocket,
  FaUsers,
  FaStar,
  FaQuoteLeft,
  FaGraduationCap,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";

export default function Home() {
  const animationsRef = useRef(null);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSignup = () => {
    router.push("/api/auth/login");
  };

  const handleEarlyAccess = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      // Handle email submission here
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <>
      {/* Simple Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#e30a5f]">ReBabel</span>
              <span className="ml-2 text-xs bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-2 py-1 rounded-full">
                BETA
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignup}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={handleSignup}
                className="px-4 py-2 text-sm bg-[#e30a5f] hover:bg-[#f41567] text-white font-medium rounded-lg transition-colors"
              >
                Join Early Access
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-5">
        <Head>
          {/* Primary Meta Tags */}
          <title>ReBabel - Master Japanese with Science-Based Learning</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          <meta
            name="description"
            content="Learn Japanese with ReBabel - a science-based language platform using spaced repetition, grammar SRS, and interactive practice. Join our free beta today."
          />
          <meta name="keywords" content="japanese learning, language learning, spaced repetition, jlpt, japanese practice, grammar, vocabulary" />
          <meta name="author" content="ReBabel" />
          <meta name="theme-color" content="#e30a5f" />

          {/* Canonical URL */}
          <link rel="canonical" href="https://rebabel.org/" />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://rebabel.org/" />
          <meta property="og:title" content="ReBabel - Master Japanese with Science-Based Learning" />
          <meta
            property="og:description"
            content="Learn Japanese with ReBabel - a science-based language platform using spaced repetition, grammar SRS, and interactive practice. Join our free beta today."
          />
          <meta property="og:image" content="https://rebabel.org/og-image.png" />
          <meta property="og:image:alt" content="ReBabel - Japanese Learning Platform" />
          <meta property="og:site_name" content="ReBabel" />
          <meta property="og:locale" content="en_US" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://rebabel.org/" />
          <meta property="twitter:title" content="ReBabel - Master Japanese with Science-Based Learning" />
          <meta
            property="twitter:description"
            content="Learn Japanese with ReBabel - a science-based language platform using spaced repetition, grammar SRS, and interactive practice. Join our free beta today."
          />
          <meta property="twitter:image" content="https://rebabel.org/og-image.png" />
          <meta property="twitter:creator" content="@rebabel" />

          {/* Favicons */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/favicon.ico" />

          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "ReBabel",
                "description": "Science-based Japanese language learning platform",
                "url": "https://rebabel.org",
                "image": "https://rebabel.org/og-image.png",
                "potentialAction": {
                  "@type": "JoinAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://rebabel.org/api/auth/login"
                  }
                }
              })
            }}
          />

          {/* Additional SEO */}
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <link rel="sitemap" href="https://rebabel.org/sitemap.xml" />
        </Head>

        <Script
          src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (window?.kofiWidgetOverlay?.draw) {
              window.kofiWidgetOverlay.draw("rebabel", {
                type: "floating-chat",
                "floating-chat.position": "bottom-left",
                "floating-chat.donateButton.text": "Support Us",
                "floating-chat.donateButton.background-color": "#E30B5C",
                "floating-chat.donateButton.text-color": "#fff",
              });
            }
          }}
        />

        {/* Hero Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-16 md:pb-18">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 text-[#667eea] px-4 py-2 rounded-full text-sm font-medium mb-10 border border-[#667eea]/20">
                  <FaRocket className="text-xs" />
                  <span>Now Accepting Beta Users</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Master Japanese with
                  <span className="text-[#e30a5f] block mt-2">
                    Intelligent Learning
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                  We&apos;re striving to make practicing Japanese a more accessible and less complicated experience.
                  Be part of our journey from day one.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <div className="relative inline-block">
                    <div className="absolute inset-x-0 bottom-0 bg-[#B0104F] rounded-lg translate-y-1 h-[90%]"></div>
                    <button
                      onClick={handleSignup}
                      className="relative px-8 py-3 text-lg text-white bg-[#E30B5C] hover:bg-[#f41567] font-semibold rounded-lg transform transition-all duration-200 active:translate-y-1 w-full sm:w-auto"
                    >
                      Join Beta - It&apos;s Free
                    </button>
                  </div>

                  {/*<button className="px-8 py-3 text-lg text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 font-medium rounded-lg transition-colors">
                    Watch Demo
        </button>*/}
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-8 mt-8 justify-center lg:justify-start">
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-[#e30a5f]" />
                    <span className="text-sm text-gray-600">
                      <strong>Free Tier</strong> Access Forever
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-[#e30a5f]" />
                    <span className="text-sm text-gray-600">
                      <strong>Founder</strong> Pricing Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="relative">
                <div className="relative z-10">
                  <Image
                    src="/LPI.png"
                    alt="ReBabel Learning Platform"
                    width={600}
                    height={400}
                    className="w-full max-w-[600px] mx-auto rounded-2xl shadow-2xl"
                    priority
                  />
                  {/* Beta Badge on Image */}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg transform rotate-12">
                    Early Access
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#e30a5f]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* What We're Building Section
        <section className="w-full bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                What Do You Get?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                All of these features are free and will stay that way!              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">

              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#e30a5f] to-[#f41567] rounded-lg flex items-center justify-center text-white mb-4">
                  <MdTranslate className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Integrated Study System
                </h3>
                <p className="text-gray-600 mb-4">
                  Stop juggling multiple apps. Study vocabulary and grammar with SRS, test yourself with quizzes, or review with flashcards - all in one place.
                </p>
              </div>


              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#34d399] rounded-lg flex items-center justify-center text-white mb-4">
                  <LuRepeat className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Grammar + Vocab SRS
                </h3>
                <p className="text-gray-600 mb-4">
                  Practice grammar patterns with spaced repetition, not just vocabulary. Most tools ignore grammar in SRS - we don&apos;t.
                </p>
              </div>


              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center text-white mb-4">
                  <FaLightbulb className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Custom Study Sets
                </h3>
                <p className="text-gray-600 mb-4">
                  Create sets for exactly what you&apos;re learning right now. Your textbook chapter, your weak points, or upcoming test material.
                </p>
              </div>


              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#f59e0b] to-[#f97316] rounded-lg flex items-center justify-center text-white mb-4">
                  <FaRocket className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Fast Vocabulary Practice
                </h3>
                <p className="text-gray-600 mb-4">
                  Type answers automatically in romaji or katakana without switching keyboards. Practice vocabulary translations quickly with a fluid typing interface.
                </p>
              </div>
            </div>


            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-3">
                <FaStar className="text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">Coming Soon: Premium Plans</span>
                <FaStar className="text-yellow-400" />
              </div>
              <p className="text-sm text-gray-300 text-center">
                Core features will always be free. Limited founder subscriptions with
                lifetime discounts will be available for beta members who want advanced features.
              </p>
            </div>
          </div>
        </section>*/}
        {/* Deep Dive Features Section */}
        <section className="w-full pb-12 md:pb-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                What Do You Get?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto italic">
                All of these features are free and will stay that way! We are working on even better paid features if you want to support us in the future.
              </p>
            </div>

            {/* Feature #1 - Integrated Study System */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-24">
              <div
                ref={animationsRef}
                className="animate-fade-right animate-once order-2 md:order-1"
                data-animation="fade-right"
              >
                <div className="text-center md:text-left">
                  <span className="inline-block text-sm font-bold text-[#e30a5f] mb-3">
                    Feature 01
                  </span>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Integrated Study System
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Stop juggling multiple paid apps. Study vocabulary and grammar with SRS, test yourself with quizzes, or review with flashcards - all in one place.
                  </p>
                </div>
              </div>
              <div
                className="order-1 md:order-2 flex items-center justify-center"
              >
                <Image
                  src="/Feature1.png"
                  alt="Integrated Study System"
                  width={800}
                  height={640}
                  className="w-full max-w-lg rounded-2xl shadow-lg object-cover"
                  quality={100}
                  priority
                />
              </div>
            </div>

            {/* Feature #2 - Grammar + Vocab SRS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-24">
              <div
                className="flex items-center justify-center"
              >
                <Image
                  src="/Feature2.png"
                  alt="Grammar + Vocab SRS"
                  width={800}
                  height={640}
                  className="w-full max-w-lg rounded-2xl shadow-lg object-cover"
                  quality={100}
                  priority
                />
              </div>
              <div
                ref={animationsRef}
                className="animate-fade-left animate-once"
                data-animation="fade-left"
              >
                <div className="text-center md:text-left">
                  <span className="inline-block text-sm font-bold text-[#e30a5f] mb-3">
                    Feature 02
                  </span>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Grammar + Vocab SRS
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Practice grammar patterns with spaced repetition, not just vocabulary. Most tools ignore grammar in SRS - we don&apos;t.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature #3 - Custom Study Sets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-24">
              <div
                ref={animationsRef}
                className="animate-fade-right animate-once order-2 md:order-1"
                data-animation="fade-right"
              >
                <div className="text-center md:text-left">
                  <span className="inline-block text-sm font-bold text-[#e30a5f] mb-3">
                    Feature 03
                  </span>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Custom Study Sets
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Create sets for exactly what you&apos;re learning right now. Your textbook chapter, your weak points, or upcoming test material.
                  </p>
                </div>
              </div>
              <div
                className="order-1 md:order-2 flex items-center justify-center"
              >
                <Image
                  src="/Feature3.png"
                  alt="Custom Study Sets"
                  width={800}
                  height={640}
                  className="w-full max-w-lg rounded-2xl shadow-lg object-cover"
                  quality={100}
                  priority
                />
              </div>
            </div>

            {/* Feature #4 - Fast Vocabulary Practice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div
                className="flex items-center justify-center"
              >
                <Image
                  src="/Feature4.png"
                  alt="Fast Vocabulary Practice"
                  width={800}
                  height={640}
                  className="w-full max-w-lg rounded-2xl shadow-lg object-cover"
                  quality={100}
                  priority
                />
              </div>
              <div
                ref={animationsRef}
                className="animate-fade-left animate-once"
                data-animation="fade-left"
              >
                <div className="text-center md:text-left">
                  <span className="inline-block text-sm font-bold text-[#e30a5f] mb-3">
                    Feature 04
                  </span>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Fast Vocabulary Practice
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Type answers automatically in romaji or katakana without switching keyboards. Practice vocabulary translations quickly with a fluid typing interface.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section
        <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why ReBabel Will Work
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We&apos;re combining proven cognitive science with modern technology
                to create the most effective Japanese learning experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center text-white mb-4">
                  <FaBrain className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Spaced Repetition System
                </h3>
                <p className="text-gray-600 mb-4">
                  Our intelligent algorithm will show you cards at optimal
                  intervals, using proven methods to maximize retention.
                </p>
                <ul className="space-y-2">
                  {[
                    "Adaptive intervals",
                    "Memory strength tracking",
                    "Automatic review scheduling",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#e30a5f] to-[#f41567] rounded-lg flex items-center justify-center text-white mb-4">
                  <MdTranslate className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Comprehensive Practice
                </h3>
                <p className="text-gray-600 mb-4">
                  Master all aspects of Japanese with diverse exercise types
                  tailored to your learning style.
                </p>
                <ul className="space-y-2">
                  {[
                    "Translation exercises",
                    "Conjugation practice",
                    "Reading comprehension",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#34d399] rounded-lg flex items-center justify-center text-white mb-4">
                  <FaChartLine className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Progress Analytics
                </h3>
                <p className="text-gray-600 mb-4">
                  Track your journey with detailed insights into your learning
                  patterns and achievements.
                </p>
                <ul className="space-y-2">
                  {[
                    "Daily streaks",
                    "Skill distribution",
                    "JLPT level tracking",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section> */}

        {/* Learning Path Section 
        <section className="w-full py-20 bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Your Path to Fluency
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We&apos;re designing a comprehensive curriculum to guide you from
                absolute beginner to advanced speaker.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  level: "Beginner",
                  desc: "Hiragana & Katakana",
                  status: "Coming Q3 2025",
                  color: "from-green-400 to-green-600",
                },
                {
                  level: "Elementary",
                  desc: "Basic Grammar & Vocab",
                  status: "Available at Launch",
                  color: "from-blue-400 to-blue-600",
                },
                {
                  level: "Intermediate",
                  desc: "Complex Sentences",
                  status: "Coming Q3 2025",
                  color: "from-purple-400 to-purple-600",
                },
                {
                  level: "Advanced",
                  desc: "Native-like Fluency",
                  status: "Coming Q3 2025",
                  color: "from-[#e30a5f] to-[#f41567]",
                },
              ].map((stage, index) => (
                <div key={stage.level} className="relative">
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <FaArrowRightLong className="text-gray-400 text-2xl" />
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow h-full">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${stage.color} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}
                    >
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {stage.level}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">{stage.desc}</p>
                    <span className="text-xs text-[#e30a5f] font-medium">
                      {stage.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>*/}

        {/* Beta Benefits Section (Replaces Testimonials) 
        <section className="w-full py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Be Part of Something Special
              </h2>
              <p className="text-lg text-gray-600">
                As an early member, you&apos;ll help shape the future of ReBabel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 rounded-2xl p-8 border border-[#667eea]/20">
                <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center text-white mb-4">
                  <FaLightbulb className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Shape the Product
                </h3>
                <p className="text-gray-600">
                  Your feedback will directly influence features and improvements.
                  Be heard and see your ideas come to life.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#e30a5f]/10 to-[#f41567]/10 rounded-2xl p-8 border border-[#e30a5f]/20">
                <div className="w-12 h-12 bg-gradient-to-br from-[#e30a5f] to-[#f41567] rounded-lg flex items-center justify-center text-white mb-4">
                  <FaStar className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Founder Pricing
                </h3>
                <p className="text-gray-600">
                  Lock in exclusive discounted rates on premium features. Beta users
                  get lifetime founder pricing when subscriptions launch.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white mb-4">
                  <FaUsers className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Exclusive Community
                </h3>
                <p className="text-gray-600">
                  Join our founding community of passionate learners and get
                  direct access to the development team.
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl p-8 border border-orange-500/20">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center text-white mb-4">
                  <FaRocket className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Early Access Features
                </h3>
                <p className="text-gray-600">
                  Be the first to try new features and content as we build them.
                  Get a head start on your learning journey.
                </p>
              </div>
            </div>
          </div>
        </section>*/}

        {/* CTA Section with Discord Invite */}
        <section className="w-full py-20 bg-gradient-to-r from-[#e30a5f] to-[#f41567]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Be Part of the Revolution?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Start learning Japanese for free today. Beta users get exclusive
              founder discounts when premium features launch.
            </p>

            <div className="mb-8">
              <a
                href="https://discord.gg/2g6BHuaBtD"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#5865F2] via-[#7289da] to-[#5865F2] rounded-xl opacity-75 group-hover:opacity-100 blur-sm transition duration-300 animate-pulse"></div>
                  <div className="relative px-10 py-4 bg-[#5865F2] rounded-xl flex items-center gap-3 transition-all duration-300 transform group-hover:scale-105 shadow-2xl border border-white/10">
                    <svg className="w-7 h-7 transition-transform duration-300 group-hover:rotate-12" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span className="text-xl font-bold text-white tracking-wide">Join Our Discord</span>
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="white" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </a>
              <p className="text-sm text-white/90 mt-5 max-w-lg mx-auto font-medium">
                Connect with fellow learners • Get exclusive updates • Chat with the team
              </p>
            </div>
            <p className="text-lg text-white/90 mt-10 mb-6 max-w-2xl mx-auto">
              What We&apos;re Committing To
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
              <div className="flex items-center gap-2 text-white/90">
                <FaCheckCircle />
                <span>Always Free Tier</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <FaCheckCircle />
                <span>Founder Discounts</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <FaCheckCircle />
                <span>No credit card</span>
              </div>
            </div>

            <p className="text-sm text-white/70 max-w-lg mx-auto">
              Limited founder subscriptions coming soon with exclusive lifetime discounts
              for beta members. Free access will always be available.
            </p>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-[#e30a5f] mb-4">ReBabel</h3>
              <p className="text-sm text-gray-400">
                Building the future of Japanese learning.
              </p>
              <span className="inline-block mt-2 text-xs bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-2 py-1 rounded-full">
                BETA
              </span>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Roadmap
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Curriculum
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 ReBabel. All rights reserved. Currently in beta development.</p>
          </div>
        </div>
      </footer>
    </>
  );
}