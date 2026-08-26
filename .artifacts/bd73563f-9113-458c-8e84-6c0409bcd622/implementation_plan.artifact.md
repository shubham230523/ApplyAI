# Implementation Plan: Authentication & Profile Completion Flow

Add user authentication using Supabase and implement a conditional profile completion flow.

## Proposed Changes

### [Backend] Authentication Integration

#### [MODIFY] [resume.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/resumes/resume.routes.ts)
- Add `authenticate` middleware to `/upload`.
- Use `request.user.sub` as the `userId`.

#### [MODIFY] [profile.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/profiles/profile.routes.ts)
- Ensure all routes use `request.user.sub`.

---

### [Client] Authentication UI & Redirection

#### [MODIFY] [_layout.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/_layout.tsx)
- Enable the authentication redirection logic.
- Redirect to `/login` if no session is found.

#### [MODIFY] [login.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/(auth)/login.tsx)
- Redesign using NativeWind and modern styling.
- Add "Sign in with Google" button.
- Integrate with `supabase.auth.signInWithOAuth`.

#### [MODIFY] [register.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/(auth)/register.tsx)
- Redesign for consistency with Login.

---

### [Client] Conditional Profile Completion Flow

#### [MODIFY] [index.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/(tabs)/index.tsx) (Assistant)
- Check profile status on load.
- If profile is missing, show `ResumeUploadModal`.
- Allow the user to "Skip" the modal.

#### [MODIFY] [resume-upload-modal.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/components/resume-upload-modal.tsx)
- Add a "Skip for now" button.
- Support a `forceMode` prop that hides the Skip/Close buttons when profile completion is mandatory.

#### [MODIFY] [[id].tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/job/[id].tsx) (Job Details)
- When "Apply Now" is clicked:
    - Check if the user has a profile.
    - If missing, trigger the `ResumeUploadModal` in `forceMode`.
    - Prevent application until profile is completed.

---

## Verification Plan

### Automated Tests
- Verify `npm run build` succeeds for both client and backend.

### Manual Verification
1. Open the app; verify redirection to Login.
2. Sign up with email/password.
3. Verify `ResumeUploadModal` appears on the Assistant screen. Click "Skip".
4. Navigate to a Job Detail screen and click "Apply Now".
5. Verify `ResumeUploadModal` appears and cannot be skipped.
6. Upload a resume and complete the form.
7. Verify the "Apply" action now succeeds (opens the URL).
