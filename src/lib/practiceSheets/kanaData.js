export const HIRAGANA_ROWS = [
  {
    id: 'vowels',
    label: 'Vowels (a-row)',
    chars: ['あ', 'い', 'う', 'え', 'お'],
  },
  { id: 'ka', label: 'Ka-row', chars: ['か', 'き', 'く', 'け', 'こ'] },
  { id: 'sa', label: 'Sa-row', chars: ['さ', 'し', 'す', 'せ', 'そ'] },
  { id: 'ta', label: 'Ta-row', chars: ['た', 'ち', 'つ', 'て', 'と'] },
  { id: 'na', label: 'Na-row', chars: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { id: 'ha', label: 'Ha-row', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  { id: 'ma', label: 'Ma-row', chars: ['ま', 'み', 'む', 'め', 'も'] },
  { id: 'ya', label: 'Ya-row', chars: ['や', 'ゆ', 'よ'] },
  { id: 'ra', label: 'Ra-row', chars: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { id: 'wa', label: 'Wa-row', chars: ['わ', 'を', 'ん'] },
  {
    id: 'ga',
    label: 'Ga-row',
    chars: ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
    group: 'dakuten',
  },
  {
    id: 'za',
    label: 'Za-row',
    chars: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
    group: 'dakuten',
  },
  {
    id: 'da',
    label: 'Da-row',
    chars: ['だ', 'ぢ', 'づ', 'で', 'ど'],
    group: 'dakuten',
  },
  {
    id: 'ba',
    label: 'Ba-row',
    chars: ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
    group: 'dakuten',
  },
  {
    id: 'pa',
    label: 'Pa-row',
    chars: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
    group: 'handakuten',
  },
];

export const KATAKANA_ROWS = [
  {
    id: 'vowels',
    label: 'Vowels (a-row)',
    chars: ['ア', 'イ', 'ウ', 'エ', 'オ'],
  },
  { id: 'ka', label: 'Ka-row', chars: ['カ', 'キ', 'ク', 'ケ', 'コ'] },
  { id: 'sa', label: 'Sa-row', chars: ['サ', 'シ', 'ス', 'セ', 'ソ'] },
  { id: 'ta', label: 'Ta-row', chars: ['タ', 'チ', 'ツ', 'テ', 'ト'] },
  { id: 'na', label: 'Na-row', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { id: 'ha', label: 'Ha-row', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'] },
  { id: 'ma', label: 'Ma-row', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { id: 'ya', label: 'Ya-row', chars: ['ヤ', 'ユ', 'ヨ'] },
  { id: 'ra', label: 'Ra-row', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { id: 'wa', label: 'Wa-row', chars: ['ワ', 'ヲ', 'ン'] },
  {
    id: 'ga',
    label: 'Ga-row',
    chars: ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
    group: 'dakuten',
  },
  {
    id: 'za',
    label: 'Za-row',
    chars: ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
    group: 'dakuten',
  },
  {
    id: 'da',
    label: 'Da-row',
    chars: ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
    group: 'dakuten',
  },
  {
    id: 'ba',
    label: 'Ba-row',
    chars: ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],
    group: 'dakuten',
  },
  {
    id: 'pa',
    label: 'Pa-row',
    chars: ['パ', 'ピ', 'プ', 'ペ', 'ポ'],
    group: 'handakuten',
  },
];

const BASIC_ROW_IDS = [
  'vowels',
  'ka',
  'sa',
  'ta',
  'na',
  'ha',
  'ma',
  'ya',
  'ra',
  'wa',
];
const DAKUTEN_ROW_IDS = ['ga', 'za', 'da', 'ba'];
const HANDAKUTEN_ROW_IDS = ['pa'];

export const PRESETS = {
  full: {
    label: 'Full',
    rowIds: [...BASIC_ROW_IDS, ...DAKUTEN_ROW_IDS, ...HANDAKUTEN_ROW_IDS],
  },
  vowels: { label: 'Vowels', rowIds: ['vowels'] },
  basic: { label: 'Basic', rowIds: BASIC_ROW_IDS },
  dakuten: { label: 'Dakuten', rowIds: DAKUTEN_ROW_IDS },
  handakuten: { label: 'Handakuten', rowIds: HANDAKUTEN_ROW_IDS },
};
