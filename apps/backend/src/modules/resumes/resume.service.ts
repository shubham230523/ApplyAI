import { CandidateProfile, WorkExperience } from '@applyai/shared-types';
import { db } from '../../db/index.js';
import { resumes, profiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { supabase } from '../../lib/supabase.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { randomUUID } from 'crypto';
import { AIService } from '../ai/ai.service.js';

const aiService = new AIService();

export class ResumeService {
  /**
   * Uploads resume to Supabase Storage and parses it for key fields.
   */
  async uploadAndParse(fileBuffer: Buffer, userId: string, fileName: string): Promise<any> {
    const fileId = randomUUID();
    const storagePath = `${userId}/${fileId}-${fileName}`;

    // 1. Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (storageError) {
      console.error('Supabase Storage Error:', storageError);

      // If bucket doesn't exist, try creating it and retrying once
      if ((storageError as any).code === 'NoSuchBucket' || storageError.message?.includes('not found')) {
        console.log('Attempting to create "resumes" bucket...');
        try {
          await supabase.storage.createBucket('resumes', { public: true });
          // Retry upload
          const { data: retryData, error: retryError } = await supabase.storage
            .from('resumes')
            .upload(storagePath, fileBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });
          if (retryError) throw retryError;
        } catch (e) {
          console.error('Failed to create bucket or retry upload:', e);
          throw new Error('Failed to upload resume: Storage bucket not configured.');
        }
      } else {
        throw new Error('Failed to upload resume to storage');
      }
    }

    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(storagePath);

    // 2. Extract Text using pdf-parse
    const pdfData = await pdf(fileBuffer);
    const rawText = pdfData.text;

    // 3. AI-Powered Extraction (Optimized)
    let extractedData: Partial<CandidateProfile>;
    try {
      extractedData = await aiService.parseResumeText(rawText);
    } catch (e) {
      console.warn('AI Parsing failed, falling back to heuristics');
      extractedData = this.heuristicExtract(rawText);
    }

    // 4. Save to Database
    await this.saveResumeMetadata(userId, fileName, publicUrl, extractedData);

    return {
      ...extractedData,
      resumeUrl: publicUrl,
    };
  }

  private heuristicExtract(text: string): Partial<CandidateProfile> {
    const q = text.toLowerCase();
    const data: any = {
      skills: [],
      education: [],
    };

    // Email Regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) data.email = emailMatch[0];

    // Phone Regex (Simple)
    const phoneMatch = text.match(/(\+?\d{1,3}[- ]?)?\d{10}/);
    if (phoneMatch) data.phone = phoneMatch[0];

    // Experience (heuristic: "X+ years", "X years of experience")
    const expMatch = q.match(/(\d+)\+?\s*years?\s*(of\s*)?exp/i);
    if (expMatch) data.yearsExperience = parseInt(expMatch[1]);
    else {
      // Fallback for just "X years"
      const simpleExpMatch = q.match(/(\d+)\s*years/i);
      if (simpleExpMatch) data.yearsExperience = parseInt(simpleExpMatch[1]);
    }

    // Skills (Matching against a common list)
    const skillList = ['react', 'node', 'kotlin', 'java', 'swift', 'flutter', 'python', 'aws', 'sql', 'typescript', 'javascript', 'android', 'ios', 'docker', 'kubernetes', 'figma'];
    skillList.forEach(skill => {
      if (q.includes(skill)) data.skills.push(skill.toUpperCase());
    });

    // Education (Keywords)
    const eduList = ['b.tech', 'b.e.', 'm.tech', 'ms', 'bca', 'mca', 'bachelor', 'master', 'computer science'];
    eduList.forEach(edu => {
      if (q.includes(edu)) data.education.push(edu.toUpperCase());
    });

    // Name (Very rough heuristic: usually at the top)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      data.name = lines[0].trim().substring(0, 50);
    }

    return data;
  }

  private async saveResumeMetadata(
    userId: string,
    fileName: string,
    fileUrl: string,
    extractedData: any
  ) {
    if (!db) return;

    // 1. Reset other main resumes for this user
    await db.update(resumes)
      .set({ isMain: false, updatedAt: new Date() })
      .where(eq(resumes.userId, userId));

    // 2. Insert the new resume as the main one
    await db.insert(resumes).values({
      userId,
      fileName,
      fileUrl,
      contentType: 'application/pdf',
      parsedContent: extractedData,
      isMain: true,
    });
  }
}
