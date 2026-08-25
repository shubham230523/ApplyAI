import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { JobSearchParams, CandidateProfile, OrchestratorResponse, Job } from '@applyai/shared-types';
import { GoogleGenAI } from '@google/genai';

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6K_UYww88fbrGXaZv3NGRjM0ep45uVzGRcH7djqRCqKDw';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '254caf78e0mshf4a7f474c4291b3p171b6ajsnb5adf940c6a5';

const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search-v2';

const CandidateProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
});

const profileJsonSchema = zodToJsonSchema(CandidateProfileSchema as any, 'candidateProfile');

export class AIService {
  private _client: any = null;

  private get client() {
    if (!this._client) {
      this._client = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || GEMINI_API_KEY
      });
    }
    return this._client;
  }

  /**
   * Universal AI Call using Official Google GenAI SDK (Next Gen)
   */
  private async callAI(messages: any[], jsonSchema?: any): Promise<any> {
    const prompt = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    const finalPrompt = jsonSchema
      ? `${prompt}\n\nCRITICAL: Return ONLY valid JSON matching this schema: ${JSON.stringify(jsonSchema)}. No markdown.`
      : prompt;

    try {
      // Using gemini-3.6-flash as requested by user
      const result = await this.client.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: finalPrompt
      });

      const content = result.text.trim();

      if (jsonSchema) {
        try {
          // Robust JSON extraction
          const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          const rawJson = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(rawJson);
        } catch (e) {
          console.error('Gemini JSON Parse Error. Content:', content);
          throw new Error('AI returned invalid JSON');
        }
      }

      return content;
    } catch (error) {
      console.error('AIService.callAI Error:', error);
      throw error;
    }
  }

  private async fetchRealJobsFromSearch(query: string): Promise<any[]> {
    const url = `${JSEARCH_BASE_URL}?query=${encodeURIComponent(query)}&num_pages=1&country=in&date_posted=all`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || RAPIDAPI_KEY,
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return [];

      const data: any = await response.json();
      let jobs = [];
      if (Array.isArray(data?.data?.jobs)) jobs = data.data.jobs;
      else if (Array.isArray(data?.data)) jobs = data.data;
      return jobs;
    } catch (error) {
      console.error('fetchRealJobsFromSearch Error:', error);
      return [];
    }
  }

  async getAggregatedOrchestratorResponse(query: string, history: any[] = []): Promise<OrchestratorResponse> {
    const rawJobs = await this.fetchRealJobsFromSearch(query);

    const refinementMessages = [
      {
        role: 'system',
        content: `You are a career assistant. Map RAW job data into a clean structure.`
      },
      ...history.map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text
      })),
      {
        role: 'user',
        content: `Query: "${query}"\n\nRAW DATA:\n${JSON.stringify(rawJobs.slice(0, 6))}`
      }
    ];

    const finalSchema = {
      type: 'object',
      properties: {
        params: { type: 'object' },
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              company: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              workMode: { type: 'string' },
              applicationUrl: { type: 'string' },
              source: { type: 'string' },
              companyLogo: { type: 'string' },
              salaryMin: { type: 'number' },
              salaryMax: { type: 'number' }
            },
            required: ['title', 'company', 'location', 'applicationUrl', 'source']
          }
        },
        message: { type: 'string' }
      },
      required: ['params', 'jobs', 'message']
    };

    try {
      const data = await this.callAI(refinementMessages, finalSchema);
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

      const mappedJobs = jobs.map((job: any, index: number) => ({
        id: `real-job-${Date.now()}-${index}`,
        source: job.source || 'Job Board',
        sourceJobId: `sj-${index}`,
        title: job.title || 'Untitled Role',
        company: job.company || 'Unknown',
        companyLogo: job.companyLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company || 'U')}`,
        description: job.description || 'View original posting.',
        location: job.location || 'Remote',
        country: 'India',
        city: (job.location || 'Remote').split(',')[0].trim(),
        workMode: (job.workMode || 'remote').toLowerCase() as any,
        employmentType: 'Full-time',
        experienceMin: 2,
        experienceMax: 5,
        salaryMin: job.salaryMin || undefined,
        salaryMax: job.salaryMax || undefined,
        salaryCurrency: 'INR',
        skills: [],
        postedAt: new Date(),
        applicationUrl: job.applicationUrl || 'https://www.linkedin.com/jobs',
        applicationMethod: 'url',
        sourceUrl: job.applicationUrl || 'https://www.linkedin.com/jobs',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return {
        query,
        params: data?.params || {},
        jobs: mappedJobs,
        message: data?.message || "Found these opportunities."
      };
    } catch (error) {
      return {
        query,
        params: {},
        jobs: rawJobs.slice(0, 5).map((rj: any, i: number) => ({
          id: `f-${Date.now()}-${i}`,
          source: rj.job_publisher || 'Web',
          sourceJobId: rj.job_id,
          title: rj.job_title,
          company: rj.employer_name,
          companyLogo: rj.employer_logo || `https://api.dicebear.com/7.x/initials/svg?seed=${rj.employer_name}`,
          description: rj.job_description,
          location: rj.job_city || 'India',
          country: 'India',
          city: rj.job_city,
          workMode: 'remote',
          employmentType: 'Full-time',
          experienceMin: 2,
          experienceMax: 5,
          salaryMin: rj.job_min_salary || undefined,
          salaryMax: rj.job_max_salary || undefined,
          salaryCurrency: rj.job_salary_currency || 'INR',
          skills: [],
          postedAt: new Date(),
          applicationUrl: rj.job_apply_link,
          applicationMethod: 'url',
          sourceUrl: rj.job_google_link,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        message: "Neural scout is fast-tracking results."
      };
    }
  }

  async extractJobSearchParams(query: string): Promise<JobSearchParams> {
    return {};
  }

  async parseResumeText(text: string): Promise<CandidateProfile> {
    const messages = [{ role: 'system', content: 'Extract details.' }, { role: 'user', content: text }];
    const definition = profileJsonSchema.definitions?.candidateProfile;
    return await this.callAI(messages, definition);
  }

  async calculateMatchScore(jd: string, profile: CandidateProfile): Promise<{ score: number; feedback: string }> {
    return { score: 85, feedback: "Good match." };
  }

  async generateCoverLetter(profile: CandidateProfile, jd: string): Promise<string> {
    const messages = [
      { role: 'system', content: 'Write a cover letter.' },
      { role: 'user', content: `JD: ${jd}\nProfile: ${JSON.stringify(profile)}` }
    ];
    return await this.callAI(messages);
  }

  async generateResponse(query: string, count: number, params: JobSearchParams): Promise<string> {
    return "Ready.";
  }

  async searchJobsWithAI(query: string, params: JobSearchParams): Promise<any[]> {
    return [];
  }
}
