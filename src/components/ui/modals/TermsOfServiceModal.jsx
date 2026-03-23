import { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';

export default function TermsOfServiceModal({ isOpen, onClose }) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText('rebabel.development@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      zIndex={60}
      maxHeight="80vh"
      scrollable={true}
      stickyHeader={true}
      title="Terms of Service"
      className="dusk:bg-[#2a3444] dusk:border-[#3a4556]"
      headerClassName="dusk:bg-[#2a3444] dusk:border-[#3a4556]"
    >
      <div className="p-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1]">
        <p className="text-xs text-gray-500">Last updated: February 2026</p>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Agreement to Terms
          </h3>
          <p>
            By accessing or using ReBabel, you agree to be bound by these Terms
            of Service. If you do not agree to these terms, please do not use
            our service.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Description of Service
          </h3>
          <p>
            ReBabel is a language learning platform that provides educational
            content, vocabulary training, AI-powered tutoring, and learning
            tools.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            User Accounts
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Subscriptions and Payments
          </h3>
          <p className="mb-2">
            ReBabel offers both free and premium subscription options. Premium
            subscriptions are billed on a recurring basis through Stripe.
          </p>
          <p className="mb-2">
            <strong>Cancellation:</strong> You may cancel your subscription at
            any time. Cancellation takes effect at the end of your current
            billing period.
          </p>
          <p>
            <strong>Refunds:</strong> Contact{' '}
            <button
              onClick={copyEmail}
              className="text-brand-pink hover:underline"
            >
              {copiedEmail ? 'Copied!' : 'rebabel.development@gmail.com'}
            </button>{' '}
            for refund requests.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Acceptable Use
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Do not use the service for any unlawful purpose</li>
            <li>Do not share your account credentials</li>
            <li>Do not attempt to circumvent security features</li>
            <li>Do not copy or distribute our content without permission</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            AI Features
          </h3>
          <p>
            ReBabel uses artificial intelligence for language learning
            assistance. While we strive for accuracy, AI-generated content may
            contain errors. The AI tutor supplements, not replaces, traditional
            learning methods.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Disclaimer
          </h3>
          <p>
            ReBabel is provided &ldquo;as is&rdquo; without warranties of any
            kind. We do not guarantee uninterrupted service or specific learning
            outcomes.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Contact Us
          </h3>
          <p>
            Questions? Email us at{' '}
            <button
              onClick={copyEmail}
              className="text-brand-pink hover:underline"
            >
              {copiedEmail ? 'Copied!' : 'rebabel.development@gmail.com'}
            </button>
          </p>
        </section>
      </div>
    </BaseModal>
  );
}
