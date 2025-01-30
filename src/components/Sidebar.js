import { useRouter } from "next/router";
import Image from "next/image";
import { TbLanguageHiragana, TbVocabulary, TbSettings } from "react-icons/tb";
import { LuBlocks } from "react-icons/lu";
import Link from "next/link";

function Sidebar() {
  const router = useRouter();
  const path = router.pathname;

  // Use regex to check if the path starts with allowed prefixes
  const isGrammarActive = /^\/learn\/grammar/.test(path);
  const isVocabularyActive = /^\/learn\/vocabulary/.test(path);
  const isSettingsActive = /^\/learn\/settings/.test(path);

  return (
    <div className="fixed top-0 left-0 z-40 w-64 h-screen p-4 bg-[#404d68] dark:bg-[#141f25] border-r-2 border-gray-600">
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
              href="/learn/grammar"
              className={`flex items-center p-2 rounded-lg group ${
                isGrammarActive
                  ? "text-white bg-blue-700 dark:bg-blue-900"
                  : "text-white dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-700"
              }`}
            >
              <LuBlocks
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isGrammarActive
                    ? "text-white"
                    : "text-white dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                }`}
              />
              <span className="ms-3">Grammar</span>
            </Link>
          </li>
          <li>
            <Link
              href="/learn/vocabulary"
              className={`flex items-center p-2 rounded-lg group ${
                isVocabularyActive
                  ? "text-white bg-blue-700 dark:bg-blue-900"
                  : "text-white dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-700"
              }`}
            >
              <TbVocabulary
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isVocabularyActive
                    ? "text-white"
                    : "text-white dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                }`}
              />
              <span className="flex-1 ms-3 whitespace-nowrap">Vocabulary</span>
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="flex items-center p-2 text-white rounded-lg hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
            >
              <TbLanguageHiragana className="flex-shrink-0 w-7 h-7 text-white transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="flex-1 ms-3 whitespace-nowrap">Kanji</span>
            </Link>
          </li>
          <li>
            <Link
              href="/learn/settings"
              className={`flex items-center p-2 rounded-lg group ${
                isSettingsActive
                  ? "text-white bg-blue-700 dark:bg-blue-900"
                  : "text-white dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-700"
              }`}
            >
              <TbSettings
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isSettingsActive
                    ? "text-white"
                    : "text-white dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                }`}
              />
              <span className="flex-1 ms-3 whitespace-nowrap">Settings</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
