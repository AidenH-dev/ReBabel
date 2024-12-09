import { useRouter } from "next/router";
import Image from "next/image";
import { TbLanguageHiragana, TbCards, TbVocabulary, TbFloatRight } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { LuBlocks } from "react-icons/lu";

export default function Sidebar() {
  const router = useRouter();
  const isTranslateActive = router.pathname === "/learn/translate";
  const isVocabularyActive = router.pathname === "/learn/vocabulary";

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
            <a
              href="/learn/translate"
              className={`flex items-center p-2 rounded-lg group ${
                isTranslateActive
                  ? "text-white bg-blue-700 dark:bg-blue-900"
                  : "text-white dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-700"
              }`}
            >
              <LuBlocks
                className={`flex-shrink-0 w-7 h-7 transition duration-75 ${
                  isTranslateActive
                    ? "text-white"
                    : "text-white dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                }`}
              />
              <span className="ms-3">Grammar</span>
            </a>
          </li>
          <li>
            <a
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
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center p-2 text-white rounded-lg hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
            >
              <TbLanguageHiragana className="flex-shrink-0 w-7 h-7 text-white transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="flex-1 ms-3 whitespace-nowrap">Kanji</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
