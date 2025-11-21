import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  TbSettings, 
  TbHome, 
  TbMenu2, 
  TbX, 
  TbArrowLeft,
  TbLayoutGrid,
  TbStack2,
  TbPlus
} from "react-icons/tb";
import Link from "next/link";

function AcademySidebar() {
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

  // Academy nav active states
  const isAcademyHomeActive = /^\/learn\/academy$/.test(path);
  const isModulesActive = /^\/learn\/modules/.test(path);
  const isSetsActive = /^\/learn\/academy\/sets/.test(path);
  const isAcademySettingsActive = /^\/learn\/academy\/settings/.test(path);

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
      <div className="text-center mb-4 mt-6 relative w-full h-12">
        <Image
          src="/ReBabel.png"
          alt="ReBabel Logo"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="mx-auto object-contain"
          priority
        />
      </div>
      <div className="py-4 px-2 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          {/* Back and Create Buttons */}
          <li>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => {
                  router.push("/learn/dashboard");
                }}
                className="flex-1 flex items-center justify-center p-2.5 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/30 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Back to dashboard"
              >
                <TbArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => {
                  router.push("/learn/academy/sets/create");
                }}
                className="flex-1 flex items-center justify-center p-2.5 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/30 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Create new set"
              >
                <TbPlus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </li>

          <li>
            <Link
              href="/learn/academy"
              className={`${baseLink} ${
                isAcademyHomeActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isAcademyHomeActive ? "page" : undefined}
            >
              <TbHome
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isAcademyHomeActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Home</span>
            </Link>
          </li>

          {/*<li>
            <Link
              href="/learn/academy/modules"
              className={`${baseLink} ${
                isModulesActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isModulesActive ? "page" : undefined}
            >
              <TbLayoutGrid
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isModulesActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Modules</span>
            </Link>
              </li>*/}

          <li>
            <Link
              href="/learn/academy/sets"
              className={`${baseLink} ${
                isSetsActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isSetsActive ? "page" : undefined}
            >
              <TbStack2
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isSetsActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Sets</span>
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

export default AcademySidebar;