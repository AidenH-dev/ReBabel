// pages/api/database/v1/learning_materials/create.js
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

const norm = (s = '') => s.normalize('NFKC').toLowerCase().trim();
const slug = (s = '') => norm(s).replace(/\s+/g, '-');

async function upsertVocab(ownerId, v) {
  // Find existing user-owned vocab by normalized word + meaning
  const { data: found, error: findErr } = await supabaseAdmin
    .from('kb_vocab')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('norm_word', norm(v.word))
    .eq('meaning', v.meaning)
    .limit(1);
  if (findErr) throw findErr;
  if (found?.length) return found[0].id;

  // Insert new
  const { data, error: insErr } = await supabaseAdmin
    .from('kb_vocab')
    .insert({
      owner_id: ownerId,
      word: v.word,
      reading: v.reading || null,
      meaning: v.meaning,
      examples: v.examples || [],
      tags: v.tags || [],
      norm_word: norm(v.word),
    })
    .select('id')
    .single();
  if (insErr) throw insErr;
  return data.id;
}

async function upsertGrammar(ownerId, g) {
  const pointSlug = slug(g.point);
  const { data: found, error: findErr } = await supabaseAdmin
    .from('kb_grammar')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('point_slug', pointSlug)
    .limit(1);
  if (findErr) throw findErr;
  if (found?.length) return found[0].id;

  const { data, error: insErr } = await supabaseAdmin
    .from('kb_grammar')
    .insert({
      owner_id: ownerId,
      point: g.point,
      explanation: g.explanation,
      examples: g.examples || [],
      point_slug: pointSlug,
    })
    .select('id')
    .single();
  if (insErr) throw insErr;
  return data.id;
}

export default withApiAuthRequired(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getSession(req, res);
  const ownerId = session?.user?.sub; // Auth0 user id (string)
  if (!ownerId) return res.status(401).json({ error: 'Not authenticated' });

  const p = req.body; // payload from your Create Learning_material page

  try {
    // 1) Learning_material
    const { data: learning_material, error: cErr } = await supabaseAdmin
      .from('learning_materials')
      .insert({
        owner_id: ownerId,
        title: p.title,
        learning_materials: p.learningMaterials || null,
        institution: p.institution || null,
        description: p.description || null,
        study_goal: p.studyGoal || null,
        start_date: p.startDate || null,
        end_date: p.endDate || null,
        created_at: p.createdAt || new Date().toISOString(),
      })
      .select('*')
      .single();
    if (cErr) throw cErr;

    // 2) Sections + links
    for (let i = 0; i < (p.sections || []).length; i++) {
      const s = p.sections[i];

      const { data: section, error: sErr } = await supabaseAdmin
        .from('sections')
        .insert({
          learning_material_id: learning_material.id,
          title: s.title,
          description: s.description || null,
          order: i,
        })
        .select('*')
        .single();
      if (sErr) throw sErr;

      for (let j = 0; j < (s.vocabulary || []).length; j++) {
        const vId = await upsertVocab(ownerId, s.vocabulary[j]);
        const { error: linkErr } = await supabaseAdmin
          .from('section_vocab')
          .insert({ section_id: section.id, vocab_id: vId, position: j });
        if (linkErr) throw linkErr;
      }

      for (let k = 0; k < (s.grammar || []).length; k++) {
        const gId = await upsertGrammar(ownerId, s.grammar[k]);
        const { error: linkErr } = await supabaseAdmin
          .from('section_grammar')
          .insert({ section_id: section.id, grammar_id: gId, position: k });
        if (linkErr) throw linkErr;
      }
    }

    res.status(200).json({ learning_materialId: learning_material.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create learning_material', details: String(e?.message || e) });
  }
});
