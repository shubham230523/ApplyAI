# Implementation Plan: Resume Access and AI JD Generation

This plan outlines the changes to allow recruiters to view candidate resumes and use AI to generate job descriptions.

## Proposed Changes

### Backend (Node.js/Fastify)

#### [MODIFY] [application.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/modules/applications/application.service.ts)
- Update `getRecruiterApplicationDetail` to include the `fileUrl` from the joined `resumes` table. This provides the recruiter with a direct link to the candidate's uploaded resume.

#### [MODIFY] [ai.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/modules/ai/ai.service.ts)
- Add `generateJobDescription(params: any)`: A new method that uses Gemini to draft a professional job description based on the title, company, location, and employment details provided in the form.

#### [MODIFY] [jobs.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/modules/jobs/jobs.routes.ts)
- Add `POST /generate-jd`: A new authenticated endpoint that calls the `AIService` to generate a JD draft.

### Frontend (React Native/Expo Router)

#### [MODIFY] [application-detail/[id].tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/application-detail/[id].tsx)
- Add a "View Full Resume (PDF)" button in the candidate profile section.
- Use `Linking` or a web browser to open the resume URL.

#### [MODIFY] [create-job.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/create-job.tsx)
- Add a "✨ Draft with AI" button above the Job Description text field.
- Implement the logic to send current form data to the new backend endpoint and update the `description` field with the result.
- Show a loading state while the AI is thinking.

## Verification Plan

### Manual Verification
1. **Resume Link**: Log in as a recruiter, open an application, and click the "View Full Resume" button. Verify it opens the correct PDF in a new tab or browser.
2. **AI JD Generation**: Open the "Post New Job" screen. Fill in "Senior React Developer" at "Google". Click "Draft with AI". Verify that a professional job description is generated and filled into the text area.
