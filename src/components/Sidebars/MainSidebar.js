import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  TbSettings,
  TbMenu2,
  TbX,
  TbSchool,
  TbCertificate,
  TbBooks,
  TbLayoutDashboard,
  TbCrown
} from "react-icons/tb";
import Link from "next/link";
import { TbInfoSquareRounded } from "react-icons/tb";
import { HiOutlineStar } from "react-icons/hi2";
import { BsBookmarkStar } from "react-icons/bs";
import { FiAlertTriangle } from "react-icons/fi";


function MainSidebar() {
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

  // Main nav active states
  const isDashboardActive = /^\/learn\/dashboard/.test(path);
  const isAcademyActive = /^\/learn\/(academy|modules|sets|learning_material|material|section)/.test(path);
  const isCertificateActive = /^\/certificate/.test(path);
  const isResourcesActive = /^\/learn\/resources/.test(path);
  const isSubscriptionActive = /^\/learn\/subscription/.test(path);
  const isMainSettingsActive = /^\/learn\/settings/.test(path);

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
              href="/learn/dashboard"
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
              href="/learn/academy/sets"
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
              href="/learn/subscription"
              className={`${baseLink} ${
                isSubscriptionActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isSubscriptionActive ? "page" : undefined}
            >
              <BsBookmarkStar
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isSubscriptionActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Subscription</span>
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

  const bubbleBase =
    "flex items-center justify-center w-15 h-15 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
  const bubbleActive =
    "border-[#e30a5f] dark:border-[#e30a5f] bg-gray-100/90 dark:bg-[#172229]/80";
  const bubbleIconBase = "w-6.5 h-6.5 text-gray-700 dark:text-gray-300";
  const bubbleIconActive = "w-6 h-6 text-[#e30a5f]";

  const mobileNavItems = [
    { href: "/learn/dashboard", icon: TbLayoutDashboard, active: isDashboardActive, label: "Dashboard" },
    { href: "/learn/academy/sets", icon: TbSchool, active: isAcademyActive, label: "Academy" },
    { href: "/learn/resources", icon: TbInfoSquareRounded, active: isResourcesActive, label: "Information" },
    { href: "/learn/subscription", icon: BsBookmarkStar, active: isSubscriptionActive, label: "Subscription" },
    { href: "/learn/settings", icon: TbSettings, active: isMainSettingsActive, label: "Settings" },
  ];

  return (
    <>
      {/* Mobile Bubble Menu - Only visible on small screens */}
      <div ref={bubbleMenuRef} className="lg:hidden fixed bottom-6 left-6 z-[60] flex flex-col-reverse items-start gap-2 pointer-events-none">
        {/* Bottom row: Menu toggle + Report button */}
        <div className="flex items-center gap-2 pointer-events-auto">
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

          {/* Report button - appears to the right when open */}
          <button
            onClick={() => { window.dispatchEvent(new CustomEvent("open-report-issue")); setIsMobileMenuOpen(false); }}
            className={`${bubbleBase} !border-red-600/60 !bg-red-600/20 hover:!bg-red-600/30 hover:!border-red-500 transition-all duration-200 ${isMobileMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"}`}
            aria-label="Report issue"
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </button>
        </div>

        {/* Nav items stacked above: Settings, Subscription, Information, Academy, Dashboard (bottom to top) */}
        {[...mobileNavItems].reverse().map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => { router.push(item.href); setIsMobileMenuOpen(false); }}
              className={`${bubbleBase} ${item.active ? bubbleActive : ""} transition-all duration-200 ${isMobileMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"}`}
              style={{ transitionDelay: isMobileMenuOpen ? `${(i + 1) * 50}ms` : "0ms" }}
              aria-label={item.label}
              aria-current={item.active ? "page" : undefined}
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <Icon className={item.active ? bubbleIconActive : bubbleIconBase} />
            </button>
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

export default MainSidebar;