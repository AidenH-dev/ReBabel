// pages/api/uploadSet.js
import { createClient } from '@supabase/supabase-js';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

// Initialize Supabase client using your environment variables.
const supabaseUrl = process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_ANON_KEY;
//process.env.SUPABASE_SERVICE_ROLE_KEY ||
const supabase = createClient(supabaseUrl, supabaseKey);

export default withApiAuthRequired(async function handler(req, res) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }
  // Only allow POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Destructure the incoming JSON body.
  // Expected structure:
  // {
  //   "setName": "food",
  //   "items": [{ "English": "college", "Japanese": "だいがく" }, ...],
  //   "userEmail": "aiden.habboub@gmail.com"
  // }
  const { setName, items, userEmail } = req.body;

  // Basic validation: Ensure all required fields are provided.
  if (!setName || !items || !userEmail) {
    return res.status(400).json({
      error: 'Missing required fields. Please provide setName, items, and userEmail.',
    });
  }

  // Insert the new set into the "user_sets" table.
  const { data, error } = await supabase.from('user_sets').insert([
    {
      user_email: userEmail,
      set_name: setName,
      vocabulary: items, // items should be an array of objects
    },
  ]);

  // Handle any errors from Supabase.
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Return a success response along with the inserted data.
  return res.status(200).json({ message: 'Set uploaded successfully', data });
})
