import { db } from '../../db/index.js';
import { applications, jobs, resumes } from '../../db/schema.js';
import { AIService } from '../ai/ai.service.js';
import { eq, and, desc } from 'drizzle-orm';
import { CandidateProfile } from '@applyai/shared-types';

const aiService = new AIService();

export class ApplicationService {
  async applyToJob(userId: string, jobId: string) {
    // 1. Fetch Job and User Profile/Resume
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) throw new Error('Job not found');

    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isMain, true)))
      .limit(1);

    if (!resume) throw new Error('Main resume not found. Please upload a resume first.');

    // 2. Check if already applied
    const [existing] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
      .limit(1);

    if (existing) return existing;

    // 3. Generate AI Cover Letter
    const profile = resume.parsedContent as unknown as CandidateProfile;
    const coverLetter = await aiService.generateCoverLetter(profile, job.description);

    // 4. Save Application
    const [application] = await db.insert(applications).values({
      userId,
      jobId,
      resumeId: resume.id,
      aiCoverLetter: coverLetter,
      status: 'applied',
      appliedAt: new Date(),
    }).returning();

    return application;
  }

  async getUserApplications(userId: string) {
    return db.select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.appliedAt,
      jobTitle: jobs.title,
      company: jobs.company,
      location: jobs.location,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.appliedAt));
  }
}
