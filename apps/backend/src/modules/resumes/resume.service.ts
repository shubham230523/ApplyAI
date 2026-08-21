import { AIService } from '../ai/ai.service.js';
import { CandidateProfile } from '@applyai/shared-types';
import { db } from '../../db/index.js';
import { resumes, profiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

const aiService = new AIService();

export class ResumeService {
  async parseResume(fileBuffer: Buffer, userId: string, fileName: string): Promise<CandidateProfile> {
    // 1. Extract text from PDF using pdfjs-dist directly
    const data = new Uint8Array(fileBuffer);
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }

    // 2. Use AI to structure the resume data
    const structuredData = await aiService.parseResumeText(fullText);

    // 3. Save to database
    await this.saveResumeAndProfile(userId, fileName, fullText, structuredData);

    return structuredData;
  }

  private async saveResumeAndProfile(
    userId: string,
    fileName: string,
    rawText: string,
    profileData: CandidateProfile
  ) {
    // Save Resume entry
    await db.insert(resumes).values({
      userId,
      fileName,
      fileUrl: 'local://' + fileName,
      contentType: 'application/pdf',
      parsedContent: profileData as any,
      isMain: true,
    });

    // Reset other main resumes for this user
    await db.update(resumes)
      .set({ isMain: false })
      .where(eq(resumes.userId, userId));

    // Update Profile
    await db.insert(profiles).values({
      userId,
      name: profileData.name,
      phone: profileData.phone,
      headline: profileData.headline,
      yearsExperience: profileData.yearsExperience,
      skills: profileData.skills,
      preferredLocations: profileData.preferredLocations,
      preferredSalary: profileData.preferredSalary,
      noticePeriod: profileData.noticePeriod,
    }).onConflictDoUpdate({
      target: profiles.userId,
      set: {
        name: profileData.name,
        phone: profileData.phone,
        headline: profileData.headline,
        yearsExperience: profileData.yearsExperience,
        skills: profileData.skills,
        updatedAt: new Date(),
      }
    });
  }

  async calculateMatch(jobDescription: string, profile: CandidateProfile): Promise<{ score: number; feedback: string }> {
    return aiService.calculateMatchScore(jobDescription, profile);
  }
}
