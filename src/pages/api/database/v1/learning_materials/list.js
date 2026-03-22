// pages/api/database/v1/learning_materials/list.js
import { withAuth } from '@/lib/withAuth';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

// Shape DB rows → UI card data
function mapLearning_materialForUI(c) {
  return {
    id: c.id,
    title: c.title,
    textbook: c.learning_materials || '—',
    institution: c.institution || 'Self-Study',
    progress: 0, // placeholder until you add mastery
    lastAccessed: new Date(c.created_at).toLocaleDateString(), // simple display
    sections: (c.sections || [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => ({
        id: s.id,
        title: s.title,
        status: 'not-started', // placeholder
        completed: 0, // placeholder
        total: 0, // placeholder
      })),
    upcomingDeadlines: [], // placeholder
  };
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const ownerId = req.auth0Sub;

  try {
    // You can do a single nested select if relations are recognized:
    //   .select('id,title,learning_materials,institution,created_at,sections(id,title,description,order)')
    // To be maximally robust across custom schemas, we’ll do two queries.

    // 1) Fetch learning_materials
    const { data: learning_materials, error: cErr } = await supabaseAdmin
      .from('learning_materials')
      .select('id,title,learning_materials,institution,created_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (cErr) throw cErr;

    if (!learning_materials?.length)
      return res.status(200).json({ learning_materials: [] });

    // 2) Fetch sections for all learning_materials in one go
    const learning_materialIds = learning_materials.map((c) => c.id);
    const { data: sections, error: sErr } = await supabaseAdmin
      .from('sections')
      .select('id,learning_material_id,title,description,order')
      .in('learning_material_id', learning_materialIds);
    if (sErr) throw sErr;

    // 3) Attach sections to their learning_materials
    const byLearning_material = new Map(
      learning_materials.map((c) => [c.id, { ...c, sections: [] }])
    );
    for (const s of sections || []) {
      const bucket = byLearning_material.get(s.learning_material_id);
      if (bucket) bucket.sections.push(s);
    }

    const payload = Array.from(byLearning_material.values()).map(
      mapLearning_materialForUI
    );
    return res.status(200).json({ learning_materials: payload });
  } catch (e) {
    req.log.error('learning_materials.list_failed', {
      error: e?.message || String(e),
      stack: e?.stack,
    });
    return res.status(500).json({
      error: 'Failed to list learning_materials',
      details: String(e?.message || e),
    });
  }
});
