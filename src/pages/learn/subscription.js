import Head from "next/head";
import MainSidebar from "../../components/Sidebars/MainSidebar";
import { useEffect, useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { TbCheck, TbLoader, TbExternalLink } from "react-icons/tb";
import { HiOutlineStar } from "react-icons/hi2";

export default function Subscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Check URL params for success/cancel messages
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setMessage({ type: "success", text: "Subscription activated successfully!" });
      // Sync subscription from Stripe (fallback when webhooks aren't available)
      syncSubscription();
      // Clean URL
      window.history.replaceState({}, "", "/learn/subscription");
    } else if (params.get("canceled") === "true") {
      setMessage({ type: "info", text: "Checkout was canceled." });
      window.history.replaceState({}, "", "/learn/subscription");
    }

    fetchSubscription();
  }, []);

  const syncSubscription = async () => {
    try {
      await fetch("/api/subscriptions/stripe/sync", { method: "POST" });
      // Refresh subscription status after sync
      fetchSubscription();
    } catch (error) {
      console.error("Failed to sync subscription:", error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch(
        `/api/subscriptions/stripe/subscription-status`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }
      );
      const data = await res.json();
      console.log("FUCK", data)
      setSubscription(data);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/subscriptions/stripe/checkout-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: "Failed to start checkout." });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setMessage({ type: "error", text: "Failed to start checkout." });
    } finally {
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/subscriptions/stripe/customer-portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: "Failed to open billing portal." });
      }
    } catch (error) {
      console.error("Portal error:", error);
      setMessage({ type: "error", text: "Failed to open billing portal." });
    } finally {
      setProcessing(false);
    }
  };

  const isPremium = !!subscription?.isPremium;

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-white dark:bg-[#172229] text-[#4e4a4a] dark:text-white">
      <MainSidebar />

      <main className="ml-auto flex-1 flex flex-col items-center justify-center h-screen overflow-y-auto bg-gray-100 dark:bg-[#172229] p-10">
        <Head>
          <title>Subscription - ReBabel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
            <HiOutlineStar className="text-[#e30a5f]" />
            Subscription
          </h1>
          {
            isPremium ?
              (
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  ありがとうございました! Your support means the world!
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Unlock premium features with ReBabel Premium
                </p>
              )
          }


          {/* Message Banner */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${message.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                : message.type === "error"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                }`}
            >
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="bg-white dark:bg-[#1c2b35] p-8 rounded-lg shadow-md">
              <div className="flex items-center justify-center gap-2">
                <TbLoader className="w-5 h-5 animate-spin" />
                Loading...
              </div>
            </div>
          ) : isPremium ? (
            /* Premium User View */
            <div className="bg-white dark:bg-[#1c2b35] p-6 rounded-lg shadow-md border border-[#e30a5f]/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e30a5f] text-white font-medium">
                  <HiOutlineStar className="w-5 h-5 text-amber-300" />
                  Premium Active
                </span>
              </div>

              <div className="text-gray-600 dark:text-gray-400 mb-6">
                <p className="mb-2">Your premium subscription is active.</p>
                {subscription?.subscription?.current_period_end && (
                  <p>
                    {subscription.subscription.cancel_at_period_end === "true"
                      ? `Access until: ${new Date(
                        subscription.subscription.current_period_end
                      ).toLocaleDateString()}`
                      : `Next billing date: ${new Date(
                        subscription.subscription.current_period_end
                      ).toLocaleDateString()}`}
                  </p>
                )}
              </div>

              <div className="bg-[#e30a5f]/5 dark:bg-[#e30a5f]/10 rounded-lg p-4 mb-6 border border-[#e30a5f]/10">
                <h3 className="font-medium mb-3">Premium Benefits:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                  <li className="flex items-center gap-2">
                    <TbCheck className="text-amber-500" /> 10 translation practice sessions per day
                  </li>
                  <li className="flex items-center gap-2">
                    <TbCheck className="text-amber-500" /> AI-powered grammar feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <TbCheck className="text-amber-500" /> Advanced practice modes
                  </li>
                  <li className="flex items-center gap-2">
                    <TbCheck className="text-amber-500" /> Priority support
                  </li>
                </ul>
              </div>

              <button
                onClick={handleManageBilling}
                disabled={processing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e30a5f]/30 hover:border-[#e30a5f]/50 hover:bg-[#e30a5f]/5 transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <TbLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <TbExternalLink className="w-4 h-4" />
                )}
                Manage Billing
              </button>
            </div>
          ) : (
            /* Free User View */
            <div className="bg-white dark:bg-[#1c2b35] p-6 rounded-lg shadow-md border border-[#e30a5f]/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#e30a5f]/10 border border-[#e30a5f]/30">
                  <HiOutlineStar className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Upgrade to Premium</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Unlock all features
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-2xl font-bold text-[#e30a5f]">$5.50</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>
              </div>

              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-center gap-2">
                  <TbCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>10 translation practice sessions per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <TbCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>AI-powered grammar feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <TbCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Advanced practice modes</span>
                </li>
                <li className="flex items-center gap-2">
                  <TbCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#e30a5f] hover:bg-[#f41567] text-white font-medium transition-all disabled:opacity-50"
              >
                {processing ? (
                  <TbLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <HiOutlineStar className="w-4 h-4 text-amber-300" />
                )}
                Upgrade Now
              </button>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                Free tier: 1 session per day
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
