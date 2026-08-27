const postgres = require('postgres');
const u = 'postgresql://postgres.sfuxebkldwvyjsusdupp:6TWJTC%21%3D5tZNTSh@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
const s = postgres(u, {max:1, ssl:{rejectUnauthorized:false}});

async function run() {
  try {
    const apps = await s`SELECT * FROM applications`;
    console.log('Total Applications:', apps.length);
    if (apps.length > 0) {
      console.log('Last Application Details:');
      console.log(JSON.stringify(apps[apps.length-1], null, 2));
    }
  } catch (e) {
    console.error('Debug failed:', e.message);
  } finally {
    await s.end();
  }
}

run();
