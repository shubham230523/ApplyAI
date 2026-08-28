# Fix Workspace Issues: Redirect Loop, Routing Warning, and Scrolling

This plan addresses three issues identified in the Recruiter Workspace:
1.  **Infinite Redirect/Refresh Loop**: Caused by `AuthProvider` toggling `loading` state during role verification and flipping between metadata and DB roles.
2.  **Routing Warning**: `No route named "index" exists` in the `(recruiter)` group.
3.  **Scrolling/Cropping**: Content in the Workspace screen is cut off at the bottom on some viewport sizes.

## Proposed Changes

### Auth & Navigation

#### [MODIFY] [auth.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/contexts/auth.tsx)
- Decouple `verifying` from the global `loading` state used for full-screen blocking. This prevents the "empty page" flicker during background role verification.
- Only update the role from metadata if a verified role hasn't been fetched yet in the current session.

#### [MODIFY] [workspace.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/workspace.tsx)
- Fix scrollability by ensuring `ScrollView` content container has `flexGrow: 1`.
- Adjust layout to be more resilient to different viewport heights.
- Use a standard `View` instead of `SafeAreaView` inside the screen for better Web flex behavior, while maintaining safe area handling if needed (though the screen already has a header).

#### [MODIFY] [_layout.tsx](file:///C:/Users/shubham/Documents/ReactNative/ApplyAI-2/apps/client/src/app/(recruiter)/_layout.tsx)
- Remove the non-existent `index` screen definition to clear the routing warning.

## Verification Plan

### Manual Verification
- Log in as a recruiter and verify the redirect to `/workspace` is stable and doesn't flicker.
- Check the console for the "No route named index" warning (it should be gone).
- Resize the browser window to a small height and verify that the Workspace screen is scrollable and no content is cropped.
