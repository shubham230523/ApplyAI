# Implementation Plan: Recruiter Applicant Management

This plan outlines the steps to allow recruiters to view applicants for their jobs and drill down into specific application details.

## Proposed Changes

### Backend (Node.js/Fastify)

#### [MODIFY] [application.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/modules/applications/application.service.ts)
- Add `getApplicationsByJob(jobId: string, recruiterId: string)`: Retrieves a list of applications for a specific job, ensuring the job belongs to the recruiter. Joins with `profiles` to get candidate names.
- Add `getRecruiterApplicationDetail(applicationId: string, recruiterId: string)`: Retrieves full details of an application, including the AI cover letter and the candidate's parsed resume content.

#### [MODIFY] [application.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/backend/src/modules/applications/application.routes.ts)
- Add `GET /job/:jobId`: Endpoint for recruiters to fetch applicants for a job.
- Add `GET /recruiter-detail/:id`: Endpoint for recruiters to fetch full application details.
- Integrate with `profile.service` to verify recruiter identity.

### Frontend (React Native/Expo Router)

#### [MODIFY] [workspace.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/workspace.tsx)
- Update the job card `onPress` to navigate to `/(recruiter)/job-applications/[jobId]`.
- (Optional) Update the "Total Applicants" statistic to reflect actual data if possible.

#### [NEW] [job-applications/[id].tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/job-applications/[id].tsx)
- New screen to display a list of all candidates who applied for a specific job.
- Each entry will show candidate name, application date, and a link to view details.

#### [NEW] [application-detail/[id].tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/application-detail/[id].tsx)
- New screen to show the full application for a recruiter.
- Displays the AI-generated cover letter and the candidate's resume/profile details.

#### [MODIFY] [_layout.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/_layout.tsx)
- Register the new routes in the Recruiter stack.

## Verification Plan

### Automated Tests
- No new automated tests planned; manual verification will be used.

### Manual Verification
- Log in as a recruiter.
- Navigate to the Workspace.
- Click on a job that has applicants (need to apply as a candidate first).
- Verify the list of applicants is displayed correctly.
- Click on an applicant and verify the detail screen shows the cover letter and resume info.
