import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import { TbShieldLock, TbMenu2, TbX, TbLogout, TbHome, TbSchool } from "react-icons/tb";
import { GrHomeRounded } from "react-icons/gr";

import { VscFeedback } from "react-icons/vsc";
import Link from "next/link";

function AdminSidebar() {
  const router = useRouter();
  const path = router.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  // Lock body scroll when the menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isAdminActive = /^\/admin\/?$/.test(path);
  const isUserReportsActive = /^\/admin\/user-reports/.test(path);

  const baseLink = "flex items-center p-2 rounded-lg group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors";
  const inactiveLinkLight = "text-gray-700 hover:bg-gray-200 hover:text-gray-900";
  const inactiveIconLight = "text-gray-600 group-hover:text-gray-900";
  const activeLink = "text-[#e30a5f] bg-gray-100 dark:bg-[#172229] shadow-[inset_0_0_0_2px_rgb(209,213,219)] dark:shadow-[inset_0_0_0_2px_rgb(75,85,99)]";
  const inactiveLinkDark = "dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700";
  const inactiveIconDark = "dark:text-gray-400 dark:group-hover:text-white";

  const NavigationContent = () => (
    <>
      <div className="text-center mb-5 mt-6 relative w-full h-12">
        <Image
          src="/ReBabel.png"
          alt="ReBabel Logo"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="mx-auto object-contain"
        />
      </div>
      <div className="py-4 px-2 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          <li>
            <Link
              href="/admin"
              className={`${baseLink} ${isAdminActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`}`}
              aria-current={isAdminActive ? "page" : undefined}
            >
              <TbShieldLock
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${isAdminActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                  }`}
              />
              <span className="ms-3">Admin</span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/user-reports"
              className={`${baseLink} ${isUserReportsActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`}`}
              aria-current={isUserReportsActive ? "page" : undefined}
            >
              <VscFeedback
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${isUserReportsActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                  }`}
              />
              <span className="ms-3">User Reports</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="py-4 px-2 border-t border-gray-200 dark:border-gray-700">
        <ul className="space-y-2 font-medium">
          <li>
            <Link
              href="/api/auth/logout"
              className={`${baseLink} ${inactiveLinkLight} ${inactiveLinkDark}`}
            >
              <TbLogout className={`flex-shrink-0 w-7 h-7 transition duration-75 ${inactiveIconLight} ${inactiveIconDark}`} />
              <span className="ms-3">Logout</span>
            </Link>
          </li>
        </ul>
        <ul className="space-y-2 font-medium">
          <li>
            <Link
              href="/"
              className={`${baseLink} ${inactiveLinkLight} ${inactiveLinkDark}`}
            >
              <TbHome className={`flex-shrink-0 w-7 h-7 transition duration-75 ${inactiveIconLight} ${inactiveIconDark}`} />
              <span className="ms-3">Landing Page</span>
            </Link>
          </li>
        </ul>
          <ul className="space-y-2 font-medium">
          <li>
            <Link
              href="/learn"
              className={`${baseLink} ${inactiveLinkLight} ${inactiveLinkDark}`}
            >
              <TbSchool className={`flex-shrink-0 w-7 h-7 transition duration-75 ${inactiveIconLight} ${inactiveIconDark}`} />
              <span className="ms-3">Learn Portal</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-[#1c2b35] border-r border-gray-200 dark:border-gray-800">
        <NavigationContent />
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white dark:bg-[#1c2b35] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <TbX size={24} /> : <TbMenu2 size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed top-0 left-0 w-64 h-screen bg-white dark:bg-[#1c2b35] border-r border-gray-200 dark:border-gray-800 md:hidden z-40 overflow-y-auto">
            <NavigationContent />
          </aside>
        </>
      )}
    </>
  );
}

export default AdminSidebar;
