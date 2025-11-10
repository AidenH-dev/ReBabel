import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

export default function Help() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: "What is ReBabel?",
      answer:
        "We are a Japanese language learning aid dedicated to developing tools to make studying japanese more efficient and more effective",
    },
    {
      question: "How do I contact support/report issues?",
      answer: (
        <div>
          <p className="mb-4">
            Use the &quot;Report Issue&quot; button located in the bottom-right corner of the app, or email us at{" "}
            <span className="font-semibold">rebabel.development@gmail.com</span>
          </p>
          <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg">
            <button className="group flex items-center rounded-full bg-red-600/20 backdrop-blur-sm border-2 border-red-600/60 px-3 py-2 text-red-600 shadow-lg transition-all hover:bg-red-600/30 hover:border-red-500">
              <FiAlertTriangle className="w-5 h-5flex-shrink-0" />
              <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:ml-2 group-hover:max-w-xs font-medium text-sm">
                Report Issue
              </span>
            </button>
          </div>
        </div>
      ),
    },
    {
      question: "What is Spaced Repetition (SRS)?",
      answer: (
        <p>
          Optimal timing to automate practicing vocabulary and grammar right before you forget them. Check out our{" "}
          <Link href="/blog" className="text-[#e30a5f] font-semibold hover:text-[#f41567] transition-colors">
            blog
          </Link>
          {" "}to read more.
        </p>
      ),
    },
    {
      question: "How do I create a custom study set?",
      answer: "Login > Academy > Create Set",
    },
    {
      question: "Do I have to pay?",
      answer:
        "No! We are commited to maintaining a robust free tier for all of our users. Our goal will always remain to make learning lanuguages a more accesible experieince.",
    },
    {
      question: "Will there be a subscriptions?",
      answer:
        "Yes, we plan on adding advanced integrated practice features that will need a subscription to access, but there will always be a free version of out platform.",
    },
  ];

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <>
      <Head>
        <title>Help & FAQ - ReBabel</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta
          name="description"
          content="Get help with ReBabel - answers to frequently asked questions about our Japanese learning platform, features, pricing, and support."
        />
        <meta name="keywords" content="help, faq, japanese learning, support, rebabel" />
        <meta name="author" content="ReBabel" />
        <meta name="theme-color" content="#e30a5f" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://rebabel.org/help" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rebabel.org/help" />
        <meta property="og:title" content="Help & FAQ - ReBabel" />
        <meta
          property="og:description"
          content="Get help with ReBabel - answers to frequently asked questions about our Japanese learning platform."
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content="https://rebabel.org/help" />
        <meta property="twitter:title" content="Help & FAQ - ReBabel" />
        <meta
          property="twitter:description"
          content="Get help with ReBabel - answers to frequently asked questions about our Japanese learning platform."
        />

        {/* JSON-LD Structured Data for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is ReBabel?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "We are a Japanese language learning aid dedicated to developing tools to make studying japanese more efficient and more effective",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I contact support/report issues?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: 'Use the "Report Issue" button located in the bottom-right corner of the app, or email us at rebabel.development@gmail.com',
                  },
                },
                {
                  "@type": "Question",
                  name: "What is Spaced Repetition (SRS)?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Optimal timing to automate practicing vocabulary and grammar right before you forget them. Check out our blog to read more.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I create a custom study set?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Login > Academy > Create Set",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I have to pay?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No! We are commited to maintaining a robust free tier for all of our users. Our goal will always remain to make learning lanuguages a more accesible experieince.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Will there be a subscriptions?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, we plan on adding advanced integrated practice features that will need a subscription to access, but there will always be a free version of out platform.",
                  },
                },
              ],
            }),
          }}
        />
      </Head>

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <span className="text-2xl font-bold text-[#e30a5f] cursor-pointer">
                ReBabel
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/api/auth/login">
                <button className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/api/auth/login">
                <button className="px-4 py-2 text-sm bg-[#e30a5f] hover:bg-[#f41567] text-white font-medium rounded-lg transition-colors">
                  Join
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-5">
        {/* Header Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Help & FAQ
            </h1>
            <p className="text-lg text-gray-600">
              Find answers to common questions about ReBabel
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-3xl mx-auto">
            <dl className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-[#e30a5f]/30 transition-colors"
                >
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <dt className="text-lg font-semibold text-gray-900 text-left">
                      {faq.question}
                    </dt>
                    <FaChevronDown
                      className={`flex-shrink-0 text-[#e30a5f] transition-transform duration-300 ${
                        expandedIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Answer - Animated */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedIndex === index
                        ? "max-h-full"
                        : "max-h-0"
                    }`}
                  >
                    <dd className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-white border-t border-gray-200">
                      {typeof faq.answer === "string" ? (
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      ) : (
                        <div className="text-gray-700 leading-relaxed">{faq.answer}</div>
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 bg-gradient-to-r from-[#e30a5f] to-[#f41567]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Use the &quot;Report Issue&quot; button in the app or reach out to us at{" "}
              <span className="font-semibold">rebabel.development@gmail.com</span>
            </p>
            <Link href="/">
              <button className="px-8 py-3 bg-white text-[#e30a5f] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Back to Home
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#e30a5f] mb-4">ReBabel</h3>
              <p className="text-sm text-gray-400">
                Building the future of Japanese learning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help & FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="https://discord.gg/2g6BHuaBtD"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 ReBabel. All rights reserved. Currently in beta development.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
