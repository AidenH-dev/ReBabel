// pages/api/database/v1/learning_materials/[id]/sections.js
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';

const norm = (s = '') => s.normalize('NFKC').toLowerCase().trim();
const slug = (s = '') => norm(s).replace(/\s+/g, '-');

async function upsertVocab(ownerId, v) {
  const { data: found, error: findErr } = await supabaseAdmin
    .from('kb_vocab')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('norm_word', norm(v.word))
    .eq('meaning', v.meaning)
    .limit(1);
  if (findErr) throw findErr;
  if (found?.length) return found[0].id;

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
  const { user } = await getSession(req, res);
  const ownerId = user?.sub;
  const { id: learning_materialId } = req.query;

  if (!ownerId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Verify learning_material ownership
    const { data: learning_material, error: cErr } = await supabaseAdmin
      .from('learning_materials')
      .select('id')
      .eq('id', learning_materialId)
      .eq('owner_id', ownerId)
      .single();

    if (cErr || !learning_material) {
      return res.status(404).json({ error: 'Learning_material not found' });
    }

    if (req.method === 'GET') {
      // Fetch all sections with their content
      const { data: sections, error: sErr } = await supabaseAdmin
        .from('sections')
        .select('id, title, description, order')
        .eq('learning_material_id', learning_materialId)
        .order('order', { ascending: true });

      if (sErr) throw sErr;

      // For each section, fetch grammar and vocabulary
      const sectionsWithContent = await Promise.all((sections || []).map(async (section) => {
        // Fetch grammar
        const { data: grammarLinks, error: gErr } = await supabaseAdmin
          .from('section_grammar')
          .select(`
            position,
            kb_grammar(id, point, explanation, examples)
          `)
          .eq('section_id', section.id)
          .order('position', { ascending: true });

        if (gErr) throw gErr;

        // Fetch vocabulary
        const { data: vocabLinks, error: vErr } = await supabaseAdmin
          .from('section_vocab')
          .select(`
            position,
            kb_vocab(id, word, reading, meaning, examples, tags)
          `)
          .eq('section_id', section.id)
          .order('position', { ascending: true });

        if (vErr) throw vErr;

        return {
          ...section,
          grammar: (grammarLinks || []).map(link => link.kb_grammar),
          vocabulary: (vocabLinks || []).map(link => link.kb_vocab)
        };
      }));

      return res.status(200).json({ sections: sectionsWithContent });
    }

    if (req.method === 'PUT') {
      // Bulk update sections - this replaces all sections for the learning_material
      const { sections: newSections } = req.body;

      if (!Array.isArray(newSections)) {
        return res.status(400).json({ error: 'Invalid sections data' });
      }

      // Get existing sections 
      const { data: existingSections, error: fetchErr } = await supabaseAdmin
        .from('sections')
        .select('id')
        .eq('learning_material_id', learning_materialId);

      if (fetchErr) throw fetchErr;

      const existingSectionIds = (existingSections || []).map(s => s.id);
      const updatedSectionIds = newSections.filter(s => s.id).map(s => s.id);

      // Delete sections that are no longer present (cascade will handle junction tables)
      const sectionsToDelete = existingSectionIds.filter(id => !updatedSectionIds.includes(id));
      if (sectionsToDelete.length > 0) {
        const { error: delErr } = await supabaseAdmin
          .from('sections')
          .delete()
          .in('id', sectionsToDelete);
        if (delErr) throw delErr;
      }

      // Process each section
      for (let i = 0; i < newSections.length; i++) {
        const section = newSections[i];
        let sectionId = section.id;

        if (sectionId && existingSectionIds.includes(sectionId)) {
          // Update existing section
          const { error: updateErr } = await supabaseAdmin
            .from('sections')
            .update({
              title: section.title,
              description: section.description || null,
              order: section.order ?? i
            })
            .eq('id', sectionId);

          if (updateErr) throw updateErr;

          // Clear existing links for this section
          await supabaseAdmin.from('section_grammar').delete().eq('section_id', sectionId);
          await supabaseAdmin.from('section_vocab').delete().eq('section_id', sectionId);

          // Add new grammar links
          for (let j = 0; j < (section.grammar || []).length; j++) {
            const grammar = section.grammar[j];
            const grammarId = await upsertGrammar(ownerId, grammar);

            await supabaseAdmin.from('section_grammar').insert({
              section_id: sectionId,
              grammar_id: grammarId,
              position: j
            });
          }

          // Add new vocabulary links
          for (let k = 0; k < (section.vocabulary || []).length; k++) {
            const vocab = section.vocabulary[k];
            const vocabId = await upsertVocab(ownerId, vocab);

            await supabaseAdmin.from('section_vocab').insert({
              section_id: sectionId,
              vocab_id: vocabId,
              position: k
            });
          }

        } else {
          // Create new section
          const { data: newSection, error: createErr } = await supabaseAdmin
            .from('sections')
            .insert({
              learning_material_id: learning_materialId,
              title: section.title,
              description: section.description || null,
              order: section.order ?? i
            })
            .select('id')
            .single();

          if (createErr) throw createErr;
          sectionId = newSection.id;

          // Add grammar and vocabulary
          for (let j = 0; j < (section.grammar || []).length; j++) {
            const grammar = section.grammar[j];
            const grammarId = await upsertGrammar(ownerId, grammar);

            await supabaseAdmin.from('section_grammar').insert({
              section_id: sectionId,
              grammar_id: grammarId,
              position: j
            });
          }

          for (let k = 0; k < (section.vocabulary || []).length; k++) {
            const vocab = section.vocabulary[k];
            const vocabId = await upsertVocab(ownerId, vocab);

            await supabaseAdmin.from('section_vocab').insert({
              section_id: sectionId,
              vocab_id: vocabId,
              position: k
            });
          }
        }
      }

      // Optional: Clean up truly orphaned entries (entries not referenced by any sections)
      // This is a separate operation that you might want to run periodically rather than on every save
      await cleanupOrphanedEntries(ownerId);

      return res.status(200).json({ success: true });
    }

    // Replace the cleanupOrphanedEntries function with this working version:

    async function cleanupOrphanedEntries(ownerId) {
      try {
        // Get all grammar IDs that are currently referenced in junction tables
        const { data: referencedGrammar, error: gRefErr } = await supabaseAdmin
          .from('section_grammar')
          .select('grammar_id');

        if (gRefErr) {
          console.error('Error getting referenced grammar:', gRefErr);
          return;
        }

        const referencedGrammarIds = (referencedGrammar || []).map(r => r.grammar_id);

        // Get all grammar entries owned by this user
        const { data: allGrammar, error: gAllErr } = await supabaseAdmin
          .from('kb_grammar')
          .select('id')
          .eq('owner_id', ownerId);

        if (gAllErr) {
          console.error('Error getting all grammar:', gAllErr);
          return;
        }

        // Find orphaned grammar (owned by user but not referenced)
        const orphanedGrammarIds = (allGrammar || [])
          .map(g => g.id)
          .filter(id => !referencedGrammarIds.includes(id));

        if (orphanedGrammarIds.length > 0) {
          console.log(`Deleting ${orphanedGrammarIds.length} orphaned grammar entries`);
          const { error: delGrammarErr } = await supabaseAdmin
            .from('kb_grammar')
            .delete()
            .in('id', orphanedGrammarIds);

          if (delGrammarErr) console.error('Error deleting orphaned grammar:', delGrammarErr);
        }

        // Same process for vocabulary
        const { data: referencedVocab, error: vRefErr } = await supabaseAdmin
          .from('section_vocab')
          .select('vocab_id');

        if (vRefErr) {
          console.error('Error getting referenced vocab:', vRefErr);
          return;
        }

        const referencedVocabIds = (referencedVocab || []).map(r => r.vocab_id);

        const { data: allVocab, error: vAllErr } = await supabaseAdmin
          .from('kb_vocab')
          .select('id')
          .eq('owner_id', ownerId);

        if (vAllErr) {
          console.error('Error getting all vocab:', vAllErr);
          return;
        }

        const orphanedVocabIds = (allVocab || [])
          .map(v => v.id)
          .filter(id => !referencedVocabIds.includes(id));

        if (orphanedVocabIds.length > 0) {
          console.log(`Deleting ${orphanedVocabIds.length} orphaned vocabulary entries`);
          const { error: delVocabErr } = await supabaseAdmin
            .from('kb_vocab')
            .delete()
            .in('id', orphanedVocabIds);

          if (delVocabErr) console.error('Error deleting orphaned vocab:', delVocabErr);
        }
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Request failed', details: String(err?.message || err) });
  }
});