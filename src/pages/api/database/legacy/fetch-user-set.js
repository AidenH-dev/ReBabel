// pages/api/database/fetch-user-set.js
import { createClient } from '@supabase/supabase-js';

// Ensure your environment variables are correctly set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
//process.env.SUPABASE_SERVICE_ROLE_KEY || 
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Service Role Key environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // This endpoint only supports GET requests.
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Retrieve query parameters.
    const { userEmail, setName } = req.query;

    // Build the query from the "user_sets" table.
    let query = supabase.from('user_sets').select('*');

    if (userEmail) {
      query = query.eq('user_email', userEmail);
    }
    if (setName) {
      query = query.eq('set_name', setName);
    }

    // Execute the query.
    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error in fetch-user-set API:", err);
    return res.status(500).json({ error: err.message });
  }
}
