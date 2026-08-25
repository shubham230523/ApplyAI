import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;

if (connectionString && connectionString.startsWith('postgres')) {
  try {
    const client = postgres(connectionString);
    dbInstance = drizzle(client, { schema });
  } catch (e) {
    // We catch it here to prevent startup crash
    console.error('Database connection failed:', e);
  }
}

// Export a proxy or just the instance.
// We use 'as any' to satisfy drizzle calls, but we must check for null at runtime.
export const db = dbInstance;
