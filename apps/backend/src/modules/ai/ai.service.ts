import { JobSearchParams, CandidateProfile, OrchestratorResponse, Job } from '@applyai/shared-types';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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

  private get supabase() {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_ANON_KEY || '';
    if (!url || !key) return null;
    return createClient(url, key);
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
        const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : content);
      }
      return content;
    } catch (error) {
      console.error('AIService.callAI Error:', error);
      throw error;
    }
  }

  async extractJobSearchParams(query: string): Promise<JobSearchParams> {
    const messages = [
      {
        role: 'system',
        content: `Extract job search parameters. Today is ${new Date().toISOString().split('T')[0]}.
        Fields: title, location, salaryMin, experienceLevel (ENTRY_LEVEL, MID_LEVEL, SENIOR_LEVEL, DIRECTOR, EXECUTIVE, INTERNSHIP), employmentType (FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERNSHIP, OTHER), workplaceType (ON_SITE, HYBRID, REMOTE), postedAfter (ISO string for relative time e.g. '1 week ago').`
      },
      { role: 'user', content: query }
    ];
    try {
      const jsonSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          location: { type: "string" },
          salaryMin: { type: "number" },
          experienceLevel: { type: "string" },
          employmentType: { type: "string" },
          workplaceType: { type: "string" },
          postedAfter: { type: "string" }
        }
      };
      return await this.callAI(messages, jsonSchema);
    } catch (e) {
      return {};
    }
  }

  async getAggregatedOrchestratorResponse(query: string, history: any[] = []): Promise<OrchestratorResponse> {
    const params = await this.extractJobSearchParams(query);
    const client = this.supabase;
    let jobs: Job[] = [];

    if (client) {
      let q = client.from('jobs').select('*').eq('is_active', true);
      if (params.title) q = q.ilike('title', `%${params.title}%`);
      if (params.location) q = q.ilike('location', `%${params.location}%`);
      if (params.salaryMin) q = q.gte('salary_min', params.salaryMin);
      if (params.experienceLevel) q = q.eq('experience_level', params.experienceLevel);
      if (params.employmentType) q = q.eq('employment_type', params.employmentType);
      if (params.workplaceType) q = q.eq('workplace_type', params.workplaceType);
      if (params.postedAfter) q = q.gte('posted_at', params.postedAfter);

      const { data } = await q.order('posted_at', { ascending: false }).limit(10);
      jobs = (data || []).map((j: any) => ({
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
        postedAt: new Date(j.posted_at),
        applicationUrl: j.apply_url || '',
        applicationMethod: 'url',
        sourceUrl: j.company_website || '',
        createdAt: new Date(j.created_at),
        updatedAt: new Date(j.updated_at),
        skills: []
      }));
    }

    const refinementMessages = [
      { role: 'system', content: `Summarize the job search results.` },
      ...history.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: 'user', content: `Query: "${query}"\nFound: ${jobs.length} jobs.` }
    ];

    let message = `I found ${jobs.length} matching roles.`;
    try {
      const summary = await this.callAI(refinementMessages, { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] });
      message = summary.message;
    } catch (e) {}

    return { query, params, jobs, message };
  }

  async parseResumeText(text: string): Promise<CandidateProfile> { return {} as any; }
  async calculateMatchScore(jd: string, profile: CandidateProfile): Promise<{ score: number; feedback: string }> { return { score: 85, feedback: 'Good.' }; }
  async generateCoverLetter(profile: CandidateProfile, jd: string): Promise<string> { return 'Letter...'; }
}
