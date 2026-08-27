const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  try {
    console.log('Checking buckets...');
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) throw bError;
    console.log('Buckets:', buckets.map(b => `${b.name} (public: ${b.public})`).join(', '));

    const bucket = buckets.find(b => b.name === 'profile_image');
    if (!bucket) {
      console.log('Bucket "profile_image" not found.');
    } else {
      console.log(`Bucket "profile_image" is public: ${bucket.public}`);
    }
  } catch (e) {
    console.error('Check failed:', e.message);
  }
}

run();
