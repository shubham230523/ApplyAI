import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;

if (connectionString && connectionString.startsWith('postgres')) {
  try {
    // Create a client that doesn't block the event loop and handles connection properly
    const client = postgres(connectionString, {
      max: 1,
      prepare: false, // Critical for Supabase/PgBouncer connection pooling
      ssl: { rejectUnauthorized: false }
    });
    dbInstance = drizzle(client, { schema });
    console.log('Successfully connected to Supabase Database via Pooler');
  } catch (e) {
    console.error('Database connection failed:', e);
  }
} else {
  console.warn('DATABASE_URL is missing or invalid. Database instance will be null.');
}

export const db = dbInstance;
