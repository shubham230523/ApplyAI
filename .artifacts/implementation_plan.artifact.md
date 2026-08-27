# Applied Jobs Screen Enhancement

Improve the "Applied Jobs" experience by adding detailed tracking and better UI/UX.

## User Review Required

> [!NOTE]
> The "Applications" list will now show company logos and support navigation to a detailed view of the application, including the AI-generated cover letter.

## Proposed Changes

### [Shared Types]

#### [MODIFY] [index.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/packages/shared-types/src/index.ts)
- Add `Application` and `ApplicationDetail` interfaces.

---

### [Backend]

#### [MODIFY] [application.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/applications/application.service.ts)
- Add `getApplicationById(userId, applicationId)` method.

#### [MODIFY] [application.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/applications/application.routes.ts)
- Add `GET /:id` endpoint.
- Ensure authentication middleware is used for all application routes.

---

### [Client]

#### [MODIFY] [applications.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/(tabs)/applications.tsx)
- Use `EXPO_PUBLIC_API_URL`.
- Update mapping to use `companyName`.
- Add navigation to application details.
- Add company logos to list items.

#### [NEW] [applications/[id].tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/applications/[id].tsx)
- Detailed view of a specific application.
- Display job info and AI-generated cover letter.

## Verification Plan

### Manual Verification
- Apply to a job and verify it appears in the list.
- Navigate to details and verify the AI content is displayed.
- Check refresh functionality on the list.
