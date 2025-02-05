import Head from "next/head";
import Sidebar from "../../components/Sidebar"; // Keep the Sidebar component
import { useEffect, useState } from "react";
import { FiLogOut } from "react-icons/fi";
import Link from "next/link";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function Account() {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
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
      <main className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-100 dark:bg-[#141f25] p-10">
        <Head>
          <title>Account Info</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="bg-white dark:bg-[#1c2b35] p-8 rounded-lg shadow-md max-w-lg">
          <h1 className="text-2xl font-semibold mb-4">Account Information</h1>
          {userProfile ? (
            <div className="mb-6">
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
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
          <Link
            href="/api/auth/logout"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <FiLogOut className="text-lg" />
            Log Out
          </Link>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
