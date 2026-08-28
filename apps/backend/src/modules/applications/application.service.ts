import { CandidateProfile } from '@applyai/shared-types';

export class ApplicationService {
  async applyToJob(userId: string, jobId: string, resumeId?: string, customCoverLetter?: string) {
    const { db } = await import('../../db/index.js');
    const { applications, jobs, resumes } = await import('../../db/schema.js');
    const { AIService } = await import('../ai/ai.service.js');
    const { eq, and, desc } = await import('drizzle-orm');

    const aiService = new AIService();

    if (!db) throw new Error('Database connection not available');
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) throw new Error('Job not found');

    let resume: any;
    if (resumeId) {
      [resume] = await db.select().from(resumes).where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId))).limit(1);
    }

    if (!resume) {
      [resume] = await db.select().from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.isMain, true))).limit(1);
    }

    if (!resume) {
      [resume] = await db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt)).limit(1);
    }

    if (!resume) throw new Error('No resume found. Please upload a resume first.');

    const [existing] = await db.select().from(applications).where(and(eq(applications.userId, userId), eq(applications.jobId, jobId))).limit(1);
    if (existing) return existing;

    const profile = resume.parsedContent as unknown as CandidateProfile;
    let coverLetter = customCoverLetter;
    let matchResult = { score: 0, feedback: '' };

    try {
      const [aiCoverLetter, aiMatch] = await Promise.all([
        !coverLetter ? aiService.generateCoverLetter(profile, job.description) : Promise.resolve(coverLetter),
        aiService.calculateMatchScore(job, profile)
      ]);
      if (!coverLetter) coverLetter = aiCoverLetter;
      matchResult = aiMatch;
    } catch (aiErr) {
      console.warn('[ApplicationService] AI analysis failed, using defaults.', aiErr);
      if (!coverLetter) coverLetter = "Strategic application submitted.";
    }

    const [application] = await db.insert(applications).values({
      userId,
      jobId,
      resumeId: resume.id,
      aiCoverLetter: coverLetter,
      matchScore: matchResult.score,
      matchFeedback: matchResult.feedback,
      status: 'applied',
      appliedAt: new Date(),
    }).returning();

    return application;
  }

  async getUserApplications(userId: string) {
    const { db } = await import('../../db/index.js');
    const { applications, jobs } = await import('../../db/schema.js');
    const { eq, desc } = await import('drizzle-orm');
    if (!db) return [];
    return db.select({
      id: applications.id,
      jobId: applications.jobId,
      status: applications.status,
      appliedAt: applications.appliedAt,
      matchScore: applications.matchScore,
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
    const { db } = await import('../../db/index.js');
    const { applications, jobs } = await import('../../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
    if (!db) throw new Error('Database connection not available');
    const [result] = await db.select({
      id: applications.id,
      jobId: applications.jobId,
      status: applications.status,
      appliedAt: applications.appliedAt,
      aiCoverLetter: applications.aiCoverLetter,
      aiAnswers: applications.aiAnswers,
      matchScore: applications.matchScore,
      matchFeedback: applications.matchFeedback,
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
    const { db } = await import('../../db/index.js');
    const { applications, jobs, profiles, users } = await import('../../db/schema.js');
    const { eq, and, desc } = await import('drizzle-orm');

    if (!db) return [];

    // Ensure job belongs to recruiter
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.recruiterId, recruiterId))).limit(1);
    if (!job) throw new Error('Job not found or unauthorized');

    return db.select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.appliedAt,
      matchScore: applications.matchScore,
      candidateName: profiles.name,
      candidateEmail: users.email,
      candidateImageUrl: profiles.profileImageUrl,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .leftJoin(profiles, eq(applications.userId, profiles.userId))
    .where(eq(applications.jobId, jobId))
    .orderBy(desc(applications.matchScore), desc(applications.appliedAt));
  }

  async getRecruiterApplicationDetail(applicationId: string, recruiterId: string) {
    const { db } = await import('../../db/index.js');
    const { applications, jobs, profiles, users, resumes } = await import('../../db/schema.js');
    const { eq, and } = await import('drizzle-orm');
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
