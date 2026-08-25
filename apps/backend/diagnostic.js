console.log('Starting Diagnostic...');

async function testImport(name, path) {
  console.log(`Testing import: ${name} from ${path}...`);
  try {
    const mod = await import(path);
    console.log(`Successfully imported ${name}`);
    return mod;
  } catch (err) {
    console.error(`FAILED to import ${name}:`);
    console.error(err);
    if (err.stack) console.error(err.stack);
    return null;
  }
}

async function run() {
  await testImport('dotenv', 'dotenv');
  await testImport('Fastify', 'fastify');
  await testImport('db', './src/db/index.ts'); // ts-node loader will handle .ts
  await testImport('AIService', './src/modules/ai/ai.service.ts');
  await testImport('profileRoutes', './src/modules/profiles/profile.routes.ts');
  console.log('Diagnostic complete.');
}

run();
