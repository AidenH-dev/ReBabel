import Head from 'next/head';
import PublicLayout from '@/components/ui/PublicLayout';

export default function Privacy() {
  return (
    <PublicLayout
      title="Privacy Policy - ReBabel"
      footerColumns={['product-simple', 'support', 'legal']}
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
          content="ReBabel Privacy Policy - Learn how we collect, use, and protect your personal information on our Japanese learning platform."
        />
        <meta
          name="keywords"
          content="privacy policy, data protection, rebabel, japanese learning"
        />
        <meta name="author" content="ReBabel" />
        <meta name="theme-color" content="#e30a5f" />

        <link rel="canonical" href="https://www.rebabel.org/privacy" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rebabel.org/privacy" />
        <meta property="og:title" content="Privacy Policy - ReBabel" />
        <meta
          property="og:description"
          content="Learn how ReBabel collects, uses, and protects your personal information."
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="og:locale" content="en_US" />

        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content="https://rebabel.org/privacy" />
        <meta property="twitter:title" content="Privacy Policy - ReBabel" />
        <meta
          property="twitter:description"
          content="Learn how ReBabel collects, uses, and protects your personal information."
        />
      </Head>

      {/* Header Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">Last updated: February 2025</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Introduction
              </h2>
              <p className="text-gray-600 leading-relaxed">
                ReBabel (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
                committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our Japanese learning platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Information We Collect
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Account information (email address, name)</li>
                <li>Learning progress and study data</li>
                <li>Usage information and preferences</li>
                <li>Communications you send to us</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize your learning experience</li>
                <li>Track your progress and optimize spaced repetition</li>
                <li>Send you updates and communications</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Third-Party Services
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may use third-party services for authentication, analytics,
                and payment processing. These services have their own privacy
                policies governing the use of your information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Your Rights
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of your data</li>
                <li>Request deletion of your account</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact
                us at{' '}
                <a
                  href="mailto:rebabel.development@gmail.com"
                  className="text-brand-pink hover:underline"
                >
                  rebabel.development@gmail.com
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Changes to This Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the &quot;Last updated&quot; date.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
