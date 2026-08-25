console.log('Starting debug imports...');

async function test() {
  const modules = [
    'dotenv',
    'fastify',
    '@fastify/cors',
    '@fastify/jwt',
    '@fastify/swagger',
    '@fastify/swagger-ui',
    'fastify-type-provider-zod',
    'zod',
    'zod-to-json-schema',
    'openai',
    'postgres',
    'crypto',
    'drizzle-orm',
    'drizzle-orm/postgres-js'
  ];

  for (const m of modules) {
    try {
      console.log(`Importing ${m}...`);
      await import(m);
      console.log(`Successfully imported ${m}`);
    } catch (e) {
      console.error(`FAILED to import ${m}:`, e);
    }
  }
}

test();
