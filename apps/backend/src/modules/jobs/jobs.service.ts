import { db } from '../../db/index.js';
import { jobs } from '../../db/schema.js';
import { Job, JobSearchParams } from '@applyai/shared-types';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class JobsService {
  private static aiJobsCache = new Map<string, Job>();

  static saveToCache(jobList: Job[]) {
    jobList.forEach(job => this.aiJobsCache.set(job.id, job));
  }

  async searchJobs(params: JobSearchParams): Promise<Job[]> {
    // In a real scenario, this would call multiple job board APIs
    // For now, we'll return mock data based on the extracted params
    const mockJobs = this.generateMockJobs(params);

    // Save to Cache for Detail Screen
    JobsService.saveToCache(mockJobs);

    // Save/Sync with DB (optional for MVP)
    try {
      await this.syncJobsWithDB(mockJobs);
    } catch (e) {
      console.warn('DB Sync failed, continuing with cache');
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
      const result = await db.select().from(jobs).where(sql`${jobs.id} = ${id}`);
      return (result[0] as Job) || null;
    } catch (e) {
      return null;
    }
  }

  private generateMockJobs(params: JobSearchParams): Job[] {
    const titles = [params.title || 'Software Engineer', 'Full Stack Developer', 'Backend Developer'];
    const location = params.location || 'Remote';

    return Array.from({ length: 5 }).map((_, i) => ({
      id: uuidv4(),
      source: 'MockBoard',
      sourceJobId: `mock-${i}-${Date.now()}`,
      title: titles[i % titles.length],
      company: `TechCorp ${i + 1}`,
      companyLogo: `https://api.dicebear.com/7.x/initials/svg?seed=TechCorp${i}`,
      description: `Exciting opportunity for a ${params.title || 'developer'} in ${location}. Required skills: ${(params.skills || ['React', 'Node.js']).join(', ')}.`,
      location: location,
      country: 'India',
      city: location,
      workMode: params.workMode || 'remote',
      employmentType: 'Full-time',
      experienceMin: params.experienceMin || 2,
      experienceMax: (params.experienceMin || 2) + 3,
      salaryMin: params.salaryMin || 10,
      salaryMax: (params.salaryMin || 10) + 5,
      salaryCurrency: 'INR',
      skills: params.skills || ['JavaScript', 'TypeScript'],
      postedAt: new Date(),
      applicationUrl: 'https://example.com/apply',
      applicationMethod: 'url',
      sourceUrl: 'https://example.com/job',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  private async syncJobsWithDB(jobList: Job[]) {
    if (!db) return;
    for (const job of jobList) {
      await db.insert(jobs).values({
        source: job.source,
        sourceJobId: job.sourceJobId,
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        description: job.description,
        location: job.location,
        workMode: job.workMode,
        employmentType: job.employmentType,
        experienceMin: job.experienceMin,
        experienceMax: job.experienceMax,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        skills: job.skills,
        postedAt: job.postedAt,
        applicationUrl: job.applicationUrl,
      }).onConflictDoUpdate({
        target: [jobs.source, jobs.sourceJobId],
        set: {
          title: job.title,
          updatedAt: new Date(),
        }
      });
    }
  }
}
