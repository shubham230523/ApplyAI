import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let client: any = null;
let dbInstance: any = null;

if (connectionString && connectionString.startsWith('postgres')) {
  try {
    client = postgres(connectionString, {
      max: 1,
      prepare: false,
      ssl: { rejectUnauthorized: false }
    });
    dbInstance = drizzle(client, { schema });
    console.log('Database initialized');
  } catch (e) {
    console.error('Database initialization failed:', e);
  }
}

export const db = dbInstance;

/**
 * Hot-fix for schema mismatch.
 */
export async function verifySchema() {
  if (!client) return;

  try {
    console.log('[Database] Running schema verification...');

    // Ensure recruiters table exists
    await client`
      CREATE TABLE IF NOT EXISTS recruiters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        phone TEXT,
        email TEXT
      );
    `;

    // Add columns if table existed
    try { await client`ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS phone TEXT;`; } catch (e) {}
    try { await client`ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS email TEXT;`; } catch (e) {}

    // Ensure jobs table exists
    await client`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        company_name TEXT NOT NULL,
        location TEXT,
        workplace_type TEXT,
        employment_type TEXT,
        experience_level TEXT,
        salary_currency VARCHAR(5),
        salary_min NUMERIC(12, 2),
        salary_max NUMERIC(12, 2),
        salary_period TEXT,
        recruiter_id UUID REFERENCES recruiters(id),
        is_active BOOLEAN DEFAULT TRUE,
        posted_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    try { await client`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES recruiters(id);`; } catch (e) {}

    console.log('[Database] Schema verification complete.');
  } catch (err: any) {
    console.warn('[Database] Schema verification non-fatal error:', err.message || err);
  }
}
