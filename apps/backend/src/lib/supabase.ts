import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('ws');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const createMockSupabase = () => {
  const mock: any = {
    from: () => mock,
    select: () => mock,
    eq: () => mock,
    ilike: () => mock,
    gte: () => mock,
    order: () => mock,
    limit: () => Promise.resolve({ data: [], error: null })
  };
  return mock;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        // @ts-ignore
        fetch: (...args) => fetch(...args),
      },
      // @ts-ignore
      realtime: {
        transport: WebSocket
      }
    })
  : createMockSupabase();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Search will return empty results.');
}
