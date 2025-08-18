import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import { TbLanguageHiragana, TbVocabulary, TbSettings, TbHome, TbMenu2, TbX } from "react-icons/tb";
import { LuBlocks } from "react-icons/lu";
import Link from "next/link";

function Sidebar() {
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

  // Use regex to check if the path starts with allowed prefixes
  const isHomeActive = /^\/learn\/home/.test(path);
  const isGrammarActive = /^\/learn\/grammar/.test(path);
  const isVocabularyActive = /^\/learn\/vocabulary/.test(path);
  const isSettingsActive = /^\/learn\/settings/.test(path);

  const baseLink =
    "flex items-center p-2 rounded-lg group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 mx-1";
  const inactiveLinkLight = "text-gray-700 hover:bg-gray-200 hover:text-gray-900";
  const inactiveIconLight = "text-gray-600 group-hover:text-gray-900";
  const activeLink =
    "text-[#e30a5f] bg-gray-100 dark:bg-[#172229] dark:ring-gray-600 ring-2 ring-gray-300";
  const inactiveLinkDark = "dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700";
  const inactiveIconDark = "dark:text-gray-400 dark:group-hover:text-white";

  const NavigationContent = () => (
    <>
      <div className="text-center mb-10 mt-6">
        <Image
          src="/ReBabel.png"
          alt="Learnt Logo"
          layout="responsive"
          width={150}
          height={50}
          className="mx-auto object-contain"
        />
      </div>
      <div className="py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          <li>
            <Link
              href="/learn/home"
              className={`${baseLink} ${
                isHomeActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isHomeActive ? "page" : undefined}
            >
              <TbHome
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isHomeActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Home</span>
            </Link>
          </li>

          <li>
            <Link
              href="/learn/grammar"
              className={`${baseLink} ${
                isGrammarActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isGrammarActive ? "page" : undefined}
            >
              <LuBlocks
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isGrammarActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="ms-3">Grammar</span>
            </Link>
          </li>

          <li>
            <Link
              href="/learn/vocabulary"
              className={`${baseLink} ${
                isVocabularyActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isVocabularyActive ? "page" : undefined}
            >
              <TbVocabulary
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isVocabularyActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="flex-1 ms-3 whitespace-nowrap">Vocabulary</span>
            </Link>
          </li>

          <li>
            <Link
              href="#"
              className={`${baseLink} ${inactiveLinkLight} ${inactiveLinkDark} relative`}
            >
              <TbLanguageHiragana
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${inactiveIconLight} ${inactiveIconDark}`}
              />
              <span className="flex-1 ms-3 whitespace-nowrap">Kanji</span>
              {/* Tooltip for the Kanji button - hidden on mobile */}
              <div className="hidden lg:block absolute left-full ml-2 bg-gray-800 dark:bg-gray-900 text-sm text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Coming soon!
              </div>
            </Link>
          </li>

          <li>
            <Link
              href="/learn/settings"
              className={`${baseLink} ${
                isSettingsActive ? activeLink : `${inactiveLinkLight} ${inactiveLinkDark}`
              }`}
              aria-current={isSettingsActive ? "page" : undefined}
            >
              <TbSettings
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isSettingsActive ? "text-[#e30a5f]" : `${inactiveIconLight} ${inactiveIconDark}`
                }`}
              />
              <span className="flex-1 ms-3 whitespace-nowrap">Settings</span>
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

export default Sidebar;
