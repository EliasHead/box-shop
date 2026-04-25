# Feature Spec: Logout Button

## Goal
Implement a functional logout mechanism for the Admin Dashboard and Tenant Storefront (if applicable). Currently, the UI has placeholders for a logout button, but they are non-functional.

## Requirements
- **REQ-1**: Clicking the logout button must terminate the user session.
- **REQ-2**: After logout, the user must be redirected to the landing page or login page.
- **REQ-3**: The logout mechanism should work in both desktop sidebar and mobile navigation drawer.
- **REQ-4**: Use Auth.js v5 `signOut` function.

## Technical Details
- **Location**: `src/app/app/layout.tsx` (Admin Dashboard)
- **Implementation Strategy**: Use a Server Action to trigger `signOut` from a form submission to avoid requiring a Client Component just for the button.

## User Review Required
> [!IMPORTANT]
> Should the user be redirected to the landing page (`/`) or the login page (`/login`) after logging out?
> Standard behavior for SaaS is often the landing page.

## Open Questions
- Is there any specific "Logout successful" notification required? (shadcn/ui toast)
- Do we need a logout confirmation dialog?
