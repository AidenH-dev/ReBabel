// pages/api/database/v1/sections/[id].js
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export default withApiAuthRequired(async function handler(req, res) {
  const { user } = await getSession(req, res);
  const ownerId = user?.sub;
  const { id: sectionId } = req.query;

  if (!ownerId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    if (req.method === 'GET') {
      // First, get the section and verify ownership through the learning_material
      const { data: section, error: sErr } = await supabaseAdmin
        .from('sections')
        .select(`
          id,
          title,
          description,
          order,
          learning_material_id,
          learning_materials!inner(owner_id)
        `)
        .eq('id', sectionId)
        .eq('learning_materials.owner_id', ownerId)
        .single();
      
      if (sErr || !section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      // Fetch grammar points for this section
      const { data: grammarLinks, error: gErr } = await supabaseAdmin
        .from('section_grammar')
        .select(`
          position,
          kb_grammar(
            id,
            point,
            explanation,
            examples
          )
        `)
        .eq('section_id', sectionId)
        .order('position', { ascending: true });
      
      if (gErr) throw gErr;

      // Fetch vocabulary for this section
      const { data: vocabLinks, error: vErr } = await supabaseAdmin
        .from('section_vocab')
        .select(`
          position,
          kb_vocab(
            id,
            word,
            reading,
            meaning,
            examples,
            tags
          )
        `)
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
        grammar: (grammarLinks || []).map(link => ({
          ...link.kb_grammar,
          position: link.position
        })),
        vocabulary: (vocabLinks || []).map(link => ({
          ...link.kb_vocab,
          position: link.position
        }))
      };

      return res.status(200).json({ section: formattedSection });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Request failed', details: String(err?.message || err) });
  }
});