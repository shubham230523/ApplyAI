# Production-Ready AI Resume Parser Pipeline

Implement a robust, production-grade resume parsing pipeline that handles multiple file formats (PDF, DOCX, Images) using a multimodal AI approach (Google Gemini) and layout-aware processing.

## User Review Required

> [!IMPORTANT]
> **AI Choice**: The current implementation uses Gemini 1.5 Flash. For production-grade layout parsing, Gemini 1.5 Pro is recommended for its superior multimodal understanding of complex resume layouts. I will proceed with Flash but provide a configuration toggle.

> [!WARNING]
> **Dependencies**: We need to add `mammoth` for DOCX parsing and `sharp` or `canvas` if we need local image preprocessing, though Gemini handles raw images well.

## Proposed Changes

### Backend Enhancements

#### [MODIFY] [resume.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI%20-1/apps/backend/src/modules/resumes/resume.service.ts)
- Update `uploadAndParse` to handle different MIME types (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`).
- Implement format-specific extraction logic:
  - **PDF**: Use `pdf-parse` as a fallback, but prioritize sending the PDF directly to Gemini for layout-aware parsing.
  - **DOCX**: Use `mammoth` to extract clean text/markdown.
  - **Images**: Send bytes directly to Gemini Multimodal.
- Improve error handling for corrupted files and size limits.

#### [MODIFY] [ai.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI%20-1/apps/backend/src/modules/ai/ai.service.ts)
- Add `parseResumeMultimodal` method to handle file buffers directly (Images/PDFs).
- Refine the `ResumeSchema` to include missing fields like `certifications`, `projects`, and `summary`.
- Improve prompt engineering to handle multi-column layouts and non-standard sections.

#### [MODIFY] [resume.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI%20-1/apps/backend/src/modules/resumes/resume.routes.ts)
- Update validation to allow `docx` and image formats.
- Add size limits (e.g., 5MB).

### Shared Types

#### [MODIFY] [types.ts] (in shared package)
- Ensure `CandidateProfile` and `WorkExperience` types are comprehensive enough for production needs.

## Fault Tolerance & Edge Cases

1.  **Layout Complexity**: Multi-column resumes often fail with simple text extractors. We will use Gemini's vision capabilities for these.
2.  **File Corruption**: Add `try-catch` blocks around all parsing libraries.
3.  **AI Timeouts**: Implement a timeout and fallback to a lighter model or heuristic parsing.
4.  **Empty/Invalid Files**: Detect files with no text content (e.g., blank images) early.
5.  **Large Files**: Enforce a 5MB limit to prevent memory issues and AI token limit exhaustion.

## Verification Plan

### Automated Tests
- Unit tests for `ResumeService` with sample PDF, DOCX, and PNG files.
- Mock AI responses to verify schema validation.

### Manual Verification
- Upload a 2-column PDF resume.
- Upload a photo of a resume taken from a phone.
- Upload a DOCX resume with tables.
- Verify all data is correctly populated in the Supabase database.
