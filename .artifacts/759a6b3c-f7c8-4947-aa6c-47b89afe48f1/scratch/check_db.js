import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../apps/backend/.env' });

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  prepare: false
});

async function check() {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables in public schema:', result.map(r => r.table_name));

    const usersTable = await sql`SELECT * FROM users LIMIT 1`.catch(e => {
        console.error('Error selecting from users:', e.message);
        return null;
    });
    if (usersTable) console.log('Users table exists and is accessible.');
  } catch (e) {
    console.error('Connection error:', e.message);
  } finally {
    await sql.end();
  }
}

check();
