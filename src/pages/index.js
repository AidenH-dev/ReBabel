import Script from "next/script";
import Head from "next/head";
import Image from "next/image";
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
  FaLightbulb,
  FaGraduationCap,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { MdTranslate } from "react-icons/md";

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
          <title>ReBabel - Master Japanese with Science-Based Learning</title>
          <meta
            name="description"
            content="Be among the first to experience the future of Japanese learning. Join our early access program and help shape the most effective language learning platform."
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
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-24 md:pb-24">
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
                  We&apos;re building the most effective Japanese learning platform using 
                  spaced repetition and adaptive AI. Be part of our journey from day one.
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
                      <strong>Free</strong> Access Forever
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

        {/* What We're Building Section (Replaces Stats) */}
        <section className="w-full bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                What We&apos;re Building
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Join us in creating the most comprehensive Japanese learning platform
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#e30a5f]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaGraduationCap className="text-2xl text-[#e30a5f]" />
                </div>
                <div className="text-sm font-semibold mb-1">Complete Curriculum</div>
                <div className="text-xs text-gray-400">From Hiragana to N1</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#e30a5f]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaBrain className="text-2xl text-[#e30a5f]" />
                </div>
                <div className="text-sm font-semibold mb-1">Smart SRS</div>
                <div className="text-xs text-gray-400">Science-based retention</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#e30a5f]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdTranslate className="text-2xl text-[#e30a5f]" />
                </div>
                <div className="text-sm font-semibold mb-1">All Skills</div>
                <div className="text-xs text-gray-400">Reading, writing, speaking</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#e30a5f]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaChartLine className="text-2xl text-[#e30a5f]" />
                </div>
                <div className="text-sm font-semibold mb-1">Track Progress</div>
                <div className="text-xs text-gray-400">Detailed analytics</div>
              </div>
            </div>

            {/* Pricing Preview */}
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
        </section>

        {/* Features Section */}
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
              {/* Feature 1 */}
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
        </section>

        {/* Beta Benefits Section (Replaces Testimonials) */}
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
        </section>

        {/* CTA Section with Email Capture */}
        <section className="w-full py-20 bg-gradient-to-r from-[#e30a5f] to-[#f41567]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Be Part of the Revolution?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Start learning Japanese for free today. Beta users get exclusive 
              founder discounts when premium features launch.
            </p>

            {!submitted ? (
              <form onSubmit={handleEarlyAccess} className="max-w-md mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-[#e30a5f] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Join Beta
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto mb-8 border-2 border-white/30">
                <p className="text-white font-semibold">
                  🎉 Thank you! We&apos;ll be in touch soon with your beta access.
                </p>
              </div>
            )}

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
            <p>&copy; 2024 ReBabel. All rights reserved. Currently in beta development.</p>
          </div>
        </div>
      </footer>
    </>
  );
}