import Script from "next/script";
import Head from "next/head";
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
} from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { MdTranslate } from "react-icons/md";

export default function Home() {
  const animationsRef = useRef(null);
  const router = useRouter();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handleSignup = () => {
    router.push("/api/auth/login");
  };

  // Testimonials data
  const testimonials = [
    {
      quote:
        "ReBabel's spaced repetition system helped me remember vocabulary 3x faster than traditional methods.",
      author: "Sarah Chen",
      role: "N3 Level Student",
      rating: 5,
    },
    {
      quote:
        "The adaptive learning system knows exactly what I need to practice. It's like having a personal tutor!",
      author: "Michael Torres",
      role: "Business Professional",
      rating: 5,
    },
    {
      quote:
        "I passed my JLPT N4 exam after just 6 months of using ReBabel. The progress tracking kept me motivated!",
      author: "Emma Wilson",
      role: "University Student",
      rating: 5,
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Simple Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#e30a5f]">ReBabel</span>
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
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-5">
        <Head>
          <title>ReBabel - Master Japanese with Science-Based Learning</title>
          <meta
            name="description"
            content="Learn Japanese effectively with spaced repetition, adaptive learning, and comprehensive progress tracking. Join thousands mastering Japanese the smart way."
          />
          <link rel="icon" href="/favicon.ico" />
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
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[#e30a5f]/10 text-[#e30a5f] px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <FaRocket className="text-xs" />
                  <span>科学的に証明された学習方法</span>
                  <span className="text-xs">• Science-Based</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Master Japanese with
                  <span className="text-[#e30a5f] block mt-2">
                    Intelligent Learning
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                  From hiragana to advanced kanji, our adaptive system
                  personalizes your journey. Join{" "}
                  <span className="font-semibold text-gray-900">5,000+</span>{" "}
                  learners achieving fluency faster.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <div className="relative inline-block">
                    <div className="absolute inset-x-0 bottom-0 bg-[#B0104F] rounded-lg translate-y-1 h-[90%]"></div>
                    <button
                      onClick={handleSignup}
                      className="relative px-8 py-3 text-lg text-white bg-[#E30B5C] hover:bg-[#f41567] font-semibold rounded-lg transform transition-all duration-200 active:translate-y-1 w-full sm:w-auto"
                    >
                      Start Learning Free
                    </button>
                  </div>

                  <button className="px-8 py-3 text-lg text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 font-medium rounded-lg transition-colors">
                    Watch Demo
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-8 mt-8 justify-center lg:justify-start">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      <strong>5,000+</strong> Active Learners
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-sm" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      <strong>4.9</strong> Rating
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="relative">
                <div className="relative z-10">
                  <img
                    src="/LPI.png"
                    alt="ReBabel Learning Platform"
                    className="w-full max-w-[600px] mx-auto rounded-2xl shadow-2xl"
                  />
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#e30a5f]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#e30a5f] mb-2">
                  2,300+
                </div>
                <div className="text-sm text-gray-400">Vocabulary Words</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#e30a5f] mb-2">
                  180+
                </div>
                <div className="text-sm text-gray-400">Grammar Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#e30a5f] mb-2">
                  317
                </div>
                <div className="text-sm text-gray-400">Essential Kanji</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#e30a5f] mb-2">
                  92%
                </div>
                <div className="text-sm text-gray-400">Pass Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why ReBabel Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our platform combines cognitive science with modern technology
                to create the most effective Japanese learning experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center text-white mb-4">
                  <FaBrain className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Spaced Repetition System
                </h3>
                <p className="text-gray-600 mb-4">
                  Our intelligent algorithm shows you cards at optimal
                  intervals, proven to increase retention by 200%.
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

              {/* Feature 2 */}
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

              {/* Feature 3 */}
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
        </section>

        {/* Learning Path Section */}
        <section className="w-full py-20 bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Your Path to Fluency
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From absolute beginner to advanced speaker, we guide you every
                step of the way.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  level: "Beginner",
                  desc: "Hiragana & Katakana",
                  lessons: "12 lessons",
                  color: "from-green-400 to-green-600",
                },
                {
                  level: "Elementary",
                  desc: "Basic Grammar & Vocab",
                  lessons: "24 lessons",
                  color: "from-blue-400 to-blue-600",
                },
                {
                  level: "Intermediate",
                  desc: "Complex Sentences",
                  lessons: "36 lessons",
                  color: "from-purple-400 to-purple-600",
                },
                {
                  level: "Advanced",
                  desc: "Native-like Fluency",
                  lessons: "48+ lessons",
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
                    <span className="text-xs text-gray-500">
                      {stage.lessons}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Loved by Learners Worldwide
              </h2>
            </div>

            <div className="relative bg-gray-50 rounded-2xl p-8 md:p-12">
              <FaQuoteLeft className="text-4xl text-[#e30a5f]/20 mb-6" />

              <div className="min-h-[150px]">
                <p className="text-lg md:text-xl text-gray-700 italic mb-6">
                  &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonials[currentTestimonial].author}
                    </p>
                    <p className="text-sm text-gray-600">
                      {testimonials[currentTestimonial].role}
                    </p>
                  </div>
                  <div className="flex text-yellow-400">
                    {[
                      ...Array(testimonials[currentTestimonial].rating),
                    ].map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial
                        ? "w-8 bg-[#e30a5f]"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-gradient-to-r from-[#e30a5f] to-[#f41567]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Japanese Journey?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of successful learners. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSignup}
                className="px-8 py-3 bg-white text-[#e30a5f] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Learning Free
              </button>
              <button className="px-8 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors border-2 border-white/50">
                View Curriculum
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="flex items-center gap-2 text-white/90">
                <FaCheckCircle />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <FaCheckCircle />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <FaCheckCircle />
                <span>Cancel anytime</span>
              </div>
            </div>
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
                Master Japanese with intelligent, adaptive learning.
              </p>
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
                    Pricing
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
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
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
            <p>&copy; 2024 ReBabel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
