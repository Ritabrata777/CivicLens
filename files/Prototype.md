# 🚀 Prototype Overview

## Scope
The current prototype demonstrates the core "Report-Verify-Resolve" loop of Civic Lens.

## Functional Modules

### 1. Citizen Portal
- **Login/Signup:** Basic authentication (potentially integrated with Voter Verification).
- **Issue Reporting:**
    - Image Upload.
    - Auto-location tagging.
    - Category selection.

### 2. Admin Dashboard
- **Issue Feed:** List of reported issues with AI-suggested "Duplication" tags.
- **Action Center:**
    - **Accept/Reject:** Triggers blockchain log.
    - **Resolve:** Requires uploading "After" photo evidence.

### 3. AI Services (Background)
- **Duplicate Checker:** Runs periodically or on-submission to flag similar reports.
- **Traffic Watch:** Automates penalty generation for traffic rule violations from uploaded photos.

## Key Flows to Demo
1.  **Reporting an Issue:** User uploads a photo of a pothole -> System checks for duplicates -> Issue created.
2.  **Admin Resolution:** Admin views issue -> Assigns crew -> Uploads fix photo -> Issue marked resolved -> Blockchain updated.
3.  **Traffic Violation:** User uploads photo of rider without helmet -> AI detects "No Helmet" -> Extracts Plate Number -> Logs violation.
