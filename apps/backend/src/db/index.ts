import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;

console.log('Initializing Database connection...');

if (connectionString && connectionString.startsWith('postgres')) {
  try {
    const client = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    dbInstance = drizzle(client, { schema });
    console.log('Database instance initialized (Drizzle)');
  } catch (e) {
    console.error('DATABASE CONNECTION FAILED DURING INIT:', e);
  }
} else {
  console.warn('DATABASE_URL missing or invalid. Running in Cache-Only mode.');
}

// Export a proxy or just the instance.
// We use 'as any' to satisfy drizzle calls, but we must check for null at runtime.
export const db = dbInstance;
