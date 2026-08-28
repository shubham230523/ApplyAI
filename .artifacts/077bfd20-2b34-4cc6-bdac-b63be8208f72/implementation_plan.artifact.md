# Implementation Plan - Fix Gemini SDK Integration

The `AIService` is currently using an outdated or incorrect pattern for the `@google/genai` SDK, resulting in a `TypeError: this.client.getGenerativeModel is not a function`. The project is using version `^2.18.0` of `@google/genai`, which has a different API structure than the legacy `@google/generative-ai` SDK.

## Proposed Changes

### [Backend AI Module]

#### [MODIFY] [ai.service.ts](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI%20-1/apps/backend/src/modules/ai/ai.service.ts)

- Update `AIService.callAI` to use the new SDK pattern: `this.client.models.generateContent`.
- Update response handling to access `response.text` directly.
- Use `gemini-2.0-flash` as the default model (or the version recommended by the user's pattern).
- Ensure multimodal data is passed correctly in the new `contents` format.

## Verification Plan

### Automated Tests
- I will attempt to run the existing parsing logic if possible, or verify by inspecting the code for compatibility with the `@google/genai` v2+ specification.

### Manual Verification
- The user can verify by uploading a resume in the client app and checking if the parsing error disappears in the backend logs.
