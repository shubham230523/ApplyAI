import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { JobSearchParams, CandidateProfile, OrchestratorResponse, Job } from '@applyai/shared-types';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../../lib/supabase.js';

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6K_UYww88fbrGXaZv3NGRjM0ep45uVzGRcH7djqRCqKDw';

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
        apiKey: GEMINI_API_KEY
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

  async extractJobSearchParams(query: string): Promise<JobSearchParams> {
    const JobSearchParamsSchema = z.object({
      title: z.string().optional().describe("Core job keywords (e.g., 'Android'). No fluff."),
      location: z.string().optional().describe("City or country."),
      skills: z.array(z.string()).optional(),
      experienceLevel: z.enum(['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'DIRECTOR', 'EXECUTIVE', 'INTERNSHIP']).optional(),
      employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'OTHER']).optional(),
      workplaceType: z.enum(['ON_SITE', 'HYBRID', 'REMOTE']).optional(),
      salaryMin: z.number().optional(),
      postedAfter: z.string().optional().describe('Full ISO 8601 timestamp string.'),
    });

    const messages = [
      {
        role: 'system',
        content: `Extract structured job search parameters.
        Current Time: ${new Date().toISOString()}.

        Guidelines:
        - title: Extract core role keywords (e.g., "Android" from "Android roles").
        - postedAfter: If user mentions time (e.g., "last week"), calculate the ISO 8601 timestamp (YYYY-MM-DDTHH:mm:ssZ) based on Current Time.
        - If no time is specified, default to 30 days ago.`
      },
      { role: 'user', content: query }
    ];

    try {
      const extracted = await this.callAI(messages, zodToJsonSchema(JobSearchParamsSchema as any));

      // Robust mapping
      const params: JobSearchParams = {
        ...extracted,
        title: (extracted.title || (extracted as any).role || "").replace(/roles|jobs|hiring|developers|engineer/gi, "").trim() || undefined
      };

      return params;
    } catch (e) {
      console.error('extractJobSearchParams Error:', e);
      return {};
    }
  }

  async getAggregatedOrchestratorResponse(query: string, history: any[] = []): Promise<OrchestratorResponse> {
    const params = await this.extractJobSearchParams(query);
    let jobs: Job[] = [];

    console.log("DEBUG: Final Query Params ->", JSON.stringify(params, null, 2));

    try {
      let q = supabase.from('jobs').select('*').eq('is_active', true);

      if (params.title) {
        const words = params.title.split(' ').filter(w => w.length > 1);
        if (words.length > 0) {
          const searchPattern = `%${words.join('%')}%`;
          // Fuzzy search in both title and description
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

      if (error) {
        console.error('Supabase fetch error:', error);
      }

      if (!error && data) {
        jobs = data.map((j: any) => ({
          id: j.id,
          source: j.source || 'Direct',
          sourceJobId: j.external_id || j.id,
          title: j.title,
          company: j.company_name,
          companyLogo: j.company_logo_url,
          description: j.description,
          location: j.location,
          country: j.country_code || 'IN',
          city: j.location?.split(',')[0].trim() || 'Unknown',
          workMode: (j.workplace_type === 'ON_SITE' ? 'onsite' : j.workplace_type?.toLowerCase() || 'onsite') as any,
          employmentType: j.employment_type || 'FULL_TIME',
          experienceMin: 0,
          salaryMin: j.salary_min,
          salaryMax: j.salary_max,
          salaryCurrency: j.salary_currency,
          postedAt: new Date(j.posted_at),
          applicationUrl: j.apply_url || '',
          applicationMethod: 'url',
          sourceUrl: j.company_website || '',
          createdAt: new Date(j.created_at),
          updatedAt: new Date(j.updated_at),
          skills: []
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
    const messages = [{ role: 'system', content: 'Extract details.' }, { role: 'user', content: text }];
    const definition = (profileJsonSchema as any).definitions?.candidateProfile;
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
