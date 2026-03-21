/**
 * Test endpoint: Outputs full conjugation tables for sampled words per level.
 * Designed for Claude to review as a QA tester.
 *
 * GET /api/test/conjugation-samples?level=5&sample=20
 */

import fs from 'fs';
import path from 'path';
import { conjugate } from '@/lib/conjugation';

const VERB_FORMS = [
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

const ADJ_FORMS = [
  'PresentAffirmative',
  'PresentNegative',
  'PastAffirmative',
  'PastNegative',
  'TeForm',
  'Adverbial',
];

export default function handler(req, res) {
  const level = parseInt(req.query.level || '5', 10);
  const sampleSize = parseInt(req.query.sample || '30', 10);

  const filePath = path.join(
    process.cwd(),
    'public',
    'data',
    'conjugation',
    `n${level}.json`
  );
  let items;
  try {
    items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return res.status(404).json({ error: 'Level data not found' });
  }

  // Sample evenly across categories
  const verbs = items.filter((i) => i.c === 'verb');
  const iAdjs = items.filter((i) => i.c === 'i-adjective');
  const naAdjs = items.filter((i) => i.c === 'na-adjective');

  // Take proportional samples, ensuring at least a few of each
  const verbSample = Math.max(3, Math.floor(sampleSize * 0.6));
  const iAdjSample = Math.max(2, Math.floor(sampleSize * 0.2));
  const naAdjSample = Math.max(2, Math.floor(sampleSize * 0.2));

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const sampled = [
    ...shuffle(verbs).slice(0, verbSample),
    ...shuffle(iAdjs).slice(0, iAdjSample),
    ...shuffle(naAdjs).slice(0, naAdjSample),
  ];

  const results = sampled.map((item) => {
    const forms = item.c === 'verb' ? VERB_FORMS : ADJ_FORMS;
    const conjugations = {};

    for (const form of forms) {
      const result = conjugate(item.k, item.c, item.g || null, form);
      conjugations[form] = {
        answer: result.answer,
        alts:
          result.acceptableAnswers.length > 1
            ? result.acceptableAnswers.filter((a) => a !== result.answer)
            : undefined,
      };
    }

    return {
      kana: item.k,
      kanji: item.j,
      english: item.e,
      category: item.c,
      verbGroup: item.g || null,
      conjugations,
    };
  });

  res.status(200).json({
    level: `N${level}`,
    sampled: results.length,
    totalInLevel: items.length,
    results,
  });
}
