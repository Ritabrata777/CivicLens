# 🎨 UI Mockups & Design Prototypes

## Design System Overview

### Color Palette
- **Primary**: Deep Blue (#3F51B5) - Trust and stability
- **Background**: Light Blue (#E8EAF6) - Calm, uncluttered atmosphere  
- **Accent**: Muted Violet (#7E57C2) - Highlights and interactions
- **Success**: Green (#4CAF50) - Positive actions
- **Warning**: Orange (#FF9800) - Attention needed
- **Error**: Red (#F44336) - Critical issues

### Typography
- **Font Family**: Inter (Grotesque sans-serif)
- **Headings**: 600 weight, varied sizes
- **Body**: 400 weight, 16px base
- **Captions**: 400 weight, 14px

### Component Library
- Card-based layouts for content organization
- Geometric icons for categories and actions
- Subtle transitions and micro-interactions
- Consistent spacing using 8px grid system

## Citizen Portal Mockups

### 1. Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🏙️ Civic Lens                    🔔 Notifications  👤 Profile │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Your Impact                    🚨 Report New Issue      │
│  ┌─────────────────┐              ┌─────────────────────┐   │
│  │ Issues Reported │              │                     │   │
│  │       12        │              │   📸 Upload Photo   │   │
│  │                 │              │                     │   │
│  │ Issues Resolved │              │   📍 Add Location   │   │
│  │        8        │              │                     │   │
│  └─────────────────┘              └─────────────────────┘   │
│                                                             │
│  📋 My Recent Issues                                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🕳️ Pothole on Main Street        ✅ Resolved  2 days ago│ │
│  │ 🗑️ Garbage Collection Delay      🔄 In Progress        │ │
│  │ 💡 Street Light Not Working      ⏳ Pending Review     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  🌍 Community Issues Near You                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Interactive Map with Issue Markers]                    │ │
│  │                                                         │ │
│  │  📍 Pothole (3 reports)    📍 Traffic Light Issue      │ │
│  │  📍 Water Leak             📍 Road Construction        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Issue Reporting Form
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard          Report New Issue    Step 2 of 4│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 Issue Details                                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Title: Pothole causing traffic issues                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Description:                                            │ │
│  │ Large pothole on Main Street near the intersection      │ │
│  │ with Oak Avenue. Causing vehicles to swerve and        │ │
│  │ creating safety hazards...                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  🏷️ Category                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🛣️ Infrastructure  🗑️ Sanitation  🚦 Traffic  💡 Utilities│ │
│  │     [Selected]                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  📸 Photos (2/5 uploaded)                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [IMG1] [IMG2] [+Add] [ ] [ ]                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              [Cancel] [← Previous] [Next →] │
└─────────────────────────────────────────────────────────────┘
```

### 3. Duplicate Detection Interface
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Duplicate Check Results                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ Similar Issues Found                                     │
│                                                             │
│  We found 2 similar issues that might be the same problem: │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🕳️ Road damage on Main St        📊 89% Similar        │ │
│  │ Reported 3 days ago by John D.   👥 5 people affected  │ │
│  │ Status: Accepted by admin         📍 0.2 km away       │ │
│  │                                                         │ │
│  │ [View Details] [This is the same issue] [Different]    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🕳️ Pothole near Oak intersection 📊 67% Similar        │ │
│  │ Reported 1 week ago by Sarah M.  👥 2 people affected  │ │
│  │ Status: In progress               📍 0.5 km away       │ │
│  │                                                         │ │
│  │ [View Details] [This is the same issue] [Different]    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ✅ None of these match? Continue with your report          │
│                                                             │
│                    [Submit New Issue] [Go Back and Edit]   │
└─────────────────────────────────────────────────────────────┘
```

## Admin Dashboard Mockups

### 1. Admin Overview Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ 🏛️ Admin Dashboard              🔔 Alerts (3)  👤 Admin User │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Today's Statistics                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │New: 23  │ │Pending  │ │In Prog  │ │Resolved │ │Rejected │ │
│  │         │ │   45    │ │   12    │ │   156   │ │    8    │ │
│  │ +15%    │ │  -8%    │ │  +25%   │ │  +12%   │ │  -20%   │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│                                                             │
│  🚨 Priority Queue                          📈 Analytics    │
│  ┌─────────────────────────────────┐      ┌─────────────────┐ │
│  │ 🔥 High Priority (8)            │      │ [Resolution     │ │
│  │ ├ Water main burst (12 reports) │      │  Time Chart]    │ │
│  │ ├ Traffic light down (8 reports)│      │                 │ │
│  │ └ Road closure needed (5 reports)│      │ Avg: 4.2 days  │ │
│  │                                 │      │ Target: 3 days  │ │
│  │ ⚡ Duplicates Detected (15)      │      └─────────────────┘ │
│  │ ├ Same pothole (6 reports)      │                        │
│  │ ├ Garbage issue (4 reports)     │      📍 Issue Heatmap  │
│  │ └ Street light (5 reports)      │      ┌─────────────────┐ │
│  └─────────────────────────────────┘      │ [Interactive    │ │
│                                           │  Map View]      │ │
│  [View All Issues] [Bulk Actions]         └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Issue Review Interface
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Queue              Issue #12345    🔗 Blockchain   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🕳️ Pothole on Main Street                                  │
│  📅 Reported: 2 hours ago by John Doe (Verified Citizen)    │
│  📍 Location: Main St & Oak Ave, Sector 15                  │
│  👥 Similar Reports: 3 (Auto-merged)                        │
│                                                             │
│  📸 Evidence Photos                                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Photo 1]    [Photo 2]    [Photo 3]                    │ │
│  │              📊 AI Analysis:                             │ │
│  │              ✅ Infrastructure damage detected           │ │
│  │              ✅ Safety hazard confirmed                 │ │
│  │              📏 Estimated size: 2m x 1m                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  📝 Description                                              │
│  Large pothole causing vehicles to swerve. Multiple         │
│  citizens have reported near-miss accidents...               │
│                                                             │
│  🤖 AI Recommendations                                       │
│  • Priority: HIGH (safety hazard)                          │
│  • Category: Road Infrastructure                           │
│  • Estimated Cost: ₹15,000 - ₹25,000                      │
│  • Suggested Timeline: 3-5 days                           │
│                                                             │
│  💬 Admin Notes                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Internal notes for team coordination...                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [❌ Reject] [⏳ Need More Info] [✅ Accept & Assign]        │
└─────────────────────────────────────────────────────────────┘
```

### 3. Proof of Fix Upload
```
┌─────────────────────────────────────────────────────────────┐
│ 📸 Upload Proof of Fix                    Issue #12345      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🕳️ Pothole on Main Street - RESOLUTION REQUIRED            │
│  📅 Accepted: 3 days ago | 👷 Assigned to: Road Crew Alpha  │
│                                                             │
│  📸 Before Photos (Original Report)                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Before Image 1] [Before Image 2] [Before Image 3]     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  📸 After Photos (Upload Required)                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [📷 Upload] [📷 Upload] [📷 Upload]                     │ │
│  │                                                         │ │
│  │ 📋 Requirements:                                        │ │
│  │ • Same angle as original photos                         │ │
│  │ • Clear view of completed work                          │ │
│  │ • Minimum 3 photos required                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  📝 Work Completion Notes                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Work completed on [Date]. Used standard asphalt mix.    │ │
│  │ Road surface leveled and compacted. Area marked for     │ │
│  │ 24-hour curing period...                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  💰 Actual Cost: ₹18,500                                    │
│  👷 Crew Members: 4                                         │
│  ⏱️ Time Taken: 6 hours                                     │
│                                                             │
│  ⚠️ This action will be recorded on the blockchain          │
│                                                             │
│                    [Cancel] [Mark as Resolved] 🔗           │
└─────────────────────────────────────────────────────────────┘
```

## Public Portal Mockups

### 1. Public Issue Browser
```
┌─────────────────────────────────────────────────────────────┐
│ 🌍 Civic Lens - Public Transparency Portal                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Search Issues    📊 Filter: All | Resolved | Pending    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Search by location, category, or keywords...            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  📈 City Statistics                                          │
│  Total Issues: 2,456 | Resolved: 1,890 (77%) | Avg Time: 4.2d│
│                                                             │
│  📋 Recent Issues                                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ✅ Pothole on Main Street           🔗 Blockchain Proof │ │
│  │    Resolved 2 days ago              📸 Before/After    │ │
│  │    👥 3 reports merged               ⭐ 4.8/5 rating    │ │
│  │                                                         │ │
│  │ 🔄 Traffic Light Malfunction        📍 Downtown        │ │
│  │    In progress (Day 2 of 5)         👷 Electrical Team │ │
│  │    👥 8 reports                      📊 High Priority   │ │
│  │                                                         │ │
│  │ ⏳ Garbage Collection Delay         📍 Sector 12       │ │
│  │    Pending review (3 hours ago)     👥 12 reports      │ │
│  │    🤖 Duplicate detected             📋 Under Review    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  🗺️ Interactive Map View                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [City Map with Color-coded Issue Markers]              │ │
│  │ 🟢 Resolved  🟡 In Progress  🔴 Pending  ⚫ Rejected    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Issue Verification Page
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Issue Verification                        Issue #12345    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🕳️ Pothole on Main Street                                  │
│  📅 Reported: Jan 15, 2025 | ✅ Resolved: Jan 18, 2025      │
│  ⏱️ Resolution Time: 3 days (Target: 5 days) ✅             │
│                                                             │
│  🔗 Blockchain Verification                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Transaction Hash: 0x1234567890abcdef...                 │ │
│  │ Block Number: #45,678,901                               │ │
│  │ Network: Polygon Mainnet                                │ │
│  │ Confirmations: 1,247 ✅                                 │ │
│  │ Gas Used: 42,150                                        │ │
│  │                                                         │ │
│  │ [View on Polygonscan] [Download Proof Certificate]     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  📸 Before & After Comparison                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ BEFORE (Reported)        |        AFTER (Resolved)     │ │
│  │ [Pothole Image]          |        [Fixed Road Image]   │ │
│  │                          |                             │ │
│  │ 📊 AI Analysis:          |        📊 Verification:     │ │
│  │ • Damage confirmed       |        • Work completed     │ │
│  │ • Safety hazard          |        • Quality approved   │ │
│  │ • Size: 2m x 1m         |        • Surface leveled    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  👥 Community Feedback                                       │
│  ⭐⭐⭐⭐⭐ 4.8/5 (24 ratings)                                │
│  💬 "Great work! Road is smooth now." - Sarah M.            │
│  💬 "Fixed quickly and professionally." - John D.           │
│                                                             │
│  📊 Impact Metrics                                           │
│  • Citizens Affected: ~500 daily commuters                 │
│  • Cost: ₹18,500 (Within budget)                           │
│  • Materials: Standard asphalt mix                         │
│  • Crew: 4 workers, 6 hours                               │
└─────────────────────────────────────────────────────────────┘
```

## Mobile App Mockups (Future)

### 1. Mobile Dashboard
```
┌─────────────────┐
│ 🏙️ Civic Lens   │
│           🔔 👤 │
├─────────────────┤
│                 │
│ 📊 Quick Stats  │
│ ┌─────┐ ┌─────┐ │
│ │ 12  │ │  8  │ │
│ │Rep. │ │Res. │ │
│ └─────┘ └─────┘ │
│                 │
│ 🚨 Report Issue │
│ ┌─────────────┐ │
│ │ 📸 Camera   │ │
│ │ 📍 Location │ │
│ │ 📝 Details  │ │
│ └─────────────┘ │
│                 │
│ 📋 My Issues    │
│ ┌─────────────┐ │
│ │ 🕳️ Pothole  │ │
│ │ ✅ Resolved │ │
│ │             │ │
│ │ 🗑️ Garbage  │ │
│ │ 🔄 Progress │ │
│ └─────────────┘ │
│                 │
│ 🗺️ [Map View]   │
└─────────────────┘
```

This comprehensive UI mockup system provides a clear visual guide for the development team and stakeholders to understand the user experience across all platforms and user types.
