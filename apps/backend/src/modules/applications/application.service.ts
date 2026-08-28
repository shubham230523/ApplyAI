import { db } from '../../db/index.js';
import { applications, jobs, resumes, profiles, users } from '../../db/schema.js';
import { AIService } from '../ai/ai.service.js';
import { eq, and, desc } from 'drizzle-orm';
import { CandidateProfile } from '@applyai/shared-types';

const aiService = new AIService();

export class ApplicationService {
  async applyToJob(userId: string, jobId: string) {
    if (!db) throw new Error('Database connection not available');
    // 1. Fetch Job and User Profile/Resume
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) throw new Error('Job not found');

    let [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isMain, true)))
      .limit(1);

    if (!resume) {
      // Fallback: Use the most recently uploaded resume if no "Main" is set
      [resume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.createdAt))
        .limit(1);
    }

    if (!resume) throw new Error('No resume found. Please upload a resume first.');

    // 2. Check if already applied
    const [existing] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
      .limit(1);

    if (existing) {
      console.log(`[ApplicationService] User ${userId} already applied to job ${jobId}`);
      return existing;
    }

    // 3. Generate AI Cover Letter
    const profile = resume.parsedContent as unknown as CandidateProfile;
    let coverLetter = "Strategic application submitted.";
    try {
       coverLetter = await aiService.generateCoverLetter(profile, job.description);
    } catch (aiErr) {
       console.warn('[ApplicationService] AI Cover Letter generation failed, using default.');
    }

    // 4. Save Application
    console.log(`[ApplicationService] Inserting application for User: ${userId}, Job: ${jobId}, Resume: ${resume.id}`);

    const [application] = await db.insert(applications).values({
      userId,
      jobId,
      resumeId: resume.id,
      aiCoverLetter: coverLetter,
      status: 'applied',
      appliedAt: new Date(),
    }).returning();

    if (application) {
      console.log(`[ApplicationService] Successfully saved application: ${application.id}`);
    } else {
      console.error('[ApplicationService] Failed to insert application - check database constraints');
    }

    return application;
  }

  async getUserApplications(userId: string) {
    if (!db) return [];
    return db.select({
      id: applications.id,
      jobId: applications.jobId,
      status: applications.status,
      appliedAt: applications.appliedAt,
      jobTitle: jobs.title,
      companyName: jobs.companyName,
      companyLogoUrl: jobs.companyLogoUrl,
      location: jobs.location,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.appliedAt));
  }

  async getApplicationById(userId: string, applicationId: string) {
    if (!db) throw new Error('Database connection not available');

    const [result] = await db.select({
      id: applications.id,
      jobId: applications.jobId,
      status: applications.status,
      appliedAt: applications.appliedAt,
      aiCoverLetter: applications.aiCoverLetter,
      aiAnswers: applications.aiAnswers,
      resumeId: applications.resumeId,
      jobTitle: jobs.title,
      companyName: jobs.companyName,
      companyLogoUrl: jobs.companyLogoUrl,
      location: jobs.location,
      jobDescription: jobs.description,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);

    return result || null;
  }

  async getApplicationsByJob(jobId: string, recruiterId: string) {
    if (!db) return [];

    // Ensure job belongs to recruiter
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.recruiterId, recruiterId))).limit(1);
    if (!job) throw new Error('Job not found or unauthorized');

    return db.select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.appliedAt,
      candidateName: profiles.name,
      candidateEmail: users.email,
      candidateImageUrl: profiles.profileImageUrl,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .leftJoin(profiles, eq(applications.userId, profiles.userId))
    .where(eq(applications.jobId, jobId))
    .orderBy(desc(applications.appliedAt));
  }

  async getRecruiterApplicationDetail(applicationId: string, recruiterId: string) {
    if (!db) throw new Error('Database connection not available');

    const result = await db.select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.appliedAt,
      aiCoverLetter: applications.aiCoverLetter,
      aiAnswers: applications.aiAnswers,
      jobTitle: jobs.title,
      candidateName: profiles.name,
      candidateEmail: users.email,
      candidatePhone: profiles.phone,
      candidateHeadline: profiles.headline,
      candidateSkills: profiles.skills,
      candidateImageUrl: profiles.profileImageUrl,
      resumeUrl: resumes.fileUrl,
      resumeParsedContent: resumes.parsedContent,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(users, eq(applications.userId, users.id))
    .leftJoin(profiles, eq(applications.userId, profiles.userId))
    .leftJoin(resumes, eq(applications.resumeId, resumes.id))
    .where(and(eq(applications.id, applicationId), eq(jobs.recruiterId, recruiterId)))
    .limit(1);

    return result[0] || null;
  }
}
