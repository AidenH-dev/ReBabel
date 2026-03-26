import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import { LuListStart } from 'react-icons/lu';

export default function MobileBackBubble() {
  const router = useRouter();
  const { user } = useUser();

  if (!user) return null;

  return (
    <button
      onClick={() => router.push('/learn/academy/resources')}
      className="lg:hidden fixed bottom-6 left-6 z-[60] flex items-center justify-center w-15 h-15 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink shadow-lg"
      aria-label="Back to resources"
    >
      <LuListStart className="w-6.5 h-6.5 text-gray-700 dark:text-gray-300" />
    </button>
  );
}
