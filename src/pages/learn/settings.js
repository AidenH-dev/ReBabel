import Head from "next/head";
import MainSidebar from "../../components/Sidebars/MainSidebar";
import { useEffect, useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { FiMail, FiKey, FiCreditCard, FiLogOut, FiLoader, FiCheck, FiExternalLink, FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const themeOptions = [
    { value: 'system', label: 'System', icon: FiMonitor },
    { value: 'light', label: 'Light', icon: FiSun },
    { value: 'dark', label: 'Dark', icon: FiMoon },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/subscriptions/stripe/subscription-status");
        const data = await res.json();
        setSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchUserProfile();
    fetchSubscription();
  }, []);

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
      });
      if (res.ok) {
        setResetSent(true);
      }
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscriptions/stripe/customer-portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />

      <main className="ml-auto flex-1 overflow-y-auto pt-[max(1rem,env(safe-area-inset-top))]">
        <Head>
          <title>Settings - ReBabel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="px-4 md:p-6">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Settings
            </h1>

            <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Email Section */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <FiMail className="text-lg text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    {loading ? (
                      <p className="text-sm text-gray-400">Loading...</p>
                    ) : (
                      <p className="text-gray-900 dark:text-white truncate">
                        {userProfile?.email || "Not available"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <FiKey className="text-lg text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Password
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {resetSent ? "Check your email for reset link" : "Send a password reset email"}
                    </p>
                  </div>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading || resetSent}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                      resetSent
                        ? "border-green-500 text-green-600 dark:text-green-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {resetLoading ? (
                      <FiLoader className="text-sm animate-spin" />
                    ) : resetSent ? (
                      <FiCheck className="text-sm" />
                    ) : (
                      <FiKey className="text-sm" />
                    )}
                    {resetSent ? "Email Sent" : "Reset Password"}
                  </button>
                </div>
              </div>

              {/* Subscription Section - Only show for premium users */}
              {subscription?.isPremium && (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FiCreditCard className="text-lg text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Subscription
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage billing & plan
                      </p>
                    </div>
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <FiSun className="text-lg text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Appearance
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your preferred theme
                    </p>
                  </div>
                </div>
                <div className="mt-3 ml-13 flex gap-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          isActive
                            ? "border-[#e30a5f] bg-[#e30a5f]/10 text-[#e30a5f]"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="text-sm" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sign Out Section */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <FiLogOut className="text-lg text-red-500 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sign Out
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Log out of your account
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = "/api/auth/logout"}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <FiLogOut className="text-sm" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
