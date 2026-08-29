import { db } from './db/index.js';
import { jobs, profiles, resumes, userSearches } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function run() {
  console.log('--- DIAGNOSTICS: Recommendations ---');
  if (!db) {
    console.error('Database connection not available');
    process.exit(1);
  }

  try {
    const jobCount = await db.select().from(jobs);
    console.log('Total jobs in database:', jobCount.length);

    // Let's look at one user
    const [userProfile] = await db.select().from(profiles).limit(1);
    if (userProfile) {
      console.log('Sample User Profile:', userProfile.userId, 'Name:', userProfile.name);

      const userResumes = await db.select().from(resumes).where(eq(resumes.userId, userProfile.userId));
      console.log('User Resumes:', userResumes.length);

      const userHistory = await db.select().from(userSearches).where(eq(userSearches.userId, userProfile.userId)).orderBy(desc(userSearches.createdAt)).limit(5);
      console.log('User Search History:', userHistory.length);
    } else {
      console.log('No user profiles found in database.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Diagnostics failed:', err);
    process.exit(1);
  }
}

run();
