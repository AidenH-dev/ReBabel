import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  TbSettings,
  TbMenu2,
  TbX,
  TbSchool,
  TbCertificate,
  TbBooks,
  TbLayoutDashboard,
  TbCrown,
  TbChevronDown,
  TbInfoSquareRounded,
} from 'react-icons/tb';
import Link from 'next/link';
import { HiOutlineStar } from 'react-icons/hi2';
import { BsBookmarkStar } from 'react-icons/bs';
import { FiAlertTriangle } from 'react-icons/fi';
import { FaRegUser } from 'react-icons/fa';

function MainSidebar() {
  const router = useRouter();
  const path = router.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStudentMenuExpanded, setIsStudentMenuExpanded] = useState(false);
  const [isStudentBubbleExpanded, setIsStudentBubbleExpanded] = useState(false);
  const bubbleMenuRef = useRef(null);

  // Main nav active states
  const isDashboardActive = /^\/learn\/dashboard/.test(path);
  const isAcademyActive =
    /^\/learn\/(academy|modules|sets|learning_material|material|section)/.test(
      path
    );
  const isCertificateActive = /^\/certificate/.test(path);
  const isInformationActive = /^\/learn\/account\/information/.test(path);
  const isSubscriptionActive = /^\/learn\/account\/subscription/.test(path);
  const isSettingsActive = /^\/learn\/account\/settings/.test(path);
  const isStudentMenuActive =
    isInformationActive || isSubscriptionActive || isSettingsActive;

  // Auto-expand student menu when any child route is active
  useEffect(() => {
    if (isStudentMenuActive) {
      setIsStudentMenuExpanded(true);
    }
  }, [isStudentMenuActive]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsStudentBubbleExpanded(false);
  }, [path]);

  // Close mobile menu when tapping outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleClickOutside(e) {
      if (bubbleMenuRef.current && !bubbleMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
        setIsStudentBubbleExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const baseLink =
    'flex items-center p-2 rounded-lg group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors';
  const inactiveLinkLight =
    'text-gray-700 hover:bg-gray-200 hover:text-gray-900';
  const inactiveIconLight = 'text-gray-600 group-hover:text-gray-900';
  const activeLink =
    'text-[#e30a5f] bg-gray-100 dark:bg-[#172229] shadow-[inset_0_0_0_2px_rgb(209,213,219)] dark:shadow-[inset_0_0_0_2px_rgb(75,85,99)]';
  const inactiveLinkDark =
    'dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700';
  const inactiveIconDark = 'dark:text-gray-400 dark:group-hover:text-white';

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
                isDashboardActive
                  ? activeLink
                  : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isDashboardActive ? 'page' : undefined}
            >
              <TbLayoutDashboard
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isDashboardActive
                    ? 'text-[#e30a5f]'
                    : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              href="/learn/academy/sets"
              className={`${baseLink} ${
                isAcademyActive
                  ? activeLink
                  : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isAcademyActive ? 'page' : undefined}
            >
              <TbSchool
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isAcademyActive
                    ? 'text-[#e30a5f]'
                    : `${inactiveIconLight} ${inactiveIconDark}`
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

          {/* Account Menu with Accordion */}
          <li>
            <button
              onClick={() => setIsStudentMenuExpanded(!isStudentMenuExpanded)}
              className={`${baseLink} w-full justify-between ${
                isStudentMenuActive
                  ? activeLink
                  : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-expanded={isStudentMenuExpanded}
            >
              <div className="flex items-center">
                <FaRegUser
                  className={`flex-shrink-0 w-6 h-6 transition duration-75 ${
                    isStudentMenuActive
                      ? 'text-[#e30a5f]'
                      : `${inactiveIconLight} ${inactiveIconDark}`
                  }`}
                />
                <span className="ms-3">Account</span>
              </div>
              <TbChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isStudentMenuExpanded ? 'rotate-180' : ''
                } ${isStudentMenuActive ? 'text-[#e30a5f]' : 'text-gray-500 dark:text-gray-400'}`}
              />
            </button>

            {/* Submenu Items */}
            <ul className="mt-1 ml-4 space-y-1">
              {[
                {
                  href: '/learn/account/information',
                  icon: TbInfoSquareRounded,
                  active: isInformationActive,
                  label: 'Information',
                },
                {
                  href: '/learn/account/subscription',
                  icon: BsBookmarkStar,
                  active: isSubscriptionActive,
                  label: 'Subscription',
                },
                {
                  href: '/learn/account/settings',
                  icon: TbSettings,
                  active: isSettingsActive,
                  label: 'Settings',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${baseLink} pl-3 transform transition-all duration-200 ${
                        item.active
                          ? activeLink
                          : `${inactiveLinkLight} ${inactiveLinkDark}`
                      } ${
                        isStudentMenuExpanded
                          ? 'opacity-100 translate-x-0 scale-100'
                          : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
                      }`}
                      style={{
                        transitionDelay: isStudentMenuExpanded
                          ? `${index * 50}ms`
                          : '0ms',
                        transitionProperty: 'opacity, transform',
                      }}
                      aria-current={item.active ? 'page' : undefined}
                      tabIndex={isStudentMenuExpanded ? 0 : -1}
                    >
                      <Icon
                        className={`flex-shrink-0 w-5 h-5 transition duration-75 ${
                          item.active
                            ? 'text-[#e30a5f]'
                            : `${inactiveIconLight} ${inactiveIconDark}`
                        }`}
                      />
                      <span className="ms-3 text-sm">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </div>
    </>
  );

  const bubbleBase =
    'flex items-center justify-center w-15 h-15 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
  const bubbleActive =
    'border-[#e30a5f] dark:border-[#e30a5f] bg-gray-100/90 dark:bg-[#172229]/80';
  const bubbleIconBase = 'w-6.5 h-6.5 text-gray-700 dark:text-gray-300';
  const bubbleIconActive = 'w-6 h-6 text-[#e30a5f]';

  const mobileNavItems = [
    {
      href: '/learn/dashboard',
      icon: TbLayoutDashboard,
      active: isDashboardActive,
      label: 'Dashboard',
    },
    {
      href: '/learn/academy/sets',
      icon: TbSchool,
      active: isAcademyActive,
      label: 'Academy',
    },
    {
      id: 'student-menu',
      icon: FaRegUser,
      active: isStudentMenuActive,
      label: 'Account',
      isParent: true,
      children: [
        {
          href: '/learn/account/information',
          icon: TbInfoSquareRounded,
          active: isInformationActive,
          label: 'Information',
        },
        {
          href: '/learn/account/subscription',
          icon: BsBookmarkStar,
          active: isSubscriptionActive,
          label: 'Subscription',
        },
        {
          href: '/learn/account/settings',
          icon: TbSettings,
          active: isSettingsActive,
          label: 'Settings',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Bubble Menu - Only visible on small screens */}
      <div
        ref={bubbleMenuRef}
        className="lg:hidden fixed bottom-6 left-6 z-[60] flex flex-col-reverse items-start gap-2 pointer-events-none"
      >
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
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-report-issue'));
              setIsMobileMenuOpen(false);
            }}
            className={`${bubbleBase} !border-red-600/60 !bg-red-600/20 hover:!bg-red-600/30 hover:!border-red-500 transition-all duration-200 ${isMobileMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'}`}
            aria-label="Report issue"
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </button>
        </div>

        {/* Nav items stacked above */}
        {[...mobileNavItems].reverse().map((item, i) => {
          const Icon = item.icon;

          // Handle parent items with children (Account Menu)
          if (item.isParent && item.children) {
            return (
              <div key={item.id} className="relative">
                {/* Child bubbles - appear to the right when expanded */}
                <div className="absolute left-16 bottom-0 flex flex-row gap-2">
                  {item.children.map((child, childIndex) => {
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.href}
                        onClick={() => {
                          router.push(child.href);
                          setIsMobileMenuOpen(false);
                          setIsStudentBubbleExpanded(false);
                        }}
                        className={`${bubbleBase} ${child.active ? bubbleActive : ''} transition-all duration-200 ${
                          isStudentBubbleExpanded && isMobileMenuOpen
                            ? 'opacity-100 scale-100 pointer-events-auto'
                            : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                        style={{
                          transitionDelay: isStudentBubbleExpanded
                            ? `${(childIndex + 1) * 50}ms`
                            : '0ms',
                        }}
                        aria-label={child.label}
                        aria-current={child.active ? 'page' : undefined}
                        tabIndex={
                          isStudentBubbleExpanded && isMobileMenuOpen ? 0 : -1
                        }
                      >
                        <ChildIcon
                          className={`w-6 h-6 ${child.active ? 'text-[#e30a5f]' : 'text-gray-700 dark:text-gray-300'}`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Parent bubble */}
                <button
                  onClick={() =>
                    setIsStudentBubbleExpanded(!isStudentBubbleExpanded)
                  }
                  className={`${bubbleBase} ${item.active ? bubbleActive : ''} ${isStudentBubbleExpanded ? 'ring-2 ring-[#e30a5f]/50' : ''} transition-all duration-200 ${isMobileMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'}`}
                  style={{
                    transitionDelay: isMobileMenuOpen
                      ? `${(i + 1) * 50}ms`
                      : '0ms',
                  }}
                  aria-label={item.label}
                  aria-expanded={isStudentBubbleExpanded}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  <Icon
                    className={`w-6 h-6 ${item.active ? 'text-[#e30a5f]' : 'text-gray-700 dark:text-gray-300'}`}
                  />
                </button>
              </div>
            );
          }

          // Regular nav items
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setIsMobileMenuOpen(false);
              }}
              className={`${bubbleBase} ${item.active ? bubbleActive : ''} transition-all duration-200 ${isMobileMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'}`}
              style={{
                transitionDelay: isMobileMenuOpen ? `${(i + 1) * 50}ms` : '0ms',
              }}
              aria-label={item.label}
              aria-current={item.active ? 'page' : undefined}
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <Icon
                className={item.active ? bubbleIconActive : bubbleIconBase}
              />
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
