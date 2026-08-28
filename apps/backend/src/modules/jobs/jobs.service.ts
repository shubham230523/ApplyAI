import { Job, JobSearchParams, CandidateProfile } from '@applyai/shared-types';
import { randomUUID } from 'crypto';
import { AIService } from '../ai/ai.service.js';

export class JobsService {
  private static aiJobsCache = new Map<string, Job>();
  private aiService = new AIService();

  static saveToCache(jobList: Job[]) {
    jobList.forEach(job => this.aiJobsCache.set(job.id, job));
  }

  async searchJobs(params: JobSearchParams): Promise<Job[]> {
    const mockJobs = this.generateMockJobs(params);
    JobsService.saveToCache(mockJobs);
    try {
      await this.syncJobsWithDB(mockJobs);
    } catch (e) {
      console.warn('DB Sync failed, continuing with cache', e);
    }
    return mockJobs;
  }

  async getJobById(id: string): Promise<Job | null> {
    const cached = JobsService.aiJobsCache.get(id);
    if (cached) return cached;
    try {
      const { db } = await import('../../db/index.js');
      const { jobs } = await import('../../db/schema.js');
      const { eq } = await import('drizzle-orm');
      if (!db) return null;
      const result = await db.select().from(jobs).where(eq(jobs.id, id));
      return (result[0] as any as Job) || null;
    } catch (e) {
      return null;
    }
  }

  async getRecommendations(userId: string): Promise<Job[]> {
    try {
      const { db } = await import('../../db/index.js');
      const { jobs, profiles, userSearches, applications } = await import('../../db/schema.js');
      const { sql, eq, and, notInArray, desc } = await import('drizzle-orm');

      if (!db) return [];
      const [profileData] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      if (!profileData) return [];

      const profile: CandidateProfile = {
        name: profileData.name,
        email: '', // Add missing property
        headline: profileData.headline || undefined,
        yearsExperience: profileData.yearsExperience || 0,
        skills: profileData.skills || [],
        preferredLocations: profileData.preferredLocations || [],
        preferredSalary: profileData.preferredSalary || undefined,
        workExperience: [],
        education: [],
        certifications: [],
        projects: [],
        achievements: [],
      };

      const appliedJobs = await db.select({ jobId: applications.jobId }).from(applications).where(eq(applications.userId, userId));
      const excludedIds = (appliedJobs as any[]).map(a => a.jobId);

      const profileParams = await this.aiService.generateSearchParametersFromProfile(profile);
      const recentSearches = await db.select().from(userSearches).where(eq(userSearches.userId, userId)).orderBy(desc(userSearches.createdAt)).limit(3);

      let baseQuery = db.select().from(jobs).where(eq(jobs.isActive, true));
      if (excludedIds.length > 0) {
        baseQuery = baseQuery.where(notInArray(jobs.id, excludedIds));
      }

      let conditions = [];
      if (profileParams.title) {
        conditions.push(sql`${jobs.title} ilike ${`%${profileParams.title}%`}`);
      }
      if (profileParams.skills && profileParams.skills.length > 0) {
        const skillPattern = `%${profileParams.skills[0]}%`;
        conditions.push(sql`(${jobs.description} ilike ${skillPattern} OR ${jobs.title} ilike ${skillPattern})`);
      }

      if (recentSearches.length > 0 && conditions.length === 0) {
        (recentSearches as any[]).forEach(s => {
          if (s.query) {
            conditions.push(sql`${jobs.title} ilike ${`%${s.query}%`}`);
          }
        });
      }

      let finalQuery: any = baseQuery;
      if (conditions.length > 0) {
        finalQuery = baseQuery.where(and(...conditions));
      }

      const results = await finalQuery.orderBy(desc(jobs.postedAt)).limit(10);
      const jobList = results.map((j: any) => ({
        id: j.id,
        externalId: j.externalId,
        source: j.source || 'Direct',
        title: j.title,
        description: j.description,
        companyName: j.companyName,
        companyWebsite: j.companyWebsite,
        companyLogoUrl: j.companyLogoUrl,
        location: j.location,
        countryCode: j.countryCode || 'IN',
        workplaceType: j.workplaceType,
        employmentType: j.employmentType || 'FULL_TIME',
        experienceLevel: j.experienceLevel,
        salaryCurrency: j.salaryCurrency,
        salaryMin: j.salaryMin ? Number(j.salaryMin) : undefined,
        salaryMax: j.salaryMax ? Number(j.salaryMax) : undefined,
        salaryPeriod: j.salaryPeriod,
        applyUrl: j.applyUrl || '',
        contactEmail: j.contactEmail,
        isActive: j.isActive,
        postedAt: j.postedAt,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      }));

      JobsService.saveToCache(jobList as Job[]);
      return jobList as Job[];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
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
    try {
        const { db } = await import('../../db/index.js');
        const { jobs } = await import('../../db/schema.js');
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
    } catch (e) {
        console.error('Sync error:', e);
    }
  }
}
