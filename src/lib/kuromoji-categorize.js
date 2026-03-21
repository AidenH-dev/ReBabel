const kuromoji = require('kuromoji');
const path = require('path');

let tokenizerPromise = null;

function getTokenizer() {
  if (!tokenizerPromise) {
    const dictPath = path.join(
      process.cwd(),
      'node_modules',
      'kuromoji',
      'dict'
    );
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({
          dicPath: dictPath,
        })
        .build((err, tokenizer) => {
          if (err) {
            tokenizerPromise = null;
            reject(err);
          } else {
            resolve(tokenizer);
          }
        });
    });
  }
  return tokenizerPromise;
}

const VALID_CATEGORIES = [
  'noun',
  'verb',
  'i-adjective',
  'na-adjective',
  'adverb',
  'particle',
  'counter',
  'conjunction',
  'pronoun',
  'expression',
  'interjection',
  'prefix-suffix',
];

/**
 * Classify tokens into a lexical category.
 * Assumes tokens are already filtered (no BOS/EOS).
 */
function classifyTokens(tokens) {
  if (!tokens || tokens.length === 0) return null;

  // ── Fix 2: お-prefix skip ─────────────────────────────────────
  // When first token is honorific prefix お, classify based on the rest.
  // e.g., おさけ → [お(接頭詞) + さけ(名詞)] → noun
  if (tokens.length >= 2 && tokens[0].pos === '接頭詞') {
    return classifyTokens(tokens.slice(1));
  }

  // ── Fix 1b: する/くる compound detection ───────────────────────
  // If last token is する or くる, the whole word is a verb.
  // e.g., べんきょうする → [べんきょう + する] → verb/irregular
  if (tokens.length >= 2) {
    const last = tokens[tokens.length - 1];
    if (
      last.pos === '動詞' &&
      (last.surface_form === 'する' || last.basic_form === 'する')
    ) {
      return {
        lexical_category: 'verb',
        confidence: 'high',
        verb_group: 'irregular',
      };
    }
    if (
      last.pos === '動詞' &&
      (last.surface_form === 'くる' || last.basic_form === 'くる')
    ) {
      return {
        lexical_category: 'verb',
        confidence: 'high',
        verb_group: 'irregular',
      };
    }
  }

  // ── Fix 3: Expression detection (tightened) ────────────────────
  // Only flag as expression when verb/adjective tokens are mixed with nouns.
  // Pure noun compounds (だいがくせい, ゆうびんきょく) should be noun.
  if (tokens.length >= 3) {
    const hasVerb = tokens.some((t) => t.pos === '動詞');
    const hasAdj = tokens.some(
      (t) => t.pos === '形容詞' || t.pos === '形容動詞'
    );
    const hasNoun = tokens.some((t) => t.pos === '名詞');
    if ((hasVerb || hasAdj) && hasNoun) {
      return { lexical_category: 'expression', confidence: 'medium' };
    }
  }

  // ── Single/primary token classification ────────────────────────
  const primary = tokens[0];
  const pos = primary.pos;
  const posDetail1 = primary.pos_detail_1;
  const posDetail2 = primary.pos_detail_2;
  const conjugationType = primary.conjugated_type;

  // Counter: 名詞,接尾,助数詞
  if (pos === '名詞' && posDetail1 === '接尾' && posDetail2 === '助数詞') {
    return { lexical_category: 'counter', confidence: 'high' };
  }

  // Na-adjective: 名詞,形容動詞語幹
  if (pos === '名詞' && posDetail1 === '形容動詞語幹') {
    return { lexical_category: 'na-adjective', confidence: 'high' };
  }

  // Pronoun: 名詞,代名詞
  if (pos === '名詞' && posDetail1 === '代名詞') {
    return { lexical_category: 'pronoun', confidence: 'high' };
  }

  // Suffix as standalone word → noun (e.g., がく after prefix skip)
  if (pos === '名詞' && posDetail1 === '接尾') {
    return { lexical_category: 'noun', confidence: 'high' };
  }

  switch (pos) {
    case '名詞':
      return { lexical_category: 'noun', confidence: 'high' };

    case '動詞': {
      const result = { lexical_category: 'verb', confidence: 'high' };
      if (conjugationType) {
        if (conjugationType.includes('五段')) {
          result.verb_group = 'godan';
        } else if (conjugationType.includes('一段')) {
          result.verb_group = 'ichidan';
        } else if (
          conjugationType.includes('サ変') ||
          conjugationType.includes('カ変')
        ) {
          result.verb_group = 'irregular';
        }
      }
      return result;
    }

    case '形容詞':
      return { lexical_category: 'i-adjective', confidence: 'high' };

    case '形容動詞':
      return { lexical_category: 'na-adjective', confidence: 'high' };

    case '副詞':
      return { lexical_category: 'adverb', confidence: 'high' };

    case '助詞':
      return { lexical_category: 'particle', confidence: 'high' };

    case '接続詞':
      return { lexical_category: 'conjunction', confidence: 'high' };

    case '感動詞':
      return { lexical_category: 'interjection', confidence: 'high' };

    // ── Fix 4: 連体詞 → noun (not na-adjective) ─────────────────
    // この/その/どの/どんな are determiners, not conjugatable.
    case '連体詞':
      return { lexical_category: 'noun', confidence: 'medium' };

    // Prefix without following tokens (edge case)
    case '接頭詞':
      return { lexical_category: 'noun', confidence: 'low' };

    default:
      return null;
  }
}

async function categorizeWord(kana, kanji) {
  // ── Pre-tokenization checks based on string patterns ──────────

  // If kana contains （な） or (な), it's explicitly a na-adjective.
  if (kana && /[（(]な[）)]/.test(kana)) {
    return { lexical_category: 'na-adjective', confidence: 'high' };
  }

  // ── Fix 1a: する/くる verb detection by string pattern ─────────
  // Strip parenthetical content first for clean matching.
  const cleanKana = kana ? kana.replace(/[（(][^）)]*[）)]/g, '').trim() : null;
  if (cleanKana && cleanKana.endsWith('する')) {
    return {
      lexical_category: 'verb',
      confidence: 'high',
      verb_group: 'irregular',
    };
  }
  if (cleanKana && (cleanKana === 'くる' || cleanKana.endsWith('てくる'))) {
    return {
      lexical_category: 'verb',
      confidence: 'high',
      verb_group: 'irregular',
    };
  }

  const tokenizer = await getTokenizer();

  // Try kanji first (more reliable), then fall back to kana
  const inputs = [kanji, kana].filter(Boolean);
  if (inputs.length === 0) return null;

  for (const input of inputs) {
    const tokens = tokenizer.tokenize(input);
    if (!tokens || tokens.length === 0) continue;

    const meaningful = tokens.filter(
      (t) => t.pos !== 'BOS/EOS' && t.surface_form.trim()
    );
    if (meaningful.length === 0) continue;

    // ── Fix 5: Kana fragmentation guard ──────────────────────────
    // When kuromoji splits kana into 2+ tokens, it's almost always
    // misparse of a single vocabulary word. Skip kana and try kanji,
    // or default to noun if no kanji available.
    if (input === kana && meaningful.length >= 2) {
      // If there's kanji to try, skip kana entirely
      if (kanji) continue;
      // No kanji available -- default to noun for fragmented kana
      return { lexical_category: 'noun', confidence: 'low' };
    }

    // ── Fix 6+7: Kana single-token guards ──────────────────────────
    if (input === kana && !kanji && meaningful.length === 1) {
      const tk = meaningful[0];

      // Fix 7 (must run before Fix 6): く-form adjective → adverb
      // When input ends in く and kuromoji sees i-adjective with basic_form
      // ending in い, AND the stems match, it's the adverbial (く) form.
      // e.g., すごく (stem: すご) → すごい (stem: すご) ✓
      //        にく (stem: に) → にくい (stem: にく) ✗ (different word)
      if (
        tk.pos === '形容詞' &&
        input.endsWith('く') &&
        tk.basic_form &&
        tk.basic_form.endsWith('い') &&
        input.slice(0, -1) === tk.basic_form.slice(0, -1)
      ) {
        return { lexical_category: 'adverb', confidence: 'high' };
      }

      // Fix 6: Kana single-token misparse guard
      // When kana-only produces a single token, check if kuromoji matched
      // a different word (basic_form ≠ input = conjugated form match).
      // e.g., にく → にくい (adj), やま → やむ (verb), くもり → くもる (verb)
      const isVerbOrAdj = tk.pos === '動詞' || tk.pos === '形容詞';
      if (isVerbOrAdj && tk.basic_form && tk.basic_form !== input) {
        return { lexical_category: 'noun', confidence: 'low' };
      }
    }

    return classifyTokens(meaningful);
  }

  return null;
}

async function categorizeBatch(items) {
  const results = [];
  for (const item of items) {
    results.push(await categorizeWord(item.kana, item.kanji));
  }
  return results;
}

module.exports = { categorizeWord, categorizeBatch, VALID_CATEGORIES };
