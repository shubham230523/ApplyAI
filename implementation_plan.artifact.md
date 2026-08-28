# AI-Powered Cover Letter Implementation Plan

This plan outlines the steps to implement an AI-generated cover letter feature in the `JobDetailsScreen`. It will allow users to generate a tailored cover letter using AI, edit it, and submit it during the application process.

## Proposed Changes

### [Backend] API Enhancements

#### [MODIFY] [jobs.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/jobs/jobs.routes.ts)
- Add a new `GET /:id/cover-letter` endpoint.
- This endpoint will:
    - Authenticate the user.
    - Fetch the job details and user profile/resume.
    - Use `AIService.generateCoverLetter` to create the text.
    - Return the generated cover letter.

#### [MODIFY] [application.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/applications/application.service.ts)
- Update `applyToJob(userId, jobId, coverLetter?)` to accept an optional `coverLetter` parameter.
- If `coverLetter` is provided, use it for the `aiCoverLetter` field in the database.
- If not provided, fallback to the current behavior (auto-generate).

#### [MODIFY] [application.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/applications/application.routes.ts)
- Update `POST /apply` to extract `coverLetter` from the request body and pass it to the service.

---

### [Frontend] Job Details UI Updates

#### [MODIFY] [job/[id].tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/job/[id].tsx)
- Add `coverLetter` state (string).
- Add `generatingCoverLetter` state (boolean).
- Implement `handleGenerateCoverLetter` function:
    - Calls `GET /api/jobs/${id}/cover-letter`.
    - Updates `coverLetter` state with the result.
- Update UI to include:
    - A "Cover Letter" section before the Apply button.
    - A `TextInput` (multiline) bound to the `coverLetter` state.
    - A "✨ Use AI to generate" button/action.
- Update `handleApply` to pass the `coverLetter` to the backend.

## Verification Plan

### Automated Tests
- Test the new backend endpoint `GET /api/jobs/:id/cover-letter` using a REST client (e.g., Postman or Insomnia).
- Verify that `POST /api/applications/apply` correctly saves the provided cover letter.

### Manual Verification
- Open a job in the app.
- Click "Use AI to generate" and verify the text box is populated.
- Edit the generated text.
- Click "Apply Now".
- Check the "Applications" tab and verify the application details show the edited cover letter.
