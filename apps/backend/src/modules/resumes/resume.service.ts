import { CandidateProfile, WorkExperience } from '@applyai/shared-types';
import { db } from '../../db/index.js';
import { resumes, profiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { supabase } from '../../lib/supabase.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
import { randomUUID } from 'crypto';
import { AIService } from '../ai/ai.service.js';

const aiService = new AIService();

export class ResumeService {
  /**
   * Uploads resume to Supabase Storage and parses it for key fields.
   */
  async uploadAndParse(fileBuffer: Buffer, userId: string, fileName: string, mimeType: string): Promise<any> {
    const fileId = randomUUID();
    const storagePath = `${userId}/${fileId}-${fileName}`;

    // 1. Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (storageError) {
      console.error('Supabase Storage Error:', storageError);
      throw new Error('Failed to upload resume to storage');
    }

    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(storagePath);

    // 2. AI-Powered Extraction
    let extractedData: Partial<CandidateProfile>;
    try {
      if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
        // Use multimodal for PDF and Images (layout aware)
        extractedData = await aiService.parseResumeMultimodal(fileBuffer, mimeType);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Use mammoth for DOCX extraction
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedData = await aiService.parseResumeText(docxResult.value);
      } else {
        // Fallback for plain text or unknown
        const text = fileBuffer.toString('utf-8');
        extractedData = await aiService.parseResumeText(text);
      }
    } catch (e) {
      console.warn('AI Parsing failed, falling back to heuristics', e);
      // Fallback text extraction for heuristics
      let fallbackText = '';
      if (mimeType === 'application/pdf') {
        const pdfData = await pdf(fileBuffer);
        fallbackText = pdfData.text;
      } else {
        fallbackText = fileBuffer.toString('utf-8');
      }
      extractedData = this.heuristicExtract(fallbackText);
    }

    // 3. Save to Database
    await this.saveResumeMetadata(userId, fileName, publicUrl, extractedData, mimeType);

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
    extractedData: any,
    contentType: string = 'application/pdf'
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
      contentType,
      parsedContent: extractedData,
      isMain: true,
    });
  }
}
