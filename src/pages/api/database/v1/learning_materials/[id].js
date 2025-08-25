// pages/api/database/v1/learning_materials/[id].js
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export default withApiAuthRequired(async function handler(req, res) {
  const { user } = await getSession(req, res);
  const ownerId = user?.sub;
  const { id } = req.query;

  if (!ownerId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    if (req.method === 'GET') {
      // Fetch the learning_material (owner-scoped)
      const { data: learning_material, error: cErr } = await supabaseAdmin
        .from('learning_materials')
        .select('id,title,learning_materials,institution,description,study_goal,start_date,end_date,created_at')
        .eq('id', id)
        .eq('owner_id', ownerId)
        .single();
      
      if (cErr || !learning_material) return res.status(404).json({ error: 'Learning_material not found' });

      // Fetch sections with their content
      const { data: sections, error: sErr } = await supabaseAdmin
        .from('sections')
        .select('id,title,description,order')
        .eq('learning_material_id', id)
        .order('order', { ascending: true });
      
      if (sErr) throw sErr;

      // For each section, fetch the associated grammar and vocabulary
      const sectionsWithContent = await Promise.all((sections || []).map(async (section) => {
        // Fetch grammar points
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
          .eq('section_id', section.id)
          .order('position', { ascending: true });
        
        if (gErr) {
          console.error('Error fetching grammar:', gErr);
          // Continue with empty grammar if error
        }

        // Fetch vocabulary
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
          .eq('section_id', section.id)
          .order('position', { ascending: true });
        
        if (vErr) {
          console.error('Error fetching vocabulary:', vErr);
          // Continue with empty vocabulary if error
        }

        return {
          ...section,
          grammar: (grammarLinks || []).map(link => ({
            ...link.kb_grammar,
            // Ensure ID is preserved for editing
            id: link.kb_grammar.id || Date.now() + Math.random()
          })),
          vocabulary: (vocabLinks || []).map(link => ({
            ...link.kb_vocab,
            // Ensure ID is preserved for editing
            id: link.kb_vocab.id || Date.now() + Math.random()
          }))
        };
      }));

      return res.status(200).json({ 
        learning_material, 
        sections: sectionsWithContent 
      });
    }

    if (req.method === 'PATCH') {
      const p = req.body || {};

      // Accept either camelCase or snake_case inputs
      const update = {
        title: p.title,
        learning_materials: p.learningMaterials ?? p.learning_materials ?? null,
        institution: p.institution ?? null,
        description: p.description ?? null,
        study_goal: p.studyGoal ?? p.study_goal ?? null,
        start_date: p.startDate ?? p.start_date ?? null,
        end_date: p.endDate ?? p.end_date ?? null,
      };

      // Remove undefined keys
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

      // Ensure the learning_material belongs to the user
      const { data: existing, error: eErr } = await supabaseAdmin
        .from('learning_materials')
        .select('id')
        .eq('id', id)
        .eq('owner_id', ownerId)
        .single();
      if (eErr || !existing) return res.status(404).json({ error: 'Learning_material not found' });

      const { data, error } = await supabaseAdmin
        .from('learning_materials')
        .update(update)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;

      return res.status(200).json({ learning_material: data });
    }

    if (req.method === 'DELETE') {
      // Ensure the learning_material belongs to the user
      const { data: existing, error: eErr } = await supabaseAdmin
        .from('learning_materials')
        .select('id')
        .eq('id', id)
        .eq('owner_id', ownerId)
        .single();
      if (eErr || !existing) return res.status(404).json({ error: 'Learning_material not found' });

      // ON DELETE CASCADE will remove sections & link rows
      const { error: dErr } = await supabaseAdmin.from('learning_materials').delete().eq('id', id);
      if (dErr) throw dErr;

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Request failed', details: String(err?.message || err) });
  }
});