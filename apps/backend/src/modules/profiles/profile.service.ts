import { db } from '../../db/index.js';
import { profiles, users, resumes, recruiters } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { ProfileInput } from './profile.schema.js';

export async function getProfile(userId: string) {
  if (!db) return null;
  const [profile] = await db
    .select({
      id: profiles.id,
      userId: profiles.userId,
      name: profiles.name,
      phone: profiles.phone,
      headline: profiles.headline,
      yearsExperience: profiles.yearsExperience,
      skills: profiles.skills,
      preferredLocations: profiles.preferredLocations,
      preferredSalary: profiles.preferredSalary,
      address: profiles.address,
      profileImageUrl: profiles.profileImageUrl,
      noticePeriod: profiles.noticePeriod,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
      email: users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) return null;

  // Check for main resume
  const [mainResume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.userId, userId), eq(resumes.isMain, true)))
    .limit(1);

  return {
    ...profile,
    hasResume: !!mainResume
  };
}

export async function updateProfile(userId: string, data: ProfileInput) {
  if (!db) return null;

  // 1. If email is provided, update the users table
  if (data.email) {
    await db.update(users)
      .set({ email: data.email, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // 2. Separate profile data from user data
  const { email, ...profileData } = data;

  // 3. Check if profile exists
  const existing = await getProfile(userId);

  if (existing) {
    const [updated] = await db
      .update(profiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    // Sync with main resume
    try {
      const { ResumeService } = await import('../resumes/resume.service.js');
      const resumeService = new ResumeService();
      await resumeService.syncResumeWithProfile(userId, data);
    } catch (e) {
      console.warn('Resume sync failed:', e);
    }

    return updated;
  } else {
    const [created] = await db
      .insert(profiles)
      .values({
        ...profileData,
        userId,
      })
      .returning();

    // Sync with main resume
    try {
      const { ResumeService } = await import('../resumes/resume.service.js');
      const resumeService = new ResumeService();
      await resumeService.syncResumeWithProfile(userId, data);
    } catch (e) {
      console.warn('Resume sync failed:', e);
    }

    return created;
  }
}

export async function getOrCreateUser(id: string, email: string, role: string = 'candidate') {
  if (!db) throw new Error('Database not initialized');
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ id, email, role })
    .returning();
  return created;
}

export async function getRecruiterProfile(userId: string) {
  if (!db) return null;
  const [recruiter] = await db
    .select()
    .from(recruiters)
    .where(eq(recruiters.userId, userId))
    .limit(1);
  return recruiter;
}

export async function updateRecruiterProfile(userId: string, data: any) {
  if (!db) return null;
  const existing = await getRecruiterProfile(userId);
  if (existing) {
    const [updated] = await db
      .update(recruiters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(recruiters.userId, userId))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(recruiters)
      .values({ ...data, userId })
      .returning();
    return created;
  }
}
