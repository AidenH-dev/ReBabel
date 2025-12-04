import Head from "next/head";
import AdminSidebar from "@/components/Sidebars/AdminSidebar";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from 'react-icons/fa';
import { BugReportsTable, useBugReports, useBugReportTable } from "@/components/Tables/admin/usr-bug-report";

function AdminUserReportsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('bug-reports');

  // MVC Hooks
  const bugReportsHook = useBugReports();
  const tableHook = useBugReportTable();

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

  // Get paginated reports data
  const { paginatedReports, sortedReports, totalPages } = tableHook.getPaginatedReports(
    bugReportsHook.bugReports,
    bugReportsHook.currentPage,
    bugReportsHook.rowsPerPage
  );

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
        <title>User Reports - ReBabel Admin</title>
      </Head>
      <div className="flex flex-row min-h-screen bg-white dark:bg-[#172229] text-[#4e4a4a] dark:text-white">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <FaExclamationTriangle className="text-xl text-[#e30a5f]" />
                <h1 className="text-3xl font-bold">User Reports</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Manage user bug reports and feedback</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 mb-6 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setActiveTab('bug-reports')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'bug-reports'
                  ? 'text-[#e30a5f] border-[#e30a5f]'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                Bug Reports
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'feedback'
                  ? 'text-[#e30a5f] border-[#e30a5f]'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                disabled={activeTab !== 'feedback'}
              >
                User Feedback
              </button>
            </div>

            {/* Bug Reports Section */}
            {activeTab === 'bug-reports' && (
              <BugReportsTable
                bugReports={bugReportsHook.bugReports}
                loading={bugReportsHook.loading}
                error={bugReportsHook.error}
                sortColumn={tableHook.sortColumn}
                sortDirection={tableHook.sortDirection}
                expandedId={tableHook.expandedId}
                currentPage={bugReportsHook.currentPage}
                rowsPerPage={bugReportsHook.rowsPerPage}
                timeRangePreset={bugReportsHook.timeRangePreset}
                customDateRange={bugReportsHook.customDateRange}
                paginatedReports={paginatedReports}
                sortedReports={sortedReports}
                totalPages={totalPages}
                onSort={tableHook.handleSort}
                onToggleExpand={tableHook.toggleExpanded}
                onTimeRangeChange={bugReportsHook.handleTimeRangeChange}
                onCustomDateChange={bugReportsHook.handleCustomDateChange}
                onApplyCustomRange={bugReportsHook.applyCustomRange}
                onPageChange={bugReportsHook.setCurrentPage}
                onRowsPerPageChange={(value) => {
                  bugReportsHook.setRowsPerPage(value);
                  bugReportsHook.setCurrentPage(1);
                }}
              />
            )}

            {/* User Feedback Section */}
            {activeTab === 'feedback' && (
              <div>
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-8 border border-gray-200 dark:border-gray-800 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Coming Soon</p>
                  <p className="text-gray-600 dark:text-gray-400">User feedback collection and analysis features are being developed.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default AdminUserReportsPage;
