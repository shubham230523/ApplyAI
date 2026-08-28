import { CandidateProfile, WorkExperience } from '@applyai/shared-types';
import { db } from '../../db/index.js';
import { resumes, profiles } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { supabase } from '../../lib/supabase.js';
import { createRequire } from 'module';
import { randomUUID } from 'crypto';
import { AIService } from '../ai/ai.service.js';
import { jobs } from '../../db/schema.js';

const require = createRequire(import.meta.url);

export class ResumeService {
  /**
   * Uploads resume to Supabase Storage and parses it for key fields.
   */
  async uploadAndParse(fileBuffer: Buffer, userId: string, fileName: string, mimeType: string): Promise<any> {
    const { AIService } = await import('../ai/ai.service.js');
    const aiService = new AIService();
    const pdf = require('pdf-parse');
    const mammoth = require('mammoth');
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
    console.log(`[ResumeService] Starting extraction for ${fileName} (${mimeType})`);
    let extractedData: Partial<CandidateProfile>;
    try {
      if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
        console.log(`[ResumeService] Using multimodal parsing for ${mimeType}`);

        // Log raw text as baseline for comparison
        if (mimeType === 'application/pdf') {
          try {
            const pdfData = await pdf(fileBuffer);
            console.log('--- RAW PDF TEXT START ---');
            console.log(pdfData.text);
            console.log('--- RAW PDF TEXT END ---');
          } catch (pdfError) {
            console.warn('[ResumeService] Could not extract raw PDF text for logging');
          }
        }

        extractedData = await aiService.parseResumeMultimodal(fileBuffer, mimeType);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('[ResumeService] Using DOCX parsing');
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        console.log('--- RAW DOCX TEXT START ---');
        console.log(docxResult.value);
        console.log('--- RAW DOCX TEXT END ---');
        extractedData = await aiService.parseResumeText(docxResult.value);
      } else {
        console.log('[ResumeService] Using plain text parsing');
        const text = fileBuffer.toString('utf-8');
        console.log('--- RAW TEXT START ---');
        console.log(text);
        console.log('--- RAW TEXT END ---');
        extractedData = await aiService.parseResumeText(text);
      }

      console.log('[ResumeService] AI Extraction Successful:', JSON.stringify(extractedData, null, 2));
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
    const resumeId = await this.saveResumeMetadata(userId, fileName, publicUrl, extractedData, mimeType);

    return {
      ...extractedData,
      resumeUrl: publicUrl,
      resumeId
    };
  }

  async generatePdf(profile: CandidateProfile): Promise<Buffer> {
    const content = profile as any;
    const PDFDocument = require('pdfkit');
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- Header ---
      doc.fontSize(24).fillColor('#1e1b4b').text(content.name || 'Resume', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor('#64748b').text(`${content.email} | ${content.phone || ''}`, { align: 'center' });
      if (content.headline) {
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#4338ca').text(content.headline, { align: 'center' });
      }

      doc.moveDown(1);
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // --- Summary ---
      if (content.summary) {
        doc.fontSize(14).fillColor('#1e1b4b').text('PROFESSIONAL SUMMARY', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#334155').text(content.summary, { align: 'justify' });
        doc.moveDown(1.5);
      }

      // --- Skills ---
      if (content.skills && content.skills.length > 0) {
        doc.fontSize(14).fillColor('#1e1b4b').text('TECHNICAL SKILLS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#334155').text(content.skills.join(' • '));
        doc.moveDown(1.5);
      }

      // --- Experience ---
      if (content.workExperience && content.workExperience.length > 0) {
        doc.fontSize(14).fillColor('#1e1b4b').text('WORK EXPERIENCE', { underline: true });
        doc.moveDown(0.5);

        content.workExperience.forEach((exp: any) => {
          doc.fontSize(11).fillColor('#0f172a').text(exp.company, { continued: true }).fillColor('#64748b').text(` | ${exp.role}`);
          doc.fontSize(9).fillColor('#94a3b8').text(`${exp.startDate} - ${exp.endDate || 'Present'}`);
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor('#475569').text(exp.description);
          doc.moveDown(1);
        });
      }

      // --- Education ---
      if (content.education && content.education.length > 0) {
        doc.fontSize(14).fillColor('#1e1b4b').text('EDUCATION', { underline: true });
        doc.moveDown(0.5);
        content.education.forEach((edu: any) => {
          doc.fontSize(10).fillColor('#334155').text(edu);
        });
      }

      doc.end();
    });
  }

  async tailorResume(userId: string, jobId: string): Promise<any> {
    if (!db) throw new Error('Database not available');

    // 1. Fetch Main Resume
    const [mainResume] = await db.select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isMain, true)))
      .limit(1);

    if (!mainResume) throw new Error('Main resume not found. Please upload one first.');

    // 2. Fetch Job Details
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) throw new Error('Job not found');

    // 3. AI Tailoring
    console.log(`[ResumeService] Tailoring resume for job: ${job.title} at ${job.companyName}`);
    const { AIService } = await import('../ai/ai.service.js');
    const aiService = new AIService();
    const tailoredContent = await aiService.tailorResume(
      mainResume.parsedContent as any,
      `Title: ${job.title}\nCompany: ${job.companyName}\nDescription: ${job.description}`
    );

    // 4. Generate New PDF
    const pdfBuffer = await this.generatePdf(tailoredContent as CandidateProfile);

    // 5. Upload to Storage
    const tailoredFileName = `Tailored-${mainResume.fileName}`;
    const fileId = randomUUID();
    const storagePath = `${userId}/tailored/${fileId}-${tailoredFileName}`;

    const { error: storageError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (storageError) throw new Error('Failed to upload tailored resume');

    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(storagePath);

    // 6. Save as a new (non-main) resume
    const [saved] = await db.insert(resumes).values({
      userId,
      fileName: tailoredFileName,
      fileUrl: publicUrl,
      contentType: 'application/pdf',
      parsedContent: tailoredContent,
      isMain: false,
    }).returning();

    return {
      resumeId: saved.id,
      fileUrl: publicUrl,
      parsedContent: tailoredContent
    };
  }

  async syncResumeWithProfile(userId: string, profileData: any) {
    if (!db) return;

    // Find main resume
    const [mainResume] = await db.select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isMain, true)))
      .limit(1);

    if (!mainResume) return;

    // Merge profile data into parsedContent
    const updatedContent = {
      ...(mainResume.parsedContent as any),
      name: profileData.name || (mainResume.parsedContent as any).name,
      email: profileData.email || (mainResume.parsedContent as any).email,
      phone: profileData.phone || (mainResume.parsedContent as any).phone,
      yearsExperience: profileData.yearsExperience || (mainResume.parsedContent as any).yearsExperience,
      skills: profileData.skills || (mainResume.parsedContent as any).skills,
      education: profileData.education ? [profileData.education] : (mainResume.parsedContent as any).education,
      workExperience: profileData.workExperience || (mainResume.parsedContent as any).workExperience,
    };

    await db.update(resumes)
      .set({ parsedContent: updatedContent, updatedAt: new Date() })
      .where(eq(resumes.id, mainResume.id));

    console.log(`[ResumeService] Synced main resume for user: ${userId}`);
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
    const [saved] = await db.insert(resumes).values({
      userId,
      fileName,
      fileUrl,
      contentType,
      parsedContent: extractedData,
      isMain: true,
    }).returning();

    return saved.id;
  }
}
