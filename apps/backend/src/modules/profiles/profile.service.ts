import { db } from '../../db/index.js';
import { profiles, users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ProfileInput } from './profile.schema.js';

export async function getProfile(userId: string) {
  if (!db) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile;
}

export async function updateProfile(userId: string, data: ProfileInput) {
  if (!db) return null;
  // Check if profile exists
  const existing = await getProfile(userId);

  if (existing) {
    const [updated] = await db
      .update(profiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(profiles)
      .values({
        ...data,
        userId,
      })
      .returning();
    return created;
  }
}

export async function getOrCreateUser(email: string) {
  if (!db) throw new Error('Database not initialized');
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ email })
    .returning();
  return created;
}
