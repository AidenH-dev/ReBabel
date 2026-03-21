/**
 * Conjugation Engine
 *
 * Deterministic Japanese verb and adjective conjugation.
 * No LLM -- all rules are well-defined, grading is exact string match.
 *
 * Exports:
 *   conjugate(kana, category, verbGroup, form) -> { answer, acceptableAnswers }
 *   generateQuestions(items, selectedVerbForms, selectedAdjForms, count, randomMode) -> questions[]
 */

// ─── Godan stem map ──────────────────────────────────────────────
// Maps dictionary-form ending -> replacement kana for each stem type
const GODAN_STEM_MAP = {
  //        a      i      e      o
  う: { a: 'わ', i: 'い', e: 'え', o: 'お' },
  く: { a: 'か', i: 'き', e: 'け', o: 'こ' },
  ぐ: { a: 'が', i: 'ぎ', e: 'げ', o: 'ご' },
  す: { a: 'さ', i: 'し', e: 'せ', o: 'そ' },
  つ: { a: 'た', i: 'ち', e: 'て', o: 'と' },
  ぬ: { a: 'な', i: 'に', e: 'ね', o: 'の' },
  ぶ: { a: 'ば', i: 'び', e: 'べ', o: 'ぼ' },
  む: { a: 'ま', i: 'み', e: 'め', o: 'も' },
  る: { a: 'ら', i: 'り', e: 'れ', o: 'ろ' },
};

// Te/Ta form suffix grouping
const GODAN_TE_MAP = {
  う: 'って',
  つ: 'って',
  る: 'って',
  ぬ: 'んで',
  ぶ: 'んで',
  む: 'んで',
  く: 'いて',
  ぐ: 'いで',
  す: 'して',
};

const GODAN_TA_MAP = {
  う: 'った',
  つ: 'った',
  る: 'った',
  ぬ: 'んだ',
  ぶ: 'んだ',
  む: 'んだ',
  く: 'いた',
  ぐ: 'いだ',
  す: 'した',
};

// ─── Helper: get godan stem ──────────────────────────────────────
function godanStem(kana, stemType) {
  if (!kana) return kana;
  const ending = kana.slice(-1);
  const base = kana.slice(0, -1);
  const map = GODAN_STEM_MAP[ending];
  if (!map) return base; // fallback: return base without mapping
  return base + map[stemType];
}

// ─── Special godan verb exceptions ──────────────────────────────
// Honorific ある-verbs: masu-form uses い-stem instead of り-stem
// e.g., いらっしゃる → いらっしゃいます (not いらっしゃります)
const HONORIFIC_ARU_VERBS = new Set([
  'いらっしゃる',
  'おっしゃる',
  'くださる',
  'なさる',
  'ござる',
]);

// ─── Verb conjugation ────────────────────────────────────────────
function conjugateVerb(kana, verbGroup, form) {
  // If verb_group is explicitly godan or ichidan, use those rules directly.
  // This prevents mismatches like 刷る (する, godan) being treated as irregular する.
  if (verbGroup === 'godan') {
    return conjugateGodan(kana, form);
  }

  if (verbGroup === 'ichidan') {
    return conjugateIchidan(kana, form);
  }

  // Handle する compounds (only when not explicitly godan/ichidan)
  if (kana.endsWith('する')) {
    return conjugateSuru(kana, form);
  }

  // Handle くる
  if (kana === 'くる' || kana === 'クル') {
    return conjugateKuru(kana, form);
  }

  if (verbGroup === 'irregular') {
    // Irregular verb whose kana doesn't already end in する/くる --
    // most likely a する compound noun stored without する (e.g. りょうり → りょうりする)
    return conjugateSuru(kana + 'する', form);
  }

  // Fallback: infer from kana ending
  if (kana.endsWith('する')) {
    return conjugateSuru(kana, form);
  }
  if (kana === 'くる') {
    return conjugateKuru(kana, form);
  }
  if (kana.endsWith('る')) {
    // Without explicit group, guess ichidan for る-ending
    return conjugateIchidan(kana, form);
  }
  return conjugateGodan(kana, form);
}

// ─── Godan conjugation ──────────────────────────────────────────
function conjugateGodan(kana, form) {
  const ending = kana.slice(-1);
  const base = kana.slice(0, -1);
  const isIku = kana === 'いく' || kana === 'ゆく';
  const isAru = kana === 'ある';
  const isHonorificAru = HONORIFIC_ARU_VERBS.has(kana);

  // Honorific ある-verbs use い-stem for masu/tai forms instead of り-stem
  const iStem = isHonorificAru ? base + 'い' : godanStem(kana, 'i');

  // Helper: get ta-form for tara conditional
  const taForm = () => {
    if (isIku) return 'いった';
    return base + (GODAN_TA_MAP[ending] || 'た');
  };

  switch (form) {
    case 'dictionary':
      return { answer: kana, acceptableAnswers: [kana] };

    // Plain forms
    case 'nai':
      // ある → ない (not あらない)
      if (isAru) return simple('ない');
      return simple(godanStem(kana, 'a') + 'ない');
    case 'ta':
      return simple(taForm());
    case 'nakatta':
      if (isAru) return simple('なかった');
      return simple(godanStem(kana, 'a') + 'なかった');
    case 'te':
      if (isIku) return simple('いって');
      return simple(base + (GODAN_TE_MAP[ending] || 'て'));

    // Polite forms (use iStem for honorific ある-verbs)
    case 'masu':
      return simple(iStem + 'ます');
    case 'masen':
      return simple(iStem + 'ません');
    case 'mashita':
      return simple(iStem + 'ました');
    case 'masendeshita':
      return simple(iStem + 'ませんでした');

    // Desire
    case 'tai':
      return simple(iStem + 'たい');
    case 'takunai':
      return simple(iStem + 'たくない');

    // Advanced
    case 'potential':
      return simple(godanStem(kana, 'e') + 'る');
    case 'imperative':
      return simple(godanStem(kana, 'e'));
    case 'volitional':
      return simple(godanStem(kana, 'o') + 'う');
    case 'conditional':
      return simple(godanStem(kana, 'e') + 'ば');
    case 'tara':
      return simple(taForm() + 'ら');
    case 'passive':
      return simple(godanStem(kana, 'a') + 'れる');
    case 'causative':
      return simple(godanStem(kana, 'a') + 'せる');
    case 'causativePassive': {
      const full = godanStem(kana, 'a') + 'せられる';
      const contracted = godanStem(kana, 'a') + 'される';
      return { answer: full, acceptableAnswers: [full, contracted] };
    }

    default:
      return simple(kana);
  }
}

// ─── Ichidan conjugation ────────────────────────────────────────
function conjugateIchidan(kana, form) {
  // drop る; guard against kana not ending in る
  const stem = kana.endsWith('る') ? kana.slice(0, -1) : kana;

  switch (form) {
    case 'dictionary':
      return simple(kana);

    // Plain forms
    case 'nai':
      return simple(stem + 'ない');
    case 'ta':
      return simple(stem + 'た');
    case 'nakatta':
      return simple(stem + 'なかった');
    case 'te':
      return simple(stem + 'て');

    // Polite forms
    case 'masu':
      return simple(stem + 'ます');
    case 'masen':
      return simple(stem + 'ません');
    case 'mashita':
      return simple(stem + 'ました');
    case 'masendeshita':
      return simple(stem + 'ませんでした');

    // Desire
    case 'tai':
      return simple(stem + 'たい');
    case 'takunai':
      return simple(stem + 'たくない');

    // Advanced
    case 'potential': {
      // Accept both full (られる) and short (れる) potential forms
      const full = stem + 'られる';
      const short = stem + 'れる';
      return { answer: full, acceptableAnswers: [full, short] };
    }
    case 'imperative':
      // くれる → くれ (not くれろ) -- the only ichidan verb with this exception
      if (kana === 'くれる') return simple('くれ');
      return simple(stem + 'ろ');
    case 'volitional':
      return simple(stem + 'よう');
    case 'conditional':
      return simple(stem + 'れば');
    case 'tara':
      return simple(stem + 'たら');
    case 'passive':
      return simple(stem + 'られる');
    case 'causative':
      return simple(stem + 'させる');
    case 'causativePassive':
      return simple(stem + 'させられる');

    default:
      return simple(kana);
  }
}

// ─── する conjugation ───────────────────────────────────────────
function conjugateSuru(kana, form) {
  const prefix = kana.slice(0, -2); // everything before する

  switch (form) {
    case 'dictionary':
      return simple(kana);

    // Plain forms
    case 'nai':
      return simple(prefix + 'しない');
    case 'ta':
      return simple(prefix + 'した');
    case 'nakatta':
      return simple(prefix + 'しなかった');
    case 'te':
      return simple(prefix + 'して');

    // Polite forms
    case 'masu':
      return simple(prefix + 'します');
    case 'masen':
      return simple(prefix + 'しません');
    case 'mashita':
      return simple(prefix + 'しました');
    case 'masendeshita':
      return simple(prefix + 'しませんでした');

    // Desire
    case 'tai':
      return simple(prefix + 'したい');
    case 'takunai':
      return simple(prefix + 'したくない');

    // Advanced
    case 'potential':
      return simple(prefix + 'できる');
    case 'imperative':
      return simple(prefix + 'しろ');
    case 'volitional':
      return simple(prefix + 'しよう');
    case 'conditional':
      return simple(prefix + 'すれば');
    case 'tara':
      return simple(prefix + 'したら');
    case 'passive':
      return simple(prefix + 'される');
    case 'causative':
      return simple(prefix + 'させる');
    case 'causativePassive':
      return simple(prefix + 'させられる');

    default:
      return simple(kana);
  }
}

// ─── くる conjugation ───────────────────────────────────────────
function conjugateKuru(_kana, form) {
  switch (form) {
    case 'dictionary':
      return simple('くる');

    // Plain forms
    case 'nai':
      return simple('こない');
    case 'ta':
      return simple('きた');
    case 'nakatta':
      return simple('こなかった');
    case 'te':
      return simple('きて');

    // Polite forms
    case 'masu':
      return simple('きます');
    case 'masen':
      return simple('きません');
    case 'mashita':
      return simple('きました');
    case 'masendeshita':
      return simple('きませんでした');

    // Desire
    case 'tai':
      return simple('きたい');
    case 'takunai':
      return simple('きたくない');

    // Advanced
    case 'potential':
      return simple('こられる');
    case 'imperative':
      return simple('こい');
    case 'volitional':
      return simple('こよう');
    case 'conditional':
      return simple('くれば');
    case 'tara':
      return simple('きたら');
    case 'passive':
      return simple('こられる');
    case 'causative':
      return simple('こさせる');
    case 'causativePassive':
      return simple('こさせられる');

    default:
      return simple('くる');
  }
}

// ─── I-adjective conjugation ─────────────────────────────────────
function conjugateIAdjective(kana, form) {
  // Handle いい/よい special case
  const isIi = kana === 'いい' || kana === 'よい';
  const stem = isIi ? 'よ' : kana.slice(0, -1); // drop い

  switch (form) {
    case 'PresentAffirmative':
      return simple(isIi ? 'いい' : kana);

    case 'PresentNegative':
      return simple(stem + 'くない');

    case 'PastAffirmative':
      return simple(stem + 'かった');

    case 'PastNegative':
      return simple(stem + 'くなかった');

    case 'TeForm':
      return simple(stem + 'くて');

    case 'Adverbial':
      return simple(stem + 'く');

    default:
      return simple(kana);
  }
}

// ─── Na-adjective conjugation ────────────────────────────────────
function conjugateNaAdjective(kana, form) {
  // kana is the stem (without な)
  const stem = kana.endsWith('な') ? kana.slice(0, -1) : kana;

  switch (form) {
    case 'PresentAffirmative':
      return simple(stem + 'だ');

    case 'PresentNegative':
      return simple(stem + 'じゃない');

    case 'PastAffirmative':
      return simple(stem + 'だった');

    case 'PastNegative':
      return simple(stem + 'じゃなかった');

    case 'TeForm':
      return simple(stem + 'で');

    case 'Adverbial':
      return simple(stem + 'に');

    default:
      return simple(kana);
  }
}

// ─── Helpers ────────────────────────────────────────────────────
function simple(answer) {
  return { answer, acceptableAnswers: [answer] };
}

/** Strip parenthetical annotations from kana: きらい（な） → きらい */
function cleanKana(kana) {
  if (!kana) return kana;
  return kana.replace(/[（(][^）)]*[）)]/g, '').trim();
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Conjugate a word to the given form.
 *
 * @param {string} kana - Dictionary form in kana
 * @param {string} category - 'verb' | 'i-adjective' | 'na-adjective'
 * @param {string} verbGroup - 'godan' | 'ichidan' | 'irregular' (for verbs)
 * @param {string} form - The target conjugation form key
 * @returns {{ answer: string, acceptableAnswers: string[] }}
 */
export function conjugate(kana, category, verbGroup, form) {
  const cleaned = cleanKana(kana);
  if (!cleaned) return simple('');
  if (category === 'verb') {
    return conjugateVerb(cleaned, verbGroup, form);
  }
  if (category === 'i-adjective') {
    return conjugateIAdjective(cleaned, form);
  }
  if (category === 'na-adjective') {
    return conjugateNaAdjective(cleaned, form);
  }
  return simple(cleaned);
}

/**
 * Generate conjugation questions from a pool of items.
 *
 * @param {Array} items - Pool items with { kana, kanji, english, lexical_category, verb_group }
 * @param {string[]|null} selectedVerbForms - Array of verb form keys, or null for random
 * @param {string[]|null} selectedAdjForms - Array of adjective form keys, or null for random
 * @param {number} count - How many questions to generate
 * @param {boolean} randomMode - If true, randomly assign forms per item
 * @returns {Array} Array of question objects
 */
export function generateQuestions(
  items,
  selectedVerbForms,
  selectedAdjForms,
  count,
  randomMode
) {
  // Form key/label definitions (must stay in sync with conjugationConfig.js)
  const VERB_FORM_KEYS = [
    'dictionary',
    'nai',
    'ta',
    'nakatta',
    'te',
    'masu',
    'masen',
    'mashita',
    'masendeshita',
    'tai',
    'takunai',
    'potential',
    'passive',
    'causative',
    'causativePassive',
    'imperative',
    'volitional',
    'conditional',
    'tara',
  ];
  const ADJ_FORM_KEYS = [
    'PresentAffirmative',
    'PresentNegative',
    'PastAffirmative',
    'PastNegative',
    'TeForm',
    'Adverbial',
  ];

  const VERB_FORM_LABELS = {
    dictionary: { label: 'Dictionary', japanese: '辞書' },
    nai: { label: 'Negative', japanese: 'ない' },
    ta: { label: 'Past', japanese: 'た' },
    nakatta: { label: 'Past Negative', japanese: 'なかった' },
    te: { label: 'Te-form', japanese: 'て' },
    masu: { label: 'Masu', japanese: 'ます' },
    masen: { label: 'Masu Negative', japanese: 'ません' },
    mashita: { label: 'Masu Past', japanese: 'ました' },
    masendeshita: { label: 'Masu Past Neg', japanese: 'ませんでした' },
    tai: { label: 'Tai-form (want)', japanese: 'たい' },
    takunai: { label: 'Tai Negative', japanese: 'たくない' },
    potential: { label: 'Potential', japanese: '可能' },
    passive: { label: 'Passive', japanese: '受身' },
    causative: { label: 'Causative', japanese: '使役' },
    causativePassive: { label: 'Causative-passive', japanese: '使役受身' },
    imperative: { label: 'Imperative', japanese: '命令' },
    volitional: { label: 'Volitional', japanese: '意向' },
    conditional: { label: 'Conditional (ば)', japanese: '条件' },
    tara: { label: 'Conditional (たら)', japanese: 'たら' },
  };
  const ADJ_FORM_LABELS = {
    PresentAffirmative: { label: 'Present Affirmative', japanese: '基本' },
    PresentNegative: { label: 'Present Negative', japanese: 'ない' },
    PastAffirmative: { label: 'Past Affirmative', japanese: 'かった' },
    PastNegative: { label: 'Past Negative', japanese: 'くなかった' },
    TeForm: { label: 'Te-form', japanese: 'くて' },
    Adverbial: { label: 'Adverbial', japanese: 'く/に' },
  };

  // Separate items by category, skip items without kana
  const verbs = items.filter((i) => i.lexical_category === 'verb' && i.kana);
  const iAdjs = items.filter(
    (i) => i.lexical_category === 'i-adjective' && i.kana
  );
  const naAdjs = items.filter(
    (i) => i.lexical_category === 'na-adjective' && i.kana
  );

  // Build (item, form) pairs
  const pairs = [];

  // Verb pairs
  if (verbs.length > 0) {
    const verbForms = randomMode ? null : selectedVerbForms || [];

    for (const item of verbs) {
      if (randomMode) {
        // Pick a random form for this item
        const form =
          VERB_FORM_KEYS[Math.floor(Math.random() * VERB_FORM_KEYS.length)];
        pairs.push({ item, formKey: form, formInfo: VERB_FORM_LABELS[form] });
      } else {
        for (const formKey of verbForms) {
          pairs.push({ item, formKey, formInfo: VERB_FORM_LABELS[formKey] });
        }
      }
    }
  }

  // Adjective pairs (both i-adj and na-adj use the same form set)
  const adjectives = [...iAdjs, ...naAdjs];
  if (adjectives.length > 0) {
    const adjForms = randomMode ? null : selectedAdjForms || [];

    for (const item of adjectives) {
      if (randomMode) {
        const form =
          ADJ_FORM_KEYS[Math.floor(Math.random() * ADJ_FORM_KEYS.length)];
        pairs.push({ item, formKey: form, formInfo: ADJ_FORM_LABELS[form] });
      } else {
        for (const formKey of adjForms) {
          pairs.push({ item, formKey, formInfo: ADJ_FORM_LABELS[formKey] });
        }
      }
    }
  }

  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  // Slice to count
  const selected = pairs.slice(0, count);

  // Generate questions
  const questions = [];
  for (const { item, formKey, formInfo } of selected) {
    const result = conjugate(
      item.kana,
      item.lexical_category,
      item.verb_group,
      formKey
    );

    questions.push({
      word: {
        kana: item.kana,
        kanji: item.kanji || null,
        english: item.english || '',
        lexical_category: item.lexical_category,
        verb_group: item.verb_group || null,
      },
      form: {
        key: formKey,
        label: formInfo.label,
        japanese: formInfo.japanese,
      },
      expectedAnswer: result.answer,
      acceptableAnswers: result.acceptableAnswers,
    });
  }

  return questions;
}
