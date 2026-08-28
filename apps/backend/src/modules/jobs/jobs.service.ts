import { db } from '../../db/index.js';
import { jobs } from '../../db/schema.js';
import { Job, JobSearchParams } from '@applyai/shared-types';
import { sql, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class JobsService {
  private static aiJobsCache = new Map<string, Job>();

  static saveToCache(jobList: Job[]) {
    jobList.forEach(job => this.aiJobsCache.set(job.id, job));
  }

  async searchJobs(params: JobSearchParams): Promise<Job[]> {
    // In a real scenario, this would call multiple job board APIs
    const mockJobs = this.generateMockJobs(params);

    // Save to Cache for Detail Screen
    JobsService.saveToCache(mockJobs);

    // Save/Sync with DB (optional for MVP)
    try {
      await this.syncJobsWithDB(mockJobs);
    } catch (e) {
      console.warn('DB Sync failed, continuing with cache', e);
    }

    return mockJobs;
  }

  async getJobById(id: string): Promise<Job | null> {
    // Check cache first (for AI/Mock jobs)
    const cached = JobsService.aiJobsCache.get(id);
    if (cached) return cached;

    // Fallback to DB
    try {
      if (!db) return null;
      const result = await db.select().from(jobs).where(eq(jobs.id, id));
      return (result[0] as any as Job) || null;
    } catch (e) {
      return null;
    }
  }

  async createJob(recruiterId: string, jobData: Partial<Job>): Promise<Job | null> {
    if (!db) return null;
    const id = randomUUID();
    const now = new Date();

    const [newJob] = await db.insert(jobs).values({
      id,
      title: jobData.title!,
      description: jobData.description!,
      companyName: jobData.companyName!,
      location: jobData.location,
      workplaceType: jobData.workplaceType,
      employmentType: jobData.employmentType,
      experienceLevel: jobData.experienceLevel,
      salaryCurrency: jobData.salaryCurrency,
      salaryMin: jobData.salaryMin?.toString(),
      salaryMax: jobData.salaryMax?.toString(),
      salaryPeriod: jobData.salaryPeriod,
      recruiterId,
      isActive: true,
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    } as any).returning();

    return newJob as any as Job;
  }

  async getJobsByRecruiter(recruiterId: string): Promise<any[]> {
    if (!db) return [];
    try {
      const { applications } = await import('../../db/schema.js');
      const result = await db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          companyName: jobs.companyName,
          location: jobs.location,
          workplaceType: jobs.workplaceType,
          employmentType: jobs.employmentType,
          experienceLevel: jobs.experienceLevel,
          salaryCurrency: jobs.salaryCurrency,
          salaryMin: jobs.salaryMin,
          salaryMax: jobs.salaryMax,
          salaryPeriod: jobs.salaryPeriod,
          isActive: jobs.isActive,
          postedAt: jobs.postedAt,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
          applicantCount: sql<number>`count(${applications.id})::int`,
        })
        .from(jobs)
        .leftJoin(applications, eq(jobs.id, applications.jobId))
        .where(eq(jobs.recruiterId, recruiterId))
        .groupBy(jobs.id);

      return result;
    } catch (e) {
      console.error('Error fetching jobs by recruiter:', e);
      return [];
    }
  }

  private generateMockJobs(params: JobSearchParams): Job[] {
    const titles = [params.title || 'Software Engineer', 'Full Stack Developer', 'Backend Developer'];
    const location = params.location || 'Remote';

    return Array.from({ length: 5 }).map((_, i) => ({
      id: randomUUID(),
      externalId: `mock-${i}-${Date.now()}`,
      source: 'MockBoard',
      title: titles[i % titles.length],
      companyName: `TechCorp ${i + 1}`,
      companyLogoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=TechCorp${i}`,
      description: `Exciting opportunity for a ${params.title || 'developer'} in ${location}.`,
      location: location,
      countryCode: 'IN',
      workplaceType: params.workplaceType || 'REMOTE',
      employmentType: params.employmentType || 'FULL_TIME',
      experienceLevel: params.experienceLevel || 'MID_LEVEL',
      salaryMin: params.salaryMin || 10,
      salaryMax: (params.salaryMin || 10) + 5,
      salaryCurrency: 'INR',
      salaryPeriod: 'YEARLY',
      applyUrl: 'https://example.com/apply',
      isActive: true,
      postedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  private async syncJobsWithDB(jobList: Job[]) {
    if (!db) return;
    for (const job of jobList) {
      await db.insert(jobs).values({
        id: job.id,
        externalId: job.externalId,
        source: job.source,
        title: job.title,
        description: job.description,
        companyName: job.companyName,
        companyWebsite: job.companyWebsite,
        companyLogoUrl: job.companyLogoUrl,
        location: job.location,
        countryCode: job.countryCode,
        workplaceType: job.workplaceType,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        salaryCurrency: job.salaryCurrency,
        salaryMin: job.salaryMin?.toString(),
        salaryMax: job.salaryMax?.toString(),
        salaryPeriod: job.salaryPeriod,
        applyUrl: job.applyUrl,
        contactEmail: job.contactEmail,
        isActive: job.isActive,
        postedAt: job.postedAt ? new Date(job.postedAt) : new Date(),
      }).onConflictDoUpdate({
        target: [jobs.externalId],
        set: {
          title: job.title,
          updatedAt: new Date(),
        }
      });
    }
  }
}
