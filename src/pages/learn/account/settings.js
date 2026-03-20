import Head from 'next/head';
import MainSidebar from '../../../components/Sidebars/MainSidebar';
import { useEffect, useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {
  FiMail,
  FiUser,
  FiKey,
  FiCreditCard,
  FiLogOut,
  FiLoader,
  FiCheck,
  FiExternalLink,
  FiSun,
  FiMoon,
  FiMonitor,
  FiX,
  FiAlertCircle,
  FiBell,
  FiEdit2,
} from 'react-icons/fi';
import { TbSunset2, TbCoffee } from 'react-icons/tb';
import { useTheme } from '../../../contexts/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameEditing, setUsernameEditing] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(null); // 'success' | 'error' | null
  const [pushError, setPushError] = useState(null);

  const copyEmail = async () => {
    await navigator.clipboard.writeText('rebabel.development@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const themeOptions = [
    { value: 'system', label: 'System', icon: FiMonitor },
    { value: 'light', label: 'Light', icon: FiSun },
    { value: 'dark', label: 'Dark', icon: FiMoon },
    { value: 'cream', label: 'Cream', icon: TbCoffee },
    { value: 'dusk', label: 'Dusk', icon: TbSunset2 },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubscription = async () => {
      try {
        const res = await fetch(
          '/api/subscriptions/stripe/subscription-status'
        );
        const data = await res.json();
        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    const fetchUsername = async () => {
      try {
        const res = await fetch('/api/database/v2/user/username');
        const data = await res.json();
        if (data.username) {
          setUsername(data.username);
          setUsernameInput(data.username);
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };

    fetchUserProfile();
    fetchSubscription();
    fetchUsername();

    // Check if running in Capacitor native app
    const checkNativeApp = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          setIsNativeApp(true);
        }
      } catch {
        // Not in Capacitor environment
      }
    };
    checkNativeApp();
  }, []);

  const handleUsernameSave = async () => {
    const trimmed = usernameInput.trim();
    if (trimmed === username) {
      setUsernameEditing(false);
      return;
    }

    setUsernameSaving(true);
    setUsernameError(null);

    try {
      const res = await fetch('/api/database/v2/user/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setUsernameError(data.error || 'Failed to update username');
        return;
      }

      setUsername(data.username);
      setUsernameInput(data.username);
      setUsernameEditing(false);
    } catch (error) {
      console.error('Username update error:', error);
      setUsernameError('Something went wrong. Please try again.');
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleUsernameCancel = () => {
    setUsernameInput(username);
    setUsernameEditing(false);
    setUsernameError(null);
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
      });
      if (res.ok) {
        setResetSent(true);
      }
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/subscriptions/stripe/customer-portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    setPushStatus(null);
    setPushError(null);

    try {
      const { PushNotifications } =
        await import('@capacitor/push-notifications');

      // Request permission if needed
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        setPushStatus('error');
        setPushError('Push notification permission denied');
        setPushLoading(false);
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Wait for registration token
      const tokenPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Registration timeout')),
          10000
        );

        PushNotifications.addListener('registration', (token) => {
          clearTimeout(timeout);
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      const token = await tokenPromise;
      setPushToken(token);

      // Send test notification via our API
      const res = await fetch('/api/push/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceToken: token }),
      });

      const data = await res.json();

      if (res.ok) {
        setPushStatus('success');

        // Register token for future notifications
        try {
          await fetch('/api/push/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceToken: token, platform: 'ios' }),
          });
        } catch (regError) {
          console.error('Failed to register token:', regError);
        }
      } else {
        setPushStatus('error');
        setPushError(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Push test error:', error);
      setPushStatus('error');
      setPushError(error.message || 'Failed to test push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25] dusk:bg-[#1e2530]">
      <MainSidebar />

      <main className="ml-auto flex-1 overflow-y-auto md:flex md:items-center md:justify-center">
        <Head>
          <title>Settings - ReBabel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="px-4 pt-[max(1.5rem,var(--cap-safe-top))] md:pt-0 md:p-6 pb-8 md:w-full">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-6">
              Settings
            </h1>

            <div className="bg-white dark:bg-[#1c2b35] dusk:bg-[#2a3444] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 dusk:border-[#3a4556] divide-y divide-gray-200 dark:divide-gray-700 dusk:divide-[#3a4556]">
              {loading ? (
                /* Skeleton loading state */
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] animate-pulse flex-shrink-0"
                          style={{ animationDelay: `${i * 75}ms` }}
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div
                            className="h-3.5 w-16 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                            style={{ animationDelay: `${i * 75 + 25}ms` }}
                          />
                          <div
                            className="h-4 w-40 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                            style={{ animationDelay: `${i * 75 + 50}ms` }}
                          />
                        </div>
                        {/* Username row: small icon placeholder; Theme row: no button; others: button */}
                        {i === 2 ? (
                          <div
                            className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] animate-pulse flex-shrink-0"
                            style={{ animationDelay: `${i * 75 + 75}ms` }}
                          />
                        ) : (
                          i !== 4 && (
                            <div
                              className="h-9 w-24 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] animate-pulse flex-shrink-0"
                              style={{ animationDelay: `${i * 75 + 75}ms` }}
                            />
                          )
                        )}
                      </div>
                      {i === 4 && (
                        <div className="mt-3 ml-13 flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((j) => (
                            <div
                              key={j}
                              className="h-9 w-20 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                              style={{ animationDelay: `${j * 50 + 300}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Email Section */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 dusk:bg-[#171c26] flex items-center justify-center flex-shrink-0">
                        <FiMail className="text-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          Email
                        </p>
                        <p className="text-gray-900 dark:text-white dusk:text-[#e8e0d8] truncate">
                          {userProfile?.email || 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Username Section */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 dusk:bg-[#171c26] flex items-center justify-center flex-shrink-0">
                        <FiUser className="text-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          Username
                        </p>
                        {usernameEditing ? (
                          <input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => {
                              setUsernameInput(e.target.value);
                              setUsernameError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUsernameSave();
                              if (e.key === 'Escape') handleUsernameCancel();
                            }}
                            placeholder="Enter a username"
                            maxLength={15}
                            autoFocus
                            className="w-full h-6 p-0 bg-transparent text-base leading-6 text-gray-900 dark:text-white dusk:text-[#e8e0d8] border-b border-[#e30a5f] rounded-none focus:outline-none"
                          />
                        ) : (
                          <p className="h-6 leading-6 text-gray-900 dark:text-white dusk:text-[#e8e0d8] truncate">
                            {username || (
                              <span className="text-gray-400 dark:text-gray-500 dusk:text-[#a8b2c1]/50">
                                Not set
                              </span>
                            )}
                          </p>
                        )}
                        {usernameError && (
                          <p className="mt-1 text-xs text-red-500">
                            {usernameError}
                          </p>
                        )}
                      </div>
                      {usernameEditing ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={handleUsernameCancel}
                            disabled={usernameSaving}
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1] hover:bg-gray-100 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors disabled:opacity-50"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleUsernameSave}
                            disabled={usernameSaving || !usernameInput.trim()}
                            className="p-2 rounded-lg text-[#e30a5f] hover:bg-[#e30a5f]/10 transition-colors disabled:opacity-50"
                          >
                            {usernameSaving ? (
                              <FiLoader className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUsernameEditing(true)}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1] hover:bg-gray-100 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors flex-shrink-0"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 dusk:bg-[#171c26] flex items-center justify-center flex-shrink-0">
                        <FiKey className="text-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          Password
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          {resetSent
                            ? 'Check your email for reset link'
                            : 'Send a password reset email'}
                        </p>
                      </div>
                      <button
                        onClick={handleResetPassword}
                        disabled={resetLoading || resetSent}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                          resetSent
                            ? 'border-green-500 text-green-600 dark:text-green-400'
                            : 'border-gray-300 dark:border-gray-600 dusk:border-[#3a4556] text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26]'
                        }`}
                      >
                        {resetLoading ? (
                          <FiLoader className="text-sm animate-spin" />
                        ) : resetSent ? (
                          <FiCheck className="text-sm" />
                        ) : (
                          <FiKey className="text-sm" />
                        )}
                        {resetSent ? 'Email Sent' : 'Reset Password'}
                      </button>
                    </div>
                  </div>

                  {/* Subscription Section - Only show for premium users */}
                  {subscription?.isPremium && (
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 dusk:bg-[#171c26] flex items-center justify-center flex-shrink-0">
                          <FiCreditCard className="text-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1]">
                            Subscription
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]">
                            Manage billing & plan
                          </p>
                        </div>
                        <button
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 dusk:border-[#3a4556] text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors disabled:opacity-50"
                        >
                          {portalLoading ? (
                            <FiLoader className="text-sm animate-spin" />
                          ) : (
                            <FiExternalLink className="text-sm" />
                          )}
                          Manage
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Theme Section */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 dusk:bg-[#171c26] flex items-center justify-center flex-shrink-0">
                        <FiSun className="text-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          Appearance
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          Choose your preferred theme
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 ml-13 flex flex-wrap gap-2">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = theme === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              isActive
                                ? 'border-[#e30a5f] bg-[#e30a5f]/10 text-[#e30a5f]'
                                : 'border-gray-300 dark:border-gray-600 dusk:border-[#3a4556] text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26]'
                            }`}
                          >
                            <Icon className="text-sm" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Push Notifications Test Section - Only show in native app
              {isNativeApp && (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 dusk:bg-[#171c26] flex items-center justify-center flex-shrink-0">
                      <FiBell className="text-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1]">
                        Push Notifications
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]">
                        {pushStatus === 'success'
                          ? 'Test notification sent!'
                          : pushStatus === 'error'
                          ? pushError
                          : 'Test push notification delivery'}
                      </p>
                    </div>
                    <button
                      onClick={handleTestPush}
                      disabled={pushLoading}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                        pushStatus === 'success'
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : pushStatus === 'error'
                          ? "border-red-500 text-red-600 dark:text-red-400"
                          : "border-gray-300 dark:border-gray-600 dusk:border-[#3a4556] text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26]"
                      }`}
                    >
                      {pushLoading ? (
                        <FiLoader className="text-sm animate-spin" />
                      ) : pushStatus === 'success' ? (
                        <FiCheck className="text-sm" />
                      ) : (
                        <FiBell className="text-sm" />
                      )}
                      {pushLoading ? 'Sending...' : pushStatus === 'success' ? 'Sent!' : 'Test'}
                    </button>
                  </div>
                </div>
              )}*/}

                  {/* Sign Out Section */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 dusk:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                        <FiLogOut className="text-lg text-red-500 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          Sign Out
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1]">
                          Log out of your account
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          (window.location.href = '/api/auth/logout')
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                      >
                        <FiLogOut className="text-sm" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Links - Small text below card */}
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-500 dusk:text-[#a8b2c1]/60 flex-wrap">
              <button
                onClick={() => setShowContact(true)}
                className="hover:text-gray-700 dark:hover:text-gray-300 dusk:hover:text-[#e8e0d8] transition-colors"
              >
                Contact
              </button>
              <span>·</span>
              <button
                onClick={() => setShowPrivacy(true)}
                className="hover:text-gray-700 dark:hover:text-gray-300 dusk:hover:text-[#e8e0d8] transition-colors"
              >
                Privacy
              </button>
              <span>·</span>
              <button
                onClick={() => setShowTerms(true)}
                className="hover:text-gray-700 dark:hover:text-gray-300 dusk:hover:text-[#e8e0d8] transition-colors"
              >
                Terms
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Modal */}
      {showContact && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowContact(false)}
        >
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#1c2b35] dusk:bg-[#2a3444] shadow-2xl border border-black/5 dark:border-white/10 dusk:border-[#3a4556]">
            <div className="p-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white dusk:text-[#e8e0d8]">
                Contact Us
              </h2>
              <button
                onClick={() => setShowContact(false)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1] hover:bg-gray-100 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1]">
              <p>
                Need help or have feedback? We&apos;d love to hear from you.
              </p>
              <div className="space-y-2">
                <button
                  onClick={copyEmail}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dusk:border-[#3a4556] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors text-left"
                >
                  <FiMail className="text-[#e30a5f]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white dusk:text-[#e8e0d8] text-sm">
                      Email
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {copiedEmail
                        ? 'Copied to clipboard!'
                        : 'rebabel.development@gmail.com'}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowContact(false);
                    window.dispatchEvent(new Event('open-report-issue'));
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dusk:border-[#3a4556] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors text-left"
                >
                  <FiAlertCircle className="text-[#e30a5f]" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white dusk:text-[#e8e0d8] text-sm">
                      Report an Issue
                    </p>
                    <p className="text-xs text-gray-500">
                      Found a bug? Let us know
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowPrivacy(false)}
        >
          <div className="w-full max-w-2xl max-h-[80vh] rounded-xl bg-white dark:bg-[#1c2b35] dusk:bg-[#2a3444] shadow-2xl border border-black/5 dark:border-white/10 dusk:border-[#3a4556] flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-[#1c2b35] dusk:bg-[#2a3444] border-b border-black/5 dark:border-white/10 dusk:border-[#3a4556] p-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white dusk:text-[#e8e0d8]">
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1] hover:bg-gray-100 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1]">
              <p className="text-xs text-gray-500">
                Last updated: February 2026
              </p>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  Introduction
                </h3>
                <p>
                  ReBabel (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or
                  &ldquo;us&rdquo;) is committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose,
                  and safeguard your information when you use our language
                  learning platform.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  Information We Collect
                </h3>
                <p className="mb-2">
                  <strong>Account Information:</strong> When you create an
                  account, we collect your email address and authentication
                  credentials through Auth0.
                </p>
                <p className="mb-2">
                  <strong>Learning Data:</strong> We store your learning
                  progress, vocabulary decks, lesson completions, and study
                  statistics.
                </p>
                <p className="mb-2">
                  <strong>Payment Information:</strong> Payment processing is
                  handled by Stripe. We do not store your credit card
                  information directly.
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
                  <li>
                    To provide and maintain our language learning services
                  </li>
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
                    <strong>Auth0</strong> - Authentication and identity
                    management
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
                    <strong>OpenAI</strong> - AI-powered language learning
                    features
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  Your Rights
                </h3>
                <p>
                  You have the right to access, correct, or delete your personal
                  data. Contact us at{' '}
                  <button
                    onClick={copyEmail}
                    className="text-[#e30a5f] hover:underline"
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
                    className="text-[#e30a5f] hover:underline"
                  >
                    {copiedEmail ? 'Copied!' : 'rebabel.development@gmail.com'}
                  </button>
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowTerms(false)}
        >
          <div className="w-full max-w-2xl max-h-[80vh] rounded-xl bg-white dark:bg-[#1c2b35] dusk:bg-[#2a3444] shadow-2xl border border-black/5 dark:border-white/10 dusk:border-[#3a4556] flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-[#1c2b35] dusk:bg-[#2a3444] border-b border-black/5 dark:border-white/10 dusk:border-[#3a4556] p-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white dusk:text-[#e8e0d8]">
                Terms of Service
              </h2>
              <button
                onClick={() => setShowTerms(false)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 dusk:text-[#a8b2c1] hover:bg-gray-100 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1]">
              <p className="text-xs text-gray-500">
                Last updated: February 2026
              </p>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  Agreement to Terms
                </h3>
                <p>
                  By accessing or using ReBabel, you agree to be bound by these
                  Terms of Service. If you do not agree to these terms, please
                  do not use our service.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  Description of Service
                </h3>
                <p>
                  ReBabel is a language learning platform that provides
                  educational content, vocabulary training, AI-powered tutoring,
                  and learning tools.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  User Accounts
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>
                    Accept responsibility for all activities under your account
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  Subscriptions and Payments
                </h3>
                <p className="mb-2">
                  ReBabel offers both free and premium subscription options.
                  Premium subscriptions are billed on a recurring basis through
                  Stripe.
                </p>
                <p className="mb-2">
                  <strong>Cancellation:</strong> You may cancel your
                  subscription at any time. Cancellation takes effect at the end
                  of your current billing period.
                </p>
                <p>
                  <strong>Refunds:</strong> Contact{' '}
                  <button
                    onClick={copyEmail}
                    className="text-[#e30a5f] hover:underline"
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
                  <li>
                    Do not copy or distribute our content without permission
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  AI Features
                </h3>
                <p>
                  ReBabel uses artificial intelligence for language learning
                  assistance. While we strive for accuracy, AI-generated content
                  may contain errors. The AI tutor supplements, not replaces,
                  traditional learning methods.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white dusk:text-[#e8e0d8] mb-2">
                  Disclaimer
                </h3>
                <p>
                  ReBabel is provided &ldquo;as is&rdquo; without warranties of
                  any kind. We do not guarantee uninterrupted service or
                  specific learning outcomes.
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
                    className="text-[#e30a5f] hover:underline"
                  >
                    {copiedEmail ? 'Copied!' : 'rebabel.development@gmail.com'}
                  </button>
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
