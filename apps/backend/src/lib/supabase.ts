import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const createResilientClient = () => {
  try {
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey);
    }
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
  }
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          ilike: () => ({
            gte: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null })
              })
            })
          })
        })
      })
    })
  } as any;
};

export const supabase = createResilientClient();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Search will return empty results.');
}
