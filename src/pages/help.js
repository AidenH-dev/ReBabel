import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { FaChevronDown } from 'react-icons/fa';
import { FiAlertTriangle } from 'react-icons/fi';
import PublicLayout from '@/components/ui/PublicLayout';

export default function Help() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: 'What is ReBabel?',
      answer:
        'We are a Japanese language learning aid dedicated to developing tools to make studying japanese more efficient and more effective',
    },
    {
      question: 'How do I contact support/report issues?',
      answer: (
        <div>
          <p className="mb-4">
            Use the &quot;Report Issue&quot; button located in the bottom-right
            corner of the app, or email us at{' '}
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
      question: 'What is Spaced Repetition (SRS)?',
      answer: (
        <p>
          Optimal timing to automate practicing vocabulary and grammar right
          before you forget them. Check out our{' '}
          <Link
            href="/study-guide/what-is-srs"
            className="text-brand-pink font-semibold hover:text-brand-pink-hover transition-colors"
          >
            SRS guide
          </Link>{' '}
          to read more.
        </p>
      ),
    },
    {
      question: 'How do I create a custom study set?',
      answer: 'Login > Academy > Create Set',
    },
    {
      question: 'Do I have to pay?',
      answer:
        'No! We are commited to maintaining a robust free tier for all of our users. Our goal will always remain to make learning lanuguages a more accesible experieince.',
    },
    {
      question: 'Will there be a subscriptions?',
      answer:
        'Yes, we plan on adding advanced integrated practice features that will need a subscription to access, but there will always be a free version of out platform.',
    },
  ];

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <PublicLayout
      title="Japanese Learning FAQ – SRS, Study Sets & More | ReBabel"
      footerColumns={['product-simple', 'support', 'community']}
      mainClassName="flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-5"
    >
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta
          name="description"
          content="Answers to common questions about learning Japanese with ReBabel — how SRS works, creating custom study sets, grammar practice, pricing, and getting started."
        />
        <meta
          name="keywords"
          content="japanese learning faq, srs help, spaced repetition questions, study sets, rebabel help"
        />
        <meta name="author" content="ReBabel" />
        <meta name="theme-color" content="#e30a5f" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://www.rebabel.org/help" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rebabel.org/help" />
        <meta
          property="og:title"
          content="Japanese Learning FAQ – SRS, Study Sets & More | ReBabel"
        />
        <meta
          property="og:description"
          content="Answers to common questions about learning Japanese with ReBabel — how SRS works, creating custom study sets, grammar practice, pricing, and getting started."
        />
        <meta
          property="og:image"
          content="https://www.rebabel.org/og-help.png"
        />
        <meta property="og:image:alt" content="ReBabel Help & FAQ" />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://rebabel.org/help" />
        <meta
          property="twitter:title"
          content="Japanese Learning FAQ – SRS, Study Sets & More | ReBabel"
        />
        <meta
          property="twitter:description"
          content="Answers to common questions about learning Japanese with ReBabel — how SRS works, creating custom study sets, grammar practice, pricing, and getting started."
        />
        <meta
          property="twitter:image"
          content="https://www.rebabel.org/og-help.png"
        />

        {/* JSON-LD Structured Data for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is ReBabel?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We are a Japanese language learning aid dedicated to developing tools to make studying japanese more efficient and more effective',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I contact support/report issues?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Use the "Report Issue" button located in the bottom-right corner of the app, or email us at rebabel.development@gmail.com',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What is Spaced Repetition (SRS)?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Optimal timing to automate practicing vocabulary and grammar right before you forget them. Check out our SRS guide to read more.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I create a custom study set?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Login > Academy > Create Set',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Do I have to pay?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No! We are commited to maintaining a robust free tier for all of our users. Our goal will always remain to make learning lanuguages a more accesible experieince.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Will there be a subscriptions?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, we plan on adding advanced integrated practice features that will need a subscription to access, but there will always be a free version of out platform.',
                  },
                },
              ],
            }),
          }}
        />
      </Head>

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
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-brand-pink/30 transition-colors"
              >
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors duration-200"
                >
                  <dt className="text-lg font-semibold text-gray-900 text-left">
                    {faq.question}
                  </dt>
                  <FaChevronDown
                    className={`flex-shrink-0 text-brand-pink transition-transform duration-300 ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Answer - Animated */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedIndex === index ? 'max-h-full' : 'max-h-0'
                  }`}
                >
                  <dd className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-white border-t border-gray-200">
                    {typeof faq.answer === 'string' ? (
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    ) : (
                      <div className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 bg-gradient-to-r from-brand-pink to-brand-pink-hover">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Use the &quot;Report Issue&quot; button in the app or reach out to
            us at{' '}
            <span className="font-semibold">rebabel.development@gmail.com</span>
          </p>
          <Link href="/">
            <Button variant="white-solid" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
