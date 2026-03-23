import { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';

export default function PrivacyPolicyModal({ isOpen, onClose }) {
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
      title="Privacy Policy"
      className="dusk:bg-[#2a3444] dusk:border-[#3a4556]"
      headerClassName="dusk:bg-[#2a3444] dusk:border-[#3a4556]"
    >
      <div className="p-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1]">
        <p className="text-xs text-gray-500">Last updated: February 2026</p>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Introduction
          </h3>
          <p>
            ReBabel (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
            is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our language learning platform.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Information We Collect
          </h3>
          <p className="mb-2">
            <strong>Account Information:</strong> When you create an account, we
            collect your email address and authentication credentials through
            Auth0.
          </p>
          <p className="mb-2">
            <strong>Learning Data:</strong> We store your learning progress,
            vocabulary decks, lesson completions, and study statistics.
          </p>
          <p className="mb-2">
            <strong>Payment Information:</strong> Payment processing is handled
            by Stripe. We do not store your credit card information directly.
          </p>
          <p>
            <strong>Usage Analytics:</strong> We use PostHog and Google
            Analytics to understand how users interact with our platform.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            How We Use Your Information
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>To provide and maintain our language learning services</li>
            <li>To personalize your learning experience</li>
            <li>To process subscriptions and payments</li>
            <li>To send important account and service updates</li>
            <li>To improve our platform based on usage patterns</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Third-Party Services
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Auth0</strong> - Authentication and identity management
            </li>
            <li>
              <strong>Stripe</strong> - Payment processing
            </li>
            <li>
              <strong>Supabase</strong> - Database and data storage
            </li>
            <li>
              <strong>PostHog</strong> - Product analytics
            </li>
            <li>
              <strong>Google Analytics</strong> - Website analytics
            </li>
            <li>
              <strong>OpenAI</strong> - AI-powered language learning features
            </li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
            Your Rights
          </h3>
          <p>
            You have the right to access, correct, or delete your personal data.
            Contact us at{' '}
            <button
              onClick={copyEmail}
              className="text-brand-pink hover:underline"
            >
              {copiedEmail ? 'Copied!' : 'rebabel.development@gmail.com'}
            </button>{' '}
            to exercise these rights.
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
