import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

const PremiumContext = createContext({
  isPremium: false,
  isLoading: true,
  subscription: null,
  sessionsUsedToday: 0,
  sessionsRemaining: 1,
  dailyLimit: 1,
  canStartSession: true,
  refreshSubscription: () => {},
  refreshSessionCount: () => {},
  incrementSessionCount: () => {},
});

// Daily session limits
const FREE_DAILY_LIMIT = 1;
const PREMIUM_DAILY_LIMIT = 5;

export function PremiumProvider({ children }) {
  const { user, isLoading: userLoading } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionsUsedToday, setSessionsUsedToday] = useState(0);

  const isPremium = subscription?.isPremium || false;
  const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const sessionsRemaining = Math.max(0, dailyLimit - sessionsUsedToday);
  const canStartSession = sessionsRemaining > 0;

  // Fetch subscription status
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/subscriptions/stripe/subscription-status');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch today's session count from user_stats
  const fetchSessionCount = useCallback(async () => {
    if (!user) {
      setSessionsUsedToday(0);
      return;
    }

    try {
      const res = await fetch('/api/analytics/user/sessions/today-count');
      if (res.ok) {
        const data = await res.json();
        setSessionsUsedToday(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch session count:', error);
    }
  }, [user]);

  // Increment local session count (optimistic update)
  const incrementSessionCount = useCallback(() => {
    setSessionsUsedToday(prev => prev + 1);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!userLoading) {
      fetchSubscription();
      fetchSessionCount();
    }
  }, [user, userLoading, fetchSubscription, fetchSessionCount]);

  // Reset session count at midnight (check every minute)
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const lastCheck = localStorage.getItem('lastSessionCountDate');
      const today = now.toDateString();

      if (lastCheck !== today) {
        localStorage.setItem('lastSessionCountDate', today);
        fetchSessionCount();
      }
    };

    checkMidnight();
    const interval = setInterval(checkMidnight, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [fetchSessionCount]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading: isLoading || userLoading,
        subscription,
        sessionsUsedToday,
        sessionsRemaining,
        dailyLimit,
        canStartSession,
        refreshSubscription: fetchSubscription,
        refreshSessionCount: fetchSessionCount,
        incrementSessionCount,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);
