# Implementation Plan: ApplyAI Phase 1 MVP - Compelling AI Chat & Job Search

This plan aims to create a "ChatGPT-like" experience for job hunting. The user will be able to search for jobs using natural language, and the AI will respond with a friendly message and a set of compelling job cards.

## User Review Required

> [!IMPORTANT]
> For this Phase 1 MVP, we will use the AI (OpenRouter) to simulate "searching the web" by generating realistic job data based on the user's query. This ensures the experience is compelling without needing complex integrations with external job board APIs yet.

## Proposed Changes

### Backend: AI & Orchestration
Enhance the backend to provide more dynamic and AI-driven job results.

#### [MODIFY] [ai.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/ai/ai.service.ts)
- Add `searchJobsWithAI(query: string)` to generate a list of jobs matching the user's intent.
- Refine `generateResponse` for a more "compelling" assistant personality.

#### [MODIFY] [orchestrator.routes.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/backend/src/modules/orchestrator/orchestrator.routes.ts)
- Update the `/query` endpoint to integrate the new AI-driven job generation.

---

### Client: Modern Chat UI
Transform the current basic chat interface into a modern, polished assistant.

#### [MODIFY] [index.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/app/(tabs)/index.tsx)
- Redesign message bubbles for a cleaner look.
- Add a "Typing..." indicator for the bot.
- Implement "Quick Actions" or suggested queries at the start.
- Use `NativeWind` for better styling consistency.

#### [MODIFY] [job-card.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI/apps/client/src/components/job-card.tsx)
- Enhance the job card UI with better spacing, icons, and a "Modern" feel.

---

## Verification Plan

### Automated Tests
- N/A for this UI-heavy MVP phase.

### Manual Verification
- Start backend: `npm run dev` in `apps/backend`.
- Start client: `npm run web` in `apps/client`.
- Input query: "Find me Android developer roles in Bangalore with 3 years experience".
- **Checklist**:
  - [ ] Does the AI acknowledge the specific location and experience?
  - [ ] Are the generated job cards relevant to Bangalore and Android?
  - [ ] Does the UI feel fluid and "compelling" (typing indicators, clean bubbles)?
  - [ ] Can I select jobs and see the "Bulk Apply" button?
