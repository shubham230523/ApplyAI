import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;

if (connectionString && connectionString.startsWith('postgres')) {
  try {
    const client = postgres(connectionString, { max: 1 });
    dbInstance = drizzle(client, { schema });
  } catch (e) {
    console.error('Database connection failed:', e);
  }
}

export const db = dbInstance;
