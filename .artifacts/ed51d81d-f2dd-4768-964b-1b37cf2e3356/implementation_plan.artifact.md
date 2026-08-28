# Implementation Plan: AI Candidate Ranking

This plan introduces AI-powered candidate ranking. Every application will be scored against the job description using Gemini, allowing recruiters to see the most relevant candidates at the top of their list.

## Proposed Changes

### Backend (Node.js/Fastify)

#### [MODIFY] [schema.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/db/schema.ts)
- Add `matchScore: integer('match_score').default(0)` to the `applications` table.

#### [MODIFY] [db/index.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/db/index.ts)
- Update `verifySchema` to add the `match_score` column if it's missing in the existing database.

#### [MODIFY] [ai.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/modules/ai/ai.service.ts)
- Implement `calculateMatchScore(jd: string, profile: CandidateProfile)`:
    - Uses Gemini 3.5 Flash Lite to compare the Job Description and Candidate Profile.
    - Returns a JSON object: `{ "score": number (0-100), "reasoning": string }`.

#### [MODIFY] [application.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/modules/applications/application.service.ts)
- Update `applyToJob`:
    - Call `aiService.calculateMatchScore` during the application process.
    - Save the resulting score into the `match_score` database column.
- Update `getApplicationsByJob`:
    - Include `matchScore` in the selection.
    - Add `.orderBy(desc(applications.matchScore))` to ensure the best matches appear first.

### Frontend (React Native/Expo Router)

#### [MODIFY] [job-applications/[id].tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/job-applications/[id].tsx)
- Update the UI to display the AI Ranking:
    - Display "RANK #1", "RANK #2", etc., based on the sorted list index.
    - Show the Match Percentage (e.g., "95% Match") with a visual indicator (e.g., emerald green for high scores).
    - Add a "Neural Sort Active" badge to indicate AI is driving the order.

## Verification Plan

### Manual Verification
1. **Apply as Candidate**: Apply to a job with a highly relevant resume.
2. **Apply as Another Candidate**: Apply to the same job with a less relevant resume.
3. **Check Recruiter List**: Navigate to the job's application list as a recruiter.
4. **Verify Sorting**: Confirm the highly relevant candidate is "Rank #1" with a higher percentage.
5. **Verify Display**: Check that the rank numbers and percentages are clearly visible and styled.
