const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../apps/backend/.env') });

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  prepare: false
});

async function check() {
  try {
    const allUsers = await sql`SELECT * FROM users`;
    console.log('All users:', allUsers);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sql.end();
  }
}

check();
