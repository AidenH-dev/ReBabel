import Head from "next/head";
import Sidebar from "../../components/Sidebar"; // Import your Sidebar component
import { useEffect, useState } from "react";
import { FiUser, FiKey, FiLogOut } from "react-icons/fi";
import Link from "next/link";
import { withPageAuthRequired } from '@auth0/nextjs-auth0';


export default function Settings() {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Fetch user profile from Auth0 or mock API
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me"); // Auth0 endpoint to get user profile
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="flex flex-row min-h-screen bg-white dark:bg-[#141f25] text-[#4e4a4a] dark:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-100 dark:bg-[#141f25]">
        <Head>
          <title>Settings</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Settings Content */}
        <div className="p-10 mt-4">
          <h1 className="text-3xl font-semibold mb-6">Settings</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Section */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-medium mb-4">User Profile</h2>
              {userProfile ? (
                <div>
                  <p>
                    <span className="font-semibold">Name:</span>{" "}
                    {userProfile.name || "Not provided"}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    {userProfile.email || "Not provided"}
                  </p>
                  <p>
                    <span className="font-semibold">Nickname:</span>{" "}
                    {userProfile.nickname || "Not provided"}
                  </p>
                  <button
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600"
                    onClick={() => alert("Edit Profile functionality")}
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <p>Loading profile...</p>
              )}
            </div>

            {/* Authentication Settings */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-medium mb-4">Authentication</h2>
              <p>
                <span className="font-semibold">MFA Status:</span> Enabled
              </p>
              <button
                className="mt-4 px-6 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600"
                onClick={() => alert("Manage MFA functionality")}
              >
                Manage MFA
              </button>
              <button
                className="ml-2 mt-4 px-6 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600"
                onClick={() => alert("Reset Password functionality")}
              >
                Reset Password
              </button>
            </div>

            {/* Account Preferences */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-medium mb-4">Account Preferences</h2>
              <label className="block mb-2">
                <span className="font-medium">Theme</span>
                <select
                  className="mt-1 block w-full bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                  onChange={(e) => {
                    const theme = e.target.value;
                    if (theme === "dark") {
                      document.documentElement.classList.add("dark");
                    } else {
                      document.documentElement.classList.remove("dark");
                    }
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <button
                className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-md shadow-md hover:bg-gray-600"
                onClick={() => alert("Save Preferences functionality")}
              >
                Save Preferences
              </button>
            </div>

            {/* Logout Section */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-6 shadow-lg flex flex-col justify-center items-center text-center">
              <Link
                href="/api/auth/logout"
                className="flex justify-center items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600"
              >
                <FiLogOut className="text-lg" />
                <button className="text-md font-medium">Log Out</button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
