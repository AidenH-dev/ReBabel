import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  TbSettings, 
  TbMenu2, 
  TbX, 
  TbSchool,
  TbCertificate,
  TbBooks,
  TbLayoutDashboard
} from "react-icons/tb";
import Link from "next/link";
import { TbInfoSquareRounded } from "react-icons/tb";

function MainSidebar() {
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

  // Main nav active states
  const isDashboardActive = /^\/learn\/dashboard/.test(path);
  const isAcademyActive = /^\/learn\/(academy|modules|sets|learning_material|material|section)/.test(path);
  const isCertificateActive = /^\/certificate/.test(path);
  const isResourcesActive = /^\/learn\/resources/.test(path);
  const isMainSettingsActive = /^\/settings/.test(path);

  const baseLink =
    "flex items-center p-2 rounded-lg group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors";
  const inactiveLinkLight = "text-gray-700 hover:bg-gray-200 hover:text-gray-900";
  const inactiveIconLight = "text-gray-600 group-hover:text-gray-900";
  const activeLink =
    "text-[#e30a5f] bg-gray-100 dark:bg-[#172229] shadow-[inset_0_0_0_2px_rgb(209,213,219)] dark:shadow-[inset_0_0_0_2px_rgb(75,85,99)]";
  const inactiveLinkDark = "dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700";
  const inactiveIconDark = "dark:text-gray-400 dark:group-hover:text-white";

  const NavigationContent = () => (
    <>
      <div className="text-center mb-5 mt-6">
        <Image
          src="/ReBabel.png"
          alt="ReBabel Logo"
          layout="responsive"
          width={150}
          height={50}
          className="mx-auto object-contain"
        />
      </div>
      <div className="py-4 px-2 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          <li>
            <Link
              href="/learn/home"
              className={`${baseLink} ${
                isDashboardActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isDashboardActive ? "page" : undefined}
            >
              <TbLayoutDashboard
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isDashboardActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              href="/learn/academy"
              className={`${baseLink} ${
                isAcademyActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isAcademyActive ? "page" : undefined}
            >
              <TbSchool
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isAcademyActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Academy</span>
            </Link>
          </li>

          {/*<li>
            <Link
              href="/certificate"
              className={`${baseLink} ${
                isCertificateActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isCertificateActive ? "page" : undefined}
            >
              <TbCertificate
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isCertificateActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Certificate</span>
            </Link>
              </li>*/}

          <li>
            <Link
              href="/learn/resources"
              className={`${baseLink} ${
                isResourcesActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isResourcesActive ? "page" : undefined}
            >
              <TbInfoSquareRounded
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isResourcesActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Information</span>
            </Link>
          </li>

          <li>
            <Link
              href="/learn/settings"
              className={`${baseLink} ${
                isMainSettingsActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isMainSettingsActive ? "page" : undefined}
            >
              <TbSettings
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isMainSettingsActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Settings</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <button
        id="menu-toggle"
        onClick={() => setIsMobileMenuOpen((v) => !v)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-sidebar"
      >
        {isMobileMenuOpen ? (
          <TbX className="w-6 h-6 text-gray-700 dark:text-white" />
        ) : (
          <TbMenu2 className="w-6 h-6 text-gray-700 dark:text-white" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className={`lg:hidden fixed top-0 left-0 z-50 w-64 h-screen p-4 bg-white dark:bg-[#172229] border-r-2 border-gray-300 dark:border-gray-600 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <NavigationContent />
      </div>

      {/* Desktop Sidebar - Hidden on small screens */}
      <div className="hidden lg:block w-64 h-screen p-4 bg-white dark:bg-[#172229] border-r-2 border-gray-300 dark:border-gray-600">
        <NavigationContent />
      </div>
    </>
  );
}

export default MainSidebar;