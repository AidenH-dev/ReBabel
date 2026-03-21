#!/usr/bin/env node
/**
 * Build script: Extract conjugatable JLPT vocabulary from jlpt-jmdict-merge.json
 * into compact per-level JSON files for the public conjugation practice page.
 *
 * No kuromoji needed -- uses JMdict POS codes directly.
 *
 * Usage: node scripts/build-conjugation-data.js
 * Output: public/data/conjugation/n{1-5}.json
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(
  __dirname,
  '..',
  '..',
  'japanese-dict-dbs',
  'jlpt-jmdict-merge.json'
);
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'conjugation');

// Skip gracefully if source file doesn't exist (e.g., on Vercel where data is pre-committed)
if (!fs.existsSync(INPUT)) {
  console.log(
    'Source file not found, skipping build (data files should already exist in public/)'
  );
  process.exit(0);
}

// JMdict POS code → { category, verb_group }
function classifyPos(posArray) {
  if (!Array.isArray(posArray)) return null;

  for (const code of posArray) {
    if (code === 'v1' || code === 'v1-s') return { c: 'verb', g: 'ichidan' };
    if (code.startsWith('v5')) return { c: 'verb', g: 'godan' };
    if (code === 'vs' || code === 'vs-i' || code === 'vs-s')
      return { c: 'verb', g: 'irregular' };
    if (code === 'vk') return { c: 'verb', g: 'irregular' };
    if (code === 'adj-i' || code === 'adj-ix') return { c: 'i-adjective' };
    if (code === 'adj-na') return { c: 'na-adjective' };
  }
  return null;
}

// Main
const raw = fs.readFileSync(INPUT, 'utf8');
const data = JSON.parse(raw);
const words = data.words;

console.log(`Read ${words.length} entries from jlpt-jmdict-merge.json`);

const levels = { 1: [], 2: [], 3: [], 4: [], 5: [] };

for (const word of words) {
  const level = word.jlpt_level;
  if (!level || !levels[level]) continue;

  // Try each sense for a conjugatable POS
  let classification = null;
  for (const sense of word.sense || []) {
    classification = classifyPos(sense.partOfSpeech);
    if (classification) break;
  }
  if (!classification) continue;

  // Extract fields
  const kana = word.kana?.[0]?.text;
  if (!kana) continue;

  const kanji = word.kanji?.[0]?.text || null;

  // Get first English gloss, truncate
  let english = '';
  for (const sense of word.sense || []) {
    const gloss = sense.gloss?.find((g) => g.lang === 'eng');
    if (gloss) {
      english = gloss.text;
      break;
    }
  }
  if (english.length > 60) english = english.slice(0, 57) + '...';

  // For する verbs stored as nouns (e.g., 勉強 with POS "vs"),
  // append する to the kana so the conjugation engine works
  let finalKana = kana;
  if (
    classification.g === 'irregular' &&
    !kana.endsWith('する') &&
    !kana.endsWith('くる')
  ) {
    finalKana = kana + 'する';
  }

  const entry = {
    k: finalKana,
    j: kanji,
    e: english,
    c: classification.c,
  };
  if (classification.g) entry.g = classification.g;

  levels[level].push(entry);
}

// Write output files
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let totalOut = 0;
for (const [level, items] of Object.entries(levels)) {
  const outPath = path.join(OUTPUT_DIR, `n${level}.json`);
  fs.writeFileSync(outPath, JSON.stringify(items));
  const sizeKB = (Buffer.byteLength(JSON.stringify(items)) / 1024).toFixed(1);
  const verbs = items.filter((i) => i.c === 'verb').length;
  const iAdj = items.filter((i) => i.c === 'i-adjective').length;
  const naAdj = items.filter((i) => i.c === 'na-adjective').length;
  console.log(
    `N${level}: ${items.length} items (${verbs}v, ${iAdj}i, ${naAdj}na) → ${sizeKB} KB`
  );
  totalOut += items.length;
}

console.log(`Total: ${totalOut} conjugatable items`);
