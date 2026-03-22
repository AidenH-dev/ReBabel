// pages/api/database/v1/sections/[id].js
import { withAuth } from '@/lib/withAuth';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export default withAuth(async function handler(req, res) {
  const ownerId = req.auth0Sub;
  const { id: sectionId } = req.query;

  try {
    if (req.method === 'GET') {
      // First, get the section and verify ownership through the learning_material
      const { data: section, error: sErr } = await supabaseAdmin
        .from('sections')
        .select(
          `
          id,
          title,
          description,
          order,
          learning_material_id,
          learning_materials!inner(owner_id)
        `
        )
        .eq('id', sectionId)
        .eq('learning_materials.owner_id', ownerId)
        .single();

      if (sErr || !section) {
        return res
          .status(404)
          .json({ success: false, error: 'Section not found' });
      }

      // Fetch grammar points for this section
      const { data: grammarLinks, error: gErr } = await supabaseAdmin
        .from('section_grammar')
        .select(
          `
          position,
          kb_grammar(
            id,
            point,
            explanation,
            examples
          )
        `
        )
        .eq('section_id', sectionId)
        .order('position', { ascending: true });

      if (gErr) throw gErr;

      // Fetch vocabulary for this section
      const { data: vocabLinks, error: vErr } = await supabaseAdmin
        .from('section_vocab')
        .select(
          `
          position,
          kb_vocab(
            id,
            word,
            reading,
            meaning,
            examples,
            tags
          )
        `
        )
        .eq('section_id', sectionId)
        .order('position', { ascending: true });

      if (vErr) throw vErr;

      // Format the response
      const formattedSection = {
        id: section.id,
        title: section.title,
        description: section.description,
        order: section.order,
        learning_material_id: section.learning_material_id,
        grammar: (grammarLinks || []).map((link) => ({
          ...link.kb_grammar,
          position: link.position,
        })),
        vocabulary: (vocabLinks || []).map((link) => ({
          ...link.kb_vocab,
          position: link.position,
        })),
      };

      return res.status(200).json({ success: true, section: formattedSection });
    }

    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    req.log.error('sections.error', {
      error: err?.message || String(err),
      stack: err?.stack,
    });
    return res.status(500).json({
      success: false,
      error: 'Request failed',
    });
  }
});
