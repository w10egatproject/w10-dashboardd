import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
// You can find these in your Supabase project settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * INSTRUCTIONS FOR REAL BACKEND:
 * 
 * 1. Create a project at https://supabase.com
 * 2. Get your URL and Anon Key from the Project Settings.
 * 3. Create a .env file in the root directory and add:
 *    VITE_SUPABASE_URL=your_url_here
 *    VITE_SUPABASE_ANON_KEY=your_key_here
 * 4. In App.tsx, you can replace the handleLogin/handleSignUp logic 
 *    with supabase.auth calls:
 * 
 *    const { data, error } = await supabase.auth.signUp({ email, password });
 */
