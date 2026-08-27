const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../apps/backend/.env') });

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  prepare: false
});

async function fix() {
  try {
    console.log('Adding role column to users table...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'candidate'`;
    console.log('Successfully added role column.');

    console.log('Ensuring unique constraint on email...');
    await sql`ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)`.catch(e => {
        if (e.message.includes('already exists')) {
            console.log('Unique constraint already exists.');
        } else {
            console.error('Error adding unique constraint:', e.message);
        }
    });

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sql.end();
  }
}

fix();
