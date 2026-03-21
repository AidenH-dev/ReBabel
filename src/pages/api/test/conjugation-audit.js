/**
 * Test endpoint: Exhaustively tests the conjugation engine against all JLPT data.
 *
 * GET /api/test/conjugation-audit?level=5
 * GET /api/test/conjugation-audit?level=all
 *
 * Returns a full audit report with every word × every form tested.
 * This endpoint is for development testing only.
 */

import fs from 'fs';
import path from 'path';
import { conjugate, generateQuestions } from '@/lib/conjugation';

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
  const levelParam = req.query.level || 'all';
  const levels =
    levelParam === 'all' ? [5, 4, 3, 2, 1] : [parseInt(levelParam, 10)];

  const report = {
    timestamp: new Date().toISOString(),
    levels: {},
    totals: { tests: 0, passed: 0, errors: 0, warnings: 0 },
    errors: [],
    warnings: [],
  };

  for (const n of levels) {
    const filePath = path.join(
      process.cwd(),
      'public',
      'data',
      'conjugation',
      `n${n}.json`
    );
    let items;
    try {
      items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      report.errors.push({ level: n, issue: 'Could not read data file' });
      continue;
    }

    const levelReport = {
      items: items.length,
      tests: 0,
      passed: 0,
      errors: 0,
      warnings: 0,
    };

    for (const item of items) {
      const forms = item.c === 'verb' ? VERB_FORMS : ADJ_FORMS;

      for (const form of forms) {
        levelReport.tests++;
        report.totals.tests++;

        try {
          const result = conjugate(item.k, item.c, item.g || null, form);

          // ERROR: null/undefined answer
          if (!result || !result.answer) {
            const err = {
              level: n,
              word: item.k,
              kanji: item.j,
              category: item.c,
              verbGroup: item.g,
              form,
              issue: 'null/undefined answer',
            };
            report.errors.push(err);
            levelReport.errors++;
            report.totals.errors++;
            continue;
          }

          // ERROR: 'null' or 'undefined' string contamination
          if (
            result.answer.includes('null') ||
            result.answer.includes('undefined') ||
            result.answer.includes('NaN')
          ) {
            const err = {
              level: n,
              word: item.k,
              kanji: item.j,
              category: item.c,
              verbGroup: item.g,
              form,
              issue: 'string contamination',
              answer: result.answer,
            };
            report.errors.push(err);
            levelReport.errors++;
            report.totals.errors++;
            continue;
          }

          // ERROR: empty answer
          if (result.answer.trim() === '') {
            const err = {
              level: n,
              word: item.k,
              kanji: item.j,
              category: item.c,
              verbGroup: item.g,
              form,
              issue: 'empty answer',
            };
            report.errors.push(err);
            levelReport.errors++;
            report.totals.errors++;
            continue;
          }

          // ERROR: answer not in acceptableAnswers
          if (
            !result.acceptableAnswers ||
            !result.acceptableAnswers.includes(result.answer)
          ) {
            const err = {
              level: n,
              word: item.k,
              form,
              issue: 'answer not in acceptableAnswers',
              answer: result.answer,
              acceptableAnswers: result.acceptableAnswers,
            };
            report.errors.push(err);
            levelReport.errors++;
            report.totals.errors++;
            continue;
          }

          // WARNING: answer same as dictionary form for non-dictionary forms
          if (
            form !== 'dictionary' &&
            form !== 'PresentAffirmative' &&
            result.answer === item.k
          ) {
            const warn = {
              level: n,
              word: item.k,
              form,
              issue: 'answer identical to dictionary form',
              answer: result.answer,
            };
            report.warnings.push(warn);
            levelReport.warnings++;
            report.totals.warnings++;
          }

          // WARNING: suspiciously short (1 char) for non-imperative forms
          if (
            form !== 'imperative' &&
            form !== 'dictionary' &&
            result.answer.length <= 1
          ) {
            const warn = {
              level: n,
              word: item.k,
              form,
              issue: 'answer is 1 char or less',
              answer: result.answer,
            };
            report.warnings.push(warn);
            levelReport.warnings++;
            report.totals.warnings++;
          }

          levelReport.passed++;
          report.totals.passed++;
        } catch (err) {
          const error = {
            level: n,
            word: item.k,
            kanji: item.j,
            category: item.c,
            verbGroup: item.g,
            form,
            issue: 'threw exception',
            error: err.message,
          };
          report.errors.push(error);
          levelReport.errors++;
          report.totals.errors++;
        }
      }
    }

    // Also test generateQuestions with random mode to check it doesn't crash
    try {
      const mapped = items.map((i) => ({
        kana: i.k,
        kanji: i.j,
        english: i.e,
        lexical_category: i.c,
        verb_group: i.g || null,
      }));
      const qs = generateQuestions(mapped, null, null, 50, true);
      levelReport.generateQuestions = {
        randomMode: true,
        generated: qs.length,
        status: 'ok',
      };

      // Verify each generated question has valid answers
      for (const q of qs) {
        if (!q.expectedAnswer || q.expectedAnswer.includes('null')) {
          report.errors.push({
            level: n,
            word: q.word.kana,
            form: q.form.key,
            issue: 'generateQuestions produced bad answer',
            answer: q.expectedAnswer,
          });
          levelReport.errors++;
          report.totals.errors++;
        }
      }
    } catch (err) {
      levelReport.generateQuestions = { status: 'error', error: err.message };
      report.errors.push({
        level: n,
        issue: 'generateQuestions crashed',
        error: err.message,
      });
      report.totals.errors++;
    }

    report.levels[`N${n}`] = levelReport;
  }

  res.status(200).json(report);
}
