import { JobSearchParams, CandidateProfile, OrchestratorResponse, Job } from '@applyai/shared-types';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../../lib/supabase.js';

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6K_UYww88fbrGXaZv3NGRjM0ep45uVzGRcH7djqRCqKDw';

// Schemas defined outside the class to avoid initialization/TS-Node issues
const JobSearchParamsSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    location: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    experienceLevel: { type: "string", enum: ['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'DIRECTOR', 'EXECUTIVE', 'INTERNSHIP'] },
    employmentType: { type: "string", enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'OTHER'] },
    workplaceType: { type: "string", enum: ['ON_SITE', 'HYBRID', 'REMOTE'] },
    salaryMin: { type: "number" },
    postedAfter: { type: "string" },
  }
};

const ResumeSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    headline: { type: "string" },
    yearsExperience: { type: "number" },
    skills: { type: "array", items: { type: "string" } },
    education: { type: "array", items: { type: "string" } },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          startDate: { type: "string", description: "YYYY-MM" },
          endDate: { type: "string", description: "YYYY-MM or 'Present'" },
          isCurrent: { type: "boolean" },
          location: { type: "string" },
          description: { type: "string" }
        },
        required: ["company", "role", "startDate", "description"]
      }
    }
  },
  required: ["name", "email", "skills", "workExperience"]
};

export class AIService {
  private _client: any = null;

  private get client() {
    if (!this._client) {
      this._client = new GoogleGenAI({
        apiKey: GEMINI_API_KEY
      });
    }
    return this._client;
  }

  private async callAI(messages: any[], jsonSchema?: any): Promise<any> {
    const prompt = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    const finalPrompt = jsonSchema
      ? `${prompt}\n\nCRITICAL: Return ONLY valid JSON matching this schema: ${JSON.stringify(jsonSchema)}. No markdown.`
      : prompt;

    try {
      const result = await this.client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: finalPrompt
      });

      const content = result.text.trim();

      if (jsonSchema) {
        try {
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

  private heuristicExtract(query: string): JobSearchParams {
    const q = query.toLowerCase();
    const params: JobSearchParams = {};

    if (q.includes('remote')) {
      params.workplaceType = 'REMOTE';
    } else if (q.includes('hybrid')) {
      params.workplaceType = 'HYBRID';
    } else if (q.includes('on-site') || q.includes('onsite') || q.includes('office')) {
      params.workplaceType = 'ON_SITE';
    }

    const cities = ['bangalore', 'bengaluru', 'mumbai', 'pune', 'delhi', 'noida', 'gurgaon', 'gurugram', 'chennai', 'hyderabad', 'kolkata', 'london', 'san francisco', 'seattle', 'new york', 'remote'];
    for (const city of cities) {
      if (q.includes(city)) {
        params.location = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    if (q.includes('senior') || q.includes('sr.')) params.experienceLevel = 'SENIOR_LEVEL';
    else if (q.includes('lead') || q.includes('staff') || q.includes('principal')) params.experienceLevel = 'DIRECTOR';
    else if (q.includes('junior') || q.includes('jr.')) params.experienceLevel = 'ENTRY_LEVEL';
    else if (q.includes('intern')) params.experienceLevel = 'INTERNSHIP';
    else if (q.includes('fresher')) params.experienceLevel = 'ENTRY_LEVEL';

    if (q.includes('contract')) params.employmentType = 'CONTRACT';
    else if (q.includes('part-time') || q.includes('part time')) params.employmentType = 'PART_TIME';
    else if (q.includes('full-time') || q.includes('full time')) params.employmentType = 'FULL_TIME';

    const salaryMatch = q.match(/(\d+)\s*(lpa|l|k|lac|lakh|thousand)/i);
    if (salaryMatch) {
      params.salaryMin = parseInt(salaryMatch[1]);
    }

    let daysAgo = 30;
    if (q.includes('today')) daysAgo = 1;
    else if (q.includes('yesterday')) daysAgo = 2;
    else if (q.includes('last week')) daysAgo = 7;
    else if (q.includes('last month')) daysAgo = 30;
    else {
      const relativeMatch = q.match(/(\d+)\s*(day|week|month)s?\s*ago/);
      if (relativeMatch) {
        const num = parseInt(relativeMatch[1]);
        const unit = relativeMatch[2];
        if (unit === 'day') daysAgo = num;
        else if (unit === 'week') daysAgo = num * 7;
        else if (unit === 'month') daysAgo = num * 30;
      }
    }
    params.postedAfter = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    let title = query
      .replace(/find|search|for|jobs|roles|hiring|opportunities|in|at|last|week|month|ago|today|yesterday/gi, "")
      .replace(new RegExp(params.location || "", "gi"), "")
      .replace(/\s+/g, " ")
      .trim();

    params.title = title || undefined;

    return params;
  }

  async extractJobSearchParams(query: string): Promise<JobSearchParams> {
    const messages = [
      {
        role: 'system',
        content: `Extract structured job search parameters.
        Current Time: ${new Date().toISOString()}.`
      },
      { role: 'user', content: query }
    ];

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('AI Timeout')), 15000)
    );

    try {
      const extracted = await Promise.race([
        this.callAI(messages, JobSearchParamsSchema),
        timeoutPromise
      ]) as any;

      if (!extracted) throw new Error('No data extracted');

      const params: JobSearchParams = {
        ...extracted,
        title: (extracted.title || extracted.role || "").replace(/roles|jobs|hiring|developers|engineer/gi, "").trim() || undefined
      };

      return params;
    } catch (e) {
      return this.heuristicExtract(query);
    }
  }

  async getAggregatedOrchestratorResponse(query: string, history: any[] = []): Promise<OrchestratorResponse> {
    const params = await this.extractJobSearchParams(query);
    let jobs: Job[] = [];

    try {
      let q = supabase.from('jobs').select('*').eq('is_active', true);

      if (params.title) {
        const words = params.title.split(' ').filter(w => w.length > 1);
        if (words.length > 0) {
          const searchPattern = `%${words.join('%')}%`;
          q = q.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`);
        }
      }

      if (params.location) {
        q = q.ilike('location', `%${params.location}%`);
      }

      if (params.salaryMin) {
        q = q.gte('salary_min', params.salaryMin);
      }

      if (params.experienceLevel) {
        q = q.eq('experience_level', params.experienceLevel);
      }

      if (params.employmentType) {
        q = q.eq('employment_type', params.employmentType);
      }

      if (params.workplaceType) {
        q = q.eq('workplace_type', params.workplaceType);
      }

      if (params.postedAfter) {
        q = q.gte('posted_at', params.postedAfter);
      }

      const { data, error } = await q.order('posted_at', { ascending: false }).limit(20);

      if (!error && data) {
        jobs = data.map((j: any) => ({
          id: j.id,
          externalId: j.external_id,
          source: j.source || 'Direct',
          title: j.title,
          description: j.description,
          companyName: j.company_name,
          companyWebsite: j.company_website,
          companyLogoUrl: j.company_logo_url,
          location: j.location,
          countryCode: j.country_code || 'IN',
          workplaceType: j.workplace_type,
          employmentType: j.employment_type || 'FULL_TIME',
          experienceLevel: j.experience_level,
          salaryCurrency: j.salary_currency,
          salaryMin: j.salary_min,
          salaryMax: j.salary_max,
          salaryPeriod: j.salary_period,
          applyUrl: j.apply_url || '',
          contactEmail: j.contact_email,
          isActive: j.is_active,
          postedAt: j.posted_at,
          expiresAt: j.expires_at,
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        }));
      }
    } catch (err) {
      console.error('Supabase Query Error:', err);
    }

    const refinementMessages = [
      {
        role: 'system',
        content: `You are a career assistant. Summarize the job search results for the user.`
      },
      ...history.map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text
      })),
      {
        role: 'user',
        content: `Query: "${query}"\nExtracted Params: ${JSON.stringify(params)}\nResults Found: ${jobs.length}`
      }
    ];

    const messageSchema = {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    };

    let message = `I found ${jobs.length} matching roles.`;
    try {
      const summary = await this.callAI(refinementMessages, messageSchema);
      if (summary?.message) message = summary.message;
    } catch (e) {}

    return { query, params, jobs, message };
  }

  async parseResumeText(text: string): Promise<CandidateProfile> {
    const messages = [
      {
        role: 'system',
        content: `You are an expert resume parser. Extract structured data from the provided resume text.`
      },
      { role: 'user', content: text }
    ];

    try {
      return await this.callAI(messages, ResumeSchema);
    } catch (e) {
      return {
        name: text.split('\n')[0]?.substring(0, 50) || 'Unknown',
        email: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || '',
        yearsExperience: 0,
        skills: [],
        workExperience: [],
        education: [],
        certifications: [],
        projects: [],
        achievements: [],
        preferredLocations: []
      };
    }
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
