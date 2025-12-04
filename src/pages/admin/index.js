import Head from "next/head";
import AdminSidebar from "@/components/Sidebars/AdminSidebar";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaShieldAlt } from 'react-icons/fa';

function AdminPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    // Check for isAdmin in user app metadata
    const isAdmin = user?.["https://rebabel.org/app_metadata"]?.isAdmin || false;

    if (!isAdmin) {
      router.push("/");
      return;
    }

    setIsAuthorized(true);
  }, [user, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#172229]">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - ReBabel</title>
      </Head>
      <div className="flex flex-row min-h-screen bg-white dark:bg-[#172229] text-[#4e4a4a] dark:text-white">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <FaShieldAlt className="text-xl text-[#e30a5f]" />
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">System administration and monitoring</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">Active</p>
              </div>
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role</p>
                <p className="text-2xl font-bold text-[#e30a5f]">Admin</p>
              </div>
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Access Level</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Full</p>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-2">Welcome to Admin Panel</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">You have administrative access to ReBabel. Use this area to manage system settings and monitor platform health.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default AdminPage;
