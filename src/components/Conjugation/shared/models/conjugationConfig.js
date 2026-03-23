export const VERB_FORMS = [
  // Plain forms
  { key: 'dictionary', label: 'Dictionary', japanese: '辞書' },
  { key: 'nai', label: 'Negative', japanese: 'ない' },
  { key: 'ta', label: 'Past', japanese: 'た' },
  { key: 'nakatta', label: 'Past Negative', japanese: 'なかった' },
  { key: 'te', label: 'Te-form', japanese: 'て' },
  // Polite forms
  { key: 'masu', label: 'Masu', japanese: 'ます' },
  { key: 'masen', label: 'Masu Negative', japanese: 'ません' },
  { key: 'mashita', label: 'Masu Past', japanese: 'ました' },
  { key: 'masendeshita', label: 'Masu Past Neg', japanese: 'ませんでした' },
  // Desire
  { key: 'tai', label: 'Tai-form (want)', japanese: 'たい' },
  { key: 'takunai', label: 'Tai Negative', japanese: 'たくない' },
  // Advanced
  { key: 'potential', label: 'Potential', japanese: '可能' },
  { key: 'passive', label: 'Passive', japanese: '受身' },
  { key: 'causative', label: 'Causative', japanese: '使役' },
  { key: 'causativePassive', label: 'Causative-passive', japanese: '使役受身' },
  { key: 'imperative', label: 'Imperative', japanese: '命令' },
  { key: 'volitional', label: 'Volitional', japanese: '意向' },
  { key: 'conditional', label: 'Conditional (ば)', japanese: '条件' },
  { key: 'tara', label: 'Conditional (たら)', japanese: 'たら' },
];

export const ADJECTIVE_FORMS = [
  { key: 'PresentAffirmative', label: 'Present Affirmative', japanese: '基本' },
  { key: 'PresentNegative', label: 'Present Negative', japanese: 'ない' },
  { key: 'PastAffirmative', label: 'Past Affirmative', japanese: 'かった' },
  { key: 'PastNegative', label: 'Past Negative', japanese: 'くなかった' },
  { key: 'TeForm', label: 'Te-form', japanese: 'くて' },
  { key: 'Adverbial', label: 'Adverbial', japanese: 'く/に' },
];

export const CONJUGATABLE_CATEGORIES = ['verb', 'i-adjective', 'na-adjective'];

export function createInitialVerbOptions() {
  return VERB_FORMS.reduce((acc, { key }) => ({ ...acc, [key]: false }), {});
}

export function createInitialAdjectiveOptions() {
  return ADJECTIVE_FORMS.reduce(
    (acc, { key }) => ({ ...acc, [key]: false }),
    {}
  );
}

export function getSelectedFormCount(options) {
  return Object.values(options).filter(Boolean).length;
}

export function filterConjugatableItems(items) {
  return (items || []).filter(
    (item) =>
      item.lexical_category &&
      CONJUGATABLE_CATEGORIES.includes(item.lexical_category)
  );
}
