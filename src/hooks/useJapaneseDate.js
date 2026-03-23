// [number reading, gatsu/nichi suffix reading]
const MONTH_READINGS = [
  ['いち', 'がつ'],
  ['に', 'がつ'],
  ['さん', 'がつ'],
  ['し', 'がつ'],
  ['ご', 'がつ'],
  ['ろく', 'がつ'],
  ['しち', 'がつ'],
  ['はち', 'がつ'],
  ['く', 'がつ'],
  ['じゅう', 'がつ'],
  ['じゅういち', 'がつ'],
  ['じゅうに', 'がつ'],
];

// [number reading, nichi suffix reading] -- irregular days have combined readings
const DAY_READINGS = [
  ['', ''],
  ['ついた', 'ち'],
  ['ふつ', 'か'],
  ['みっ', 'か'],
  ['よっ', 'か'],
  ['いつ', 'か'],
  ['むい', 'か'],
  ['なの', 'か'],
  ['よう', 'か'],
  ['ここの', 'か'],
  ['とお', 'か'],
  ['じゅういち', 'にち'],
  ['じゅうに', 'にち'],
  ['じゅうさん', 'にち'],
  ['じゅうよっ', 'か'],
  ['じゅうご', 'にち'],
  ['じゅうろく', 'にち'],
  ['じゅうしち', 'にち'],
  ['じゅうはち', 'にち'],
  ['じゅうく', 'にち'],
  ['はつ', 'か'],
  ['にじゅういち', 'にち'],
  ['にじゅうに', 'にち'],
  ['にじゅうさん', 'にち'],
  ['にじゅうよっ', 'か'],
  ['にじゅうご', 'にち'],
  ['にじゅうろく', 'にち'],
  ['にじゅうしち', 'にち'],
  ['にじゅうはち', 'にち'],
  ['にじゅうく', 'にち'],
  ['さんじゅう', 'にち'],
  ['さんじゅういち', 'にち'],
];

const DOW_KANJI = ['日', '月', '火', '水', '木', '金', '土'];
const DOW_READINGS = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];

export default function useJapaneseDate() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  const dow = now.getDay();

  const monthNum = `${month + 1}`;
  const dayNum = `${day}`;
  const dowKanji = DOW_KANJI[dow];

  const [monthNumReading, monthKanjiReading] = MONTH_READINGS[month];
  const [dayNumReading, dayKanjiReading] = DAY_READINGS[day];
  const dowReading = DOW_READINGS[dow];

  const englishDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const rtClass =
    'text-[0.55rem] font-normal text-gray-400 dark:text-gray-500 [ruby-align:center]';

  return {
    monthNum,
    dayNum,
    dowKanji,
    monthNumReading,
    monthKanjiReading,
    dayNumReading,
    dayKanjiReading,
    dowReading,
    englishDate,
    rtClass,
  };
}
