import { Job, JobSearchParams, CandidateProfile } from '@applyai/shared-types';
import { randomUUID } from 'crypto';

export class JobsService {
  private static aiJobsCache = new Map<string, Job>();

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

  async createJob(recruiterId: string, jobData: Partial<Job>): Promise<Job | null> {
    const { db } = await import('../../db/index.js');
    const { jobs } = await import('../../db/schema.js');
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
    const { db } = await import('../../db/index.js');
    const { jobs, applications } = await import('../../db/schema.js');
    const { eq, sql } = await import('drizzle-orm');
    if (!db) return [];
    try {
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

  async getRecommendations(userId: string): Promise<Job[]> {
    try {
      const { db } = await import('../../db/index.js');
      const { jobs, profiles, resumes, userSearches, applications } = await import('../../db/schema.js');
      const { AIService } = await import('../ai/ai.service.js');
      const { sql, eq, and, notInArray, desc, or } = await import('drizzle-orm');

      if (!db) return [];

      const aiService = new AIService();

      // 1. Fetch Profile and Main Resume
      const [[profileData], [resumeData]] = await Promise.all([
        db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1),
        db.select().from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.isMain, true))).limit(1)
      ]);

      if (!profileData) {
        console.log(`[Recommendations] No profile found for user ${userId}`);
        return [];
      }

      // Populate profile with resume content if available
      const parsedResume = resumeData?.parsedContent as any;
      const profile: CandidateProfile = {
        name: profileData.name,
        email: '',
        headline: profileData.headline || parsedResume?.headline || undefined,
        yearsExperience: profileData.yearsExperience || parsedResume?.yearsExperience || 0,
        skills: (profileData.skills?.length ? profileData.skills : parsedResume?.skills) || [],
        preferredLocations: profileData.preferredLocations || [],
        preferredSalary: profileData.preferredSalary || undefined,
        workExperience: parsedResume?.workExperience || [],
        education: parsedResume?.education || [],
        certifications: parsedResume?.certifications || [],
        projects: parsedResume?.projects || [],
        achievements: parsedResume?.achievements || [],
      };

      console.log(`[Recommendations] Generating params for ${profile.name} with ${profile.skills.length} skills`);

      // 2. Fetch applied job IDs to exclude
      const appliedJobs = await db.select({ jobId: applications.jobId }).from(applications).where(eq(applications.userId, userId));
      const excludedIds = (appliedJobs as any[]).map(a => a.jobId);

      // 3. AI Extraction
      const profileParams = await aiService.generateSearchParametersFromProfile(profile);
      console.log(`[Recommendations] AI Extracted Params:`, JSON.stringify(profileParams));

      // 4. Fetch search history for secondary priority
      const recentSearches = await db.select().from(userSearches).where(eq(userSearches.userId, userId)).orderBy(desc(userSearches.createdAt)).limit(3);

      // 5. Build Query
      let baseQuery = db.select().from(jobs).where(eq(jobs.isActive, true));
      if (excludedIds.length > 0) {
        baseQuery = baseQuery.where(notInArray(jobs.id, excludedIds));
      }

      let conditions = [];

      // Title Match (Strongest signal)
      if (profileParams.title) {
        conditions.push(sql`${jobs.title} ilike ${`%${profileParams.title}%`}`);
      }

      // Skill Matching (At least one of the top skills)
      const topSkills = profileParams.skills?.slice(0, 3) || profile.skills?.slice(0, 3) || [];
      if (topSkills.length > 0) {
        const skillConditions = topSkills.map(skill =>
          sql`(${jobs.description} ilike ${`%${skill}%`} OR ${jobs.title} ilike ${`%${skill}%`})`
        );
        conditions.push(or(...skillConditions));
      }

      // Fallback to search history if no profile matches yet
      if (conditions.length === 0 && recentSearches.length > 0) {
        const searchConditions = (recentSearches as any[]).map(s => sql`${jobs.title} ilike ${`%${s.query}%`}`);
        conditions.push(or(...searchConditions));
      }

      let finalQuery: any = baseQuery;
      if (conditions.length > 0) {
        finalQuery = baseQuery.where(and(...conditions));
      }

      const results = await finalQuery.orderBy(desc(jobs.postedAt)).limit(10);

      console.log(`[Recommendations] Found ${results.length} results`);

      // If no results with strict matching, try a broader search (only first skill)
      if (results.length === 0 && profile.skills.length > 0) {
        console.log(`[Recommendations] Broadening search...`);
        const broadResults = await baseQuery
          .where(or(
            sql`${jobs.title} ilike ${`%${profile.skills[0]}%`}`,
            sql`${jobs.description} ilike ${`%${profile.skills[0]}%`}`
          ))
          .orderBy(desc(jobs.postedAt))
          .limit(10);

        results.push(...broadResults);
      }

      const jobList = results.map((j: any) => ({
        id: j.id,
        externalId: j.externalId,
        source: j.source || 'Direct',
        title: j.title,
        description: j.description,
        companyName: j.company_name,
        companyWebsite: j.companyWebsite,
        companyLogoUrl: j.companyLogoUrl,
        location: j.location,
        countryCode: j.countryCode || 'IN',
        workplaceType: j.workplaceType,
        employmentType: j.employmentType || 'FULL_TIME',
        experienceLevel: j.experience_level,
        salaryCurrency: j.salary_currency,
        salaryMin: j.salaryMin ? Number(j.salaryMin) : undefined,
        salaryMax: j.salaryMax ? Number(j.salaryMax) : undefined,
        salaryPeriod: j.salaryPeriod,
        applyUrl: j.apply_url || '',
        contactEmail: j.contact_email,
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
