# AI-Powered Job Recommendations Plan

This plan outlines the implementation of a job recommendation system that suggests matching jobs to users based on their profile data, specifically when they haven't yet performed any manual searches via the chat interface.

## User Review Required

> [!IMPORTANT]
> This implementation introduces a new `user_searches` table to track user interaction history. This is necessary to determine if a user has "searched for any new jobs via chat interface."

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/db/schema.ts)
- Add `user_searches` table to track when a user performs a search.
- Fields: `id`, `userId`, `query`, `createdAt`.

---

### AI Module

#### [MODIFY] [ai.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/ai/ai.service.ts)
- Add `generateSearchParametersFromProfile(profile: CandidateProfile)`: Uses AI to convert a user's skills and experience into `JobSearchParams`.
- Add `rankJobs(jobs: Job[], profile: CandidateProfile)`: (Optional refinement) Ranks a list of jobs based on the match score.

---

### Jobs Module

#### [MODIFY] [jobs.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/jobs/jobs.service.ts)
- Add `getRecommendations(userId: string)`:
    - Checks `user_searches` table for any history.
    - If no history, fetches user profile/resume.
    - Fetches already applied jobs to exclude them.
    - Constructs a search query using AI based on the profile.
    - Executes the search against the `jobs` table.
    - Returns the top matches.

---

### Orchestrator Module

#### [MODIFY] [orchestrator.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/orchestrator/orchestrator.routes.ts)
- Update `/query` endpoint to record searches in the `user_searches` table.
- Add `GET /recommendations` endpoint that calls `JobsService.getRecommendations`.

---

## Verification Plan

### Automated Tests
- Unit test for `generateSearchParametersFromProfile` to ensure it extracts meaningful parameters from a mock profile.
- Integration test for `getRecommendations` to verify it excludes applied jobs and correctly checks the search history.

### Manual Verification
- **Scenario 1**: New user with a profile but no chat history. Verify that `GET /recommendations` returns matching jobs.
- **Scenario 2**: User who has searched in chat. Verify that `GET /recommendations` (or the logic that triggers it) behaves as expected (e.g., returns empty or follows a different path).
- **Scenario 3**: Ensure already applied jobs do not appear in the recommendations list.
