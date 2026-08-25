import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { JobSearchParams, CandidateProfile, OrchestratorResponse, Job } from '@applyai/shared-types';
import fetch from 'node-fetch';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3.5-lightning:free';

const JobSearchSchema = z.object({
  title: z.string().optional().describe('The job title or role (e.g., "Android Developer", "Software Engineer")'),
  location: z.string().optional().describe('The city or region for the job (e.g., "Mumbai", "Remote")'),
  skills: z.array(z.string()).optional().describe('List of specific skills mentioned (e.g., ["React", "TypeScript"])'),
  experienceMin: z.number().optional().describe('Minimum years of experience required'),
  salaryMin: z.number().optional().describe('Minimum salary expected (in LPA if not specified)'),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).optional().describe('Preferred work mode'),
});

const CandidateProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  headline: z.string().optional(),
  yearsExperience: z.number().default(0),
  skills: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  preferredSalary: z.number().optional(),
  noticePeriod: z.string().optional(),
});

const jobSearchJsonSchema = zodToJsonSchema(JobSearchSchema as any, 'jobSearch');
const profileJsonSchema = zodToJsonSchema(CandidateProfileSchema as any, 'candidateProfile');

export class AIService {
  private async callAI(messages: any[], jsonSchema?: any) {
    const body: any = {
      model: MODEL,
      messages,
      reasoning: { enabled: true },
    };

    if (jsonSchema) {
      // For OpenRouter free models, we'll emphasize JSON in the system prompt
      messages[0].content += `\n\nCRITICAL: Return ONLY a valid JSON object matching this schema: ${JSON.stringify(jsonSchema)}. Do not include any other text or markdown blocks.`;
    }

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://applyai.app',
          'X-Title': 'ApplyAI',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('AI API Error:', error);
        throw new Error('AI Service failed');
      }

      const result: any = await response.json();
      const content = result.choices[0].message.content;

      if (jsonSchema) {
        // Find JSON block (object or array) if AI wrapped it in markdown
        const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : content);
      }

      return content;
    } catch (error) {
      console.error('callAI Error:', error);
      throw error;
    }
  }

  async getAggregatedOrchestratorResponse(query: string): Promise<OrchestratorResponse> {
    const messages = [
      {
        role: 'system',
        content: `You are an elite recruitment AI orchestrator for ApplyAI.
        Your goal is to process a user query and perform three tasks in ONE response:
        1. Extract structured search parameters.
        2. Generate 5-7 highly realistic job listings that feel like they come from top platforms (LinkedIn, Wellfound).
        3. Write a friendly, professional, and slightly enthusiastic response to the user.

        CRITICAL: Return ONLY a JSON object. No markdown. No text outside.`,
      },
      {
        role: 'user',
        content: `User Query: "${query}"`,
      },
    ];

    const aggregatedSchema = {
      type: 'object',
      properties: {
        params: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            location: { type: 'string' },
            experienceMin: { type: 'number' },
            skills: { type: 'array', items: { type: 'string' } },
          },
        },
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              company: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              salaryMin: { type: 'number' },
              salaryMax: { type: 'number' },
              skills: { type: 'array', items: { type: 'string' } },
              workMode: { type: 'string', enum: ['remote', 'hybrid', 'onsite'] },
              experienceMin: { type: 'number' },
            },
            required: ['title', 'company', 'location', 'description', 'skills', 'workMode'],
          },
        },
        message: { type: 'string' },
      },
      required: ['params', 'jobs', 'message'],
    };

    try {
      const data = await this.callAI(messages, aggregatedSchema);

      const mappedJobs = data.jobs.map((job: any, index: number) => ({
        id: `ai-job-${Date.now()}-${index}`,
        source: 'AI-Search',
        sourceJobId: `ai-${index}`,
        title: job.title,
        company: job.company,
        companyLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company)}`,
        description: job.description,
        location: job.location,
        country: 'India',
        city: job.location.split(',')[0].trim(),
        workMode: job.workMode || 'remote',
        employmentType: 'Full-time',
        experienceMin: job.experienceMin || 2,
        experienceMax: (job.experienceMin || 2) + 3,
        salaryMin: job.salaryMin || 12,
        salaryMax: job.salaryMax || 20,
        salaryCurrency: 'INR',
        skills: job.skills,
        postedAt: new Date().toISOString(),
        applicationUrl: 'https://example.com/apply',
        applicationMethod: 'url',
        sourceUrl: 'https://example.com/job',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return {
        query,
        params: data.params,
        jobs: mappedJobs,
        message: data.message,
      };
    } catch (error) {
      console.error('Aggregated AI call failed:', error);
      throw error;
    }
  }

  async extractJobSearchParams(query: string): Promise<JobSearchParams> {
    const messages = [
      {
        role: 'system',
        content: 'You are a job search assistant. Extract search parameters from user query.',
      },
      {
        role: 'user',
        content: query,
      },
    ];

    try {
      return await this.callAI(messages, jobSearchJsonSchema.definitions!.jobSearch);
    } catch (error) {
      return {};
    }
  }

  async parseResumeText(text: string): Promise<CandidateProfile> {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert resume parser. Extract candidate details from text.',
      },
      {
        role: 'user',
        content: text,
      },
    ];

    return await this.callAI(messages, profileJsonSchema.definitions!.candidateProfile);
  }

  async calculateMatchScore(jobDescription: string, profile: CandidateProfile): Promise<{ score: number; feedback: string }> {
    const messages = [
      {
        role: 'system',
        content: 'You are an AI recruitment specialist. Provide match score (0-100) and feedback.',
      },
      {
        role: 'user',
        content: `Job Description: ${jobDescription}\n\nCandidate Profile: ${JSON.stringify(profile)}`,
      },
    ];

    return await this.callAI(messages, {
      type: 'object',
      properties: {
        score: { type: 'number' },
        feedback: { type: 'string' },
      },
      required: ['score', 'feedback'],
    });
  }

  async generateCoverLetter(profile: CandidateProfile, jobDescription: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional cover letter writer. Write a concise, impactful cover letter.',
      },
      {
        role: 'user',
        content: `Job Description: ${jobDescription}\n\nCandidate Profile: ${JSON.stringify(profile)}`,
      },
    ];

    return await this.callAI(messages);
  }

  async generateResponse(query: string, jobsCount: number, params: JobSearchParams): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are a professional, helpful, and slightly enthusiastic job search assistant named ApplyAI.
        Your goal is to acknowledge the user's specific request and mention that you've searched the web for relevant roles.
        Be concise but friendly. Avoid generic responses.
        If a location or experience level was mentioned, acknowledge it.`,
      },
      {
        role: 'user',
        content: `User Query: "${query}"
        Extracted Params: ${JSON.stringify(params)}
        Jobs Found: ${jobsCount}`,
      },
    ];

    return await this.callAI(messages);
  }

  async searchJobsWithAI(query: string, params: JobSearchParams): Promise<any[]> {
    const messages = [
      {
        role: 'system',
        content: `You are a real-time job search engine. Based on the user query and extracted parameters, generate 4-6 highly realistic, current job listings.
        Each job should feel like a real posting from a company like Google, Zomato, Swiggy, or a hot startup.
        Ensure the locations, titles, and requirements match the user's intent.

        CRITICAL: Return ONLY a JSON array of objects. Do not include any text outside the JSON.`,
      },
      {
        role: 'user',
        content: `Query: "${query}"
        Parameters: ${JSON.stringify(params)}`,
      },
    ];

    const jobSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: 'string' },
          description: { type: 'string' },
          salaryMin: { type: 'number' },
          salaryMax: { type: 'number' },
          skills: { type: 'array', items: { type: 'string' } },
          workMode: { type: 'string', enum: ['remote', 'hybrid', 'onsite'] },
          experienceMin: { type: 'number' },
        },
        required: ['title', 'company', 'location', 'description', 'skills', 'workMode'],
      },
    };

    try {
      const results = await this.callAI(messages, jobSchema);
      // Map to full Job interface defaults
      return results.map((job: any, index: number) => ({
        id: `ai-job-${Date.now()}-${index}`,
        source: 'AI-Search',
        sourceJobId: `ai-${index}`,
        title: job.title,
        company: job.company,
        companyLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company)}`,
        description: job.description,
        location: job.location,
        country: 'India',
        city: job.location.split(',')[0].trim(),
        workMode: job.workMode || 'remote',
        employmentType: 'Full-time',
        experienceMin: job.experienceMin || params.experienceMin || 2,
        experienceMax: (job.experienceMin || params.experienceMin || 2) + 3,
        salaryMin: job.salaryMin || params.salaryMin || 12,
        salaryMax: job.salaryMax || (job.salaryMin || params.salaryMin || 12) + 8,
        salaryCurrency: 'INR',
        skills: job.skills,
        postedAt: new Date().toISOString(),
        applicationUrl: 'https://example.com/apply',
        applicationMethod: 'url',
        sourceUrl: 'https://example.com/job',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('AI Job Search failed:', error);
      return [];
    }
  }
}
