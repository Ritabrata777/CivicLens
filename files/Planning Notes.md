# 📝 Planning Notes

## Current Status
- **Core Platform:** Functional User and Admin dashboards.
- **AI Integration:** 
    - Duplicate detection is implemented.
    - Traffic violation detection (Helmet/License Plate) is in active development (`detect_traffic_violation.py`).
- **Blockchain:** Smart contracts exist, integration logic is present in server actions.

## Short-Term Goals
1.  **Refine Traffic Violation AI:**
    - Improve helmet detection accuracy.
    - Optimize license plate OCR formatting (Indian standard).
2.  **Admin Dashboard:**
    - Finalize "Proof of Fix" workflow (Before/After photos).
    - Ensure blockchain transactions are correctly logged for all admin actions.
3.  **Testing:**
    - Run end-to-end tests for the voter verification flow.
    - Validate duplicate detection with larger datasets.

## Long-Term Roadmap
- **Mobile App:** Develop a React Native mobile app for easier citizen reporting.
- **Geospatial Analytics:** implementations of heatmaps for issue clusters.
- **Decentralized Storage:** Move image storage to IPFS/Arweave for full decentralization.
