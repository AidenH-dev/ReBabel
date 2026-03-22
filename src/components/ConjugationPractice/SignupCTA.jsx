import { useRouter } from 'next/router';
import { FaCheckCircle } from 'react-icons/fa';

export default function SignupCTA({ compact = false }) {
  const router = useRouter();

  return (
    <div
      className={`${compact ? 'p-4' : 'p-6 sm:p-8'} rounded-2xl bg-gradient-to-br from-brand-pink/5 to-brand-pink/10 dark:from-brand-pink/10 dark:to-brand-pink/5 border border-brand-pink/20`}
    >
      <h3
        className={`${compact ? 'text-base' : 'text-lg sm:text-xl'} font-bold text-gray-900 dark:text-white mb-2`}
      >
        Practice with your own vocabulary
      </h3>
      <p
        className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-300 mb-4`}
      >
        Create a free account to upload your own vocabulary sets and practice
        conjugation with the exact words from your class, textbook, or personal
        study list.
      </p>
      <ul
        className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-300 space-y-1.5 mb-4`}
      >
        {[
          'Upload custom vocabulary from any class or textbook',
          'Practice conjugation with your own word lists',
          'SRS flashcard system to retain what you learn',
          'AI-powered translation practice',
          'Track your study progress over time',
        ].map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <FaCheckCircle
              className="text-brand-pink flex-shrink-0"
              size={12}
            />
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={() => router.push('/api/auth/login')}
        className="w-full sm:w-auto px-6 py-2.5 bg-brand-pink hover:bg-brand-pink-hover text-white font-medium rounded-lg transition-colors text-sm"
      >
        Create Free Account
      </button>
    </div>
  );
}
