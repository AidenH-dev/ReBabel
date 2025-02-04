// pages/api/fetchSet.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using your environment variables.
// For server-side operations, it's recommended to use your service key if available.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
//|| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // This endpoint only supports GET requests.
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Retrieve query parameters from the URL.
  // For example: /api/fetchSet?userEmail=someone@example.com&setName=food
  const { userEmail, setName } = req.query;

  // Start building the query from the "user_sets" table.
  let query = supabase.from('user_sets').select('*');

  // If a userEmail is provided, filter by user_email.
  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  // If a setName is provided, filter by set_name.
  if (setName) {
    query = query.eq('set_name', setName);
  }

  // Execute the query.
  const { data, error } = await query;

  // Handle errors or return the data.
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
