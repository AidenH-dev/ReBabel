import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  TbSettings,
  TbHome,
  TbMenu2,
  TbX,
  TbArrowLeft,
  TbLayoutGrid,
  TbStack2,
  TbPlus,
  TbBooks
} from "react-icons/tb";
import { LuTextCursorInput } from "react-icons/lu";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { LuSquarePen } from "react-icons/lu";
import { FiAlertTriangle } from "react-icons/fi";


import Link from "next/link";

function AcademySidebar() {
  const router = useRouter();
  const path = router.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const bubbleMenuRef = useRef(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  // Close mobile menu when tapping outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleClickOutside(e) {
      if (bubbleMenuRef.current && !bubbleMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Academy nav active states
  const isAcademyHomeActive = /^\/learn\/academy$/.test(path);
  const isModulesActive = /^\/learn\/modules/.test(path);
  const isSetsActive = /^\/learn\/academy\/sets/.test(path);
  const isAcademySettingsActive = /^\/learn\/academy\/settings/.test(path);
  const isPracticeActive = /^\/learn\/academy\/practice/.test(path);


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
              className={`${baseLink} ${isAcademyHomeActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
                }`}
              aria-current={isAcademyHomeActive ? "page" : undefined}
            >
              <TbHome
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${isAcademyHomeActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                  }`}
              />
              <span className="ms-3">Home</span>
            </Link>
          </li>
          <li>
            <Link
              href="/learn/academy/practice"
              className={`${baseLink} ${isPracticeActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
                }`}
              aria-current={isPracticeActive ? "page" : undefined}
            >
              <HiOutlinePencilAlt
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${isPracticeActive
                    ? "text-[#e30a5f]"
                    : `${inactiveIconLight} ${inactiveIconDark}`
                  }`}
              />
              <span className="ms-3">Practice</span>
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
              className={`${baseLink} ${isSetsActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
                }`}
              aria-current={isSetsActive ? "page" : undefined}
            >
              <TbStack2
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${isSetsActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                  }`}
              />
              <span className="ms-3">Sets</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );

  const bubbleBase =
    "flex items-center justify-center w-15 h-15 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
  const bubbleActive =
    "border-[#e30a5f] dark:border-[#e30a5f] bg-gray-100/90 dark:bg-[#172229]/80";
  const bubbleIconBase = "w-6.5 h-6.5 text-gray-700 dark:text-gray-300";
  const bubbleIconActive = "w-6 h-6 text-[#e30a5f]";

  const mobileNavItems = [
    { href: "/learn/academy", icon: TbHome, active: isAcademyHomeActive, label: "Home" },
    { href: "/learn/academy/practice", icon: HiOutlinePencilAlt, active: isPracticeActive, label: "Practice" },
    { href: "/learn/academy/sets", icon: TbStack2, active: isSetsActive, label: "Sets" },
  ];

  return (
    <>
      {/* Mobile Bubble Menu - Only visible on small screens */}
      <div ref={bubbleMenuRef} className="lg:hidden fixed bottom-6 left-6 z-[60] flex flex-col-reverse items-start gap-2">
        {/* Bottom row: Menu toggle + Create button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className={bubbleBase}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <TbX className={bubbleIconBase} />
            ) : (
              <TbMenu2 className={bubbleIconBase} />
            )}
          </button>

          {/* Create button - appears to the right when open */}
          <button
            onClick={() => { router.push("/learn/academy/sets/create"); setIsMobileMenuOpen(false); }}
            className={`${bubbleBase} transition-all duration-200 ${isMobileMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}
            aria-label="Create new set"
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            <TbPlus className={bubbleIconBase} />
          </button>

          {/* Report button - appears to the right of plus when open */}
          <button
            onClick={() => { window.dispatchEvent(new CustomEvent("open-report-issue")); setIsMobileMenuOpen(false); }}
            className={`${bubbleBase} !border-red-600/60 !bg-red-600/20 hover:!bg-red-600/30 hover:!border-red-500 transition-all duration-200 ${isMobileMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}
            aria-label="Report issue"
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </button>
        </div>

        {/* Stacked above: Back button, then nav items */}
        <button
          onClick={() => { router.push("/learn/dashboard"); setIsMobileMenuOpen(false); }}
          className={`${bubbleBase} transition-all duration-200 ${isMobileMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}
          style={{ transitionDelay: isMobileMenuOpen ? "50ms" : "0ms" }}
          aria-label="Back to dashboard"
          tabIndex={isMobileMenuOpen ? 0 : -1}
        >
          <TbArrowLeft className={bubbleIconBase} />
        </button>

        {/* Nav items: Sets, Practice, Home (bottom to top) */}
        {[...mobileNavItems].reverse().map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`${bubbleBase} ${item.active ? bubbleActive : ""} transition-all duration-200 ${isMobileMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}
              style={{ transitionDelay: isMobileMenuOpen ? `${(i + 2) * 50}ms` : "0ms" }}
              aria-label={item.label}
              aria-current={item.active ? "page" : undefined}
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <Icon className={item.active ? bubbleIconActive : bubbleIconBase} />
            </Link>
          );
        })}
      </div>

      {/* Desktop Sidebar - Hidden on small screens */}
      <div className="hidden lg:block w-64 h-screen p-4 bg-white dark:bg-[#172229] border-r-2 border-gray-300 dark:border-gray-600">
        <NavigationContent />
      </div>
    </>
  );
}

export default AcademySidebar;