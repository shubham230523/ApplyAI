const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const url = `${process.env.SUPABASE_URL}/storage/v1/bucket`;
  const key = process.env.SUPABASE_ANON_KEY;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${key}`, 'apikey': key }
    });
    const buckets = await res.json();
    console.log('Buckets:', JSON.stringify(buckets, null, 2));
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

run();
