const kuromoji = require('kuromoji');
const path = require('path');

let tokenizerPromise = null;

function getTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({
          dicPath: path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict'),
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

function mapPosToCategory(tokens) {
  if (!tokens || tokens.length === 0) return null;

  // Expression detection: 3+ tokens with mixed POS
  if (tokens.length >= 3) {
    const posTypes = new Set(tokens.map((t) => t.pos));
    if (posTypes.size >= 2) {
      return { lexical_category: 'expression', confidence: 'medium' };
    }
  }

  const primary = tokens[0];
  const pos = primary.pos;
  const posDetail1 = primary.pos_detail_1;
  const posDetail2 = primary.pos_detail_2;
  const conjugationType = primary.conjugated_type;

  // Counter detection: 名詞,接尾,助数詞
  if (pos === '名詞' && posDetail1 === '接尾' && posDetail2 === '助数詞') {
    return { lexical_category: 'counter', confidence: 'high' };
  }

  // Na-adjective detection: 名詞,形容動詞語幹
  if (pos === '名詞' && posDetail1 === '形容動詞語幹') {
    return { lexical_category: 'na-adjective', confidence: 'high' };
  }

  // Pronoun detection: 名詞,代名詞
  if (pos === '名詞' && posDetail1 === '代名詞') {
    return { lexical_category: 'pronoun', confidence: 'high' };
  }

  // Prefix/suffix detection
  if (pos === '接頭詞' || (pos === '名詞' && posDetail1 === '接尾')) {
    return { lexical_category: 'prefix-suffix', confidence: 'high' };
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

    case '連体詞':
      return { lexical_category: 'na-adjective', confidence: 'medium' };

    default:
      return null;
  }
}

async function categorizeWord(kana, kanji) {
  const tokenizer = await getTokenizer();
  const input = kanji || kana;
  if (!input) return null;

  const tokens = tokenizer.tokenize(input);
  if (!tokens || tokens.length === 0) return null;

  // Filter out BOS/EOS markers
  const meaningful = tokens.filter(
    (t) => t.pos !== 'BOS/EOS' && t.surface_form.trim()
  );
  if (meaningful.length === 0) return null;

  return mapPosToCategory(meaningful);
}

async function categorizeBatch(items) {
  const tokenizer = await getTokenizer();
  const results = [];

  for (const item of items) {
    const input = item.kanji || item.kana;
    if (!input) {
      results.push(null);
      continue;
    }

    const tokens = tokenizer.tokenize(input);
    const meaningful = (tokens || []).filter(
      (t) => t.pos !== 'BOS/EOS' && t.surface_form.trim()
    );

    if (meaningful.length === 0) {
      results.push(null);
    } else {
      results.push(mapPosToCategory(meaningful));
    }
  }

  return results;
}

module.exports = { categorizeWord, categorizeBatch, VALID_CATEGORIES };
