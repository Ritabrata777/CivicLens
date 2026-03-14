# Civic Lens

**Civic Lens** is an AI-assisted civic grievance platform that helps citizens report local problems, track neighborhood health, and connect communities with faster, more transparent action.

It combines:
- **community issue reporting**
- **AI duplicate detection and categorization**
- **pincode-based locality scoring**
- **Local Heroes community participation**
- **SOS alert routing**
- **blockchain-backed admin accountability**

---

## Overview

Traditional complaint systems are usually slow, opaque, and hard to trust. Civic Lens is designed to improve that experience by making civic reporting more visible, structured, and actionable.

Citizens can report issues like potholes, drainage problems, traffic violations, or domestic utility failures. Admins can review reports, detect duplicates, verify fixes, and maintain a public record of action. The platform also includes a community SOS workflow that alerts nearby helpers based on recent civic activity and location.

---

## Highlights

### AI-assisted issue handling
- Detects likely duplicate issues using semantic similarity and image hashing.
- Improves duplicate detection for domestic utility complaints using category, keyword, and locality-aware boosts.
- Helps categorize issues automatically from text and image context.

### Locality score
- Users can search a **6-digit pincode** on the home page.
- Each locality gets a score out of 100 based on issue volume, urgency, and resolution momentum.
- Results show total issues, open issues, resolved issues, and category breakdown.

### Domestic utilities reporting
- Includes a dedicated **Domestic Utilities** category.
- Covers:
  - water supply issues
  - LPG gas supply issues
  - electricity outages
  - meter failures
  - utility-access problems in housing complexes and flats

### Local Heroes system
- Tracks users who actively report and support civic issues.
- Builds a leaderboard based on civic points.
- Reuses recent issue activity to help identify nearby community responders.

### SOS emergency support
- Home page has a fast SOS flow with one-tap emergency buttons.
- Nearby Local Heroes can receive alerts, review active SOS requests, and accept them from the profile dashboard.
- Senders can track whether a helper accepted the request.

### Admin transparency
- Duplicate-checking UI shows score, utility tags, and resident location context.
- Issue resolution requires proof-of-fix imagery.
- Blockchain-backed verification can be recorded for admin actions.

---

## Core Features

### 1. Citizen issue reporting
- Create public issue reports with:
  - title
  - description
  - category
  - location
  - pincode
  - urgency
  - image or video

### 2. Duplicate detection
- Python-powered duplicate detection compares:
  - semantic text similarity
  - image similarity
  - category overlap
  - utility keywords
  - locality overlap

### 3. Locality intelligence
- Pincode search on the home page
- Locality score
- Category count breakdown
- Open vs resolved issue trends

### 4. SOS response flow
- Quick SOS actions:
  - Medical
  - Safety
  - Other
- Auto-detects user location
- Routes alerts to nearby Local Heroes
- Allows helpers to accept and respond

### 5. Admin workflow
- Review duplicate candidates
- Inspect matched locations
- Update issue state
- Upload proof-of-fix

---

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Next.js Server Actions
- MongoDB
- Mongoose

### AI / ML
- Python
- FastAPI
- sentence-transformers
- imagehash
- EasyOCR
- Ultralytics / YOLO

### Blockchain
- Solidity
- Hardhat
- ethers.js

---

## Project Structure

```txt
src/
  app/                 Next.js app routes and pages
  components/          UI and feature components
  db/models/           Mongoose models
  lib/                 shared utilities, types, scoring logic
  server/              data layer and server actions

python_backend/        FastAPI AI backend
contracts/             Solidity contracts
scripts/               utility and migration scripts
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
MONGODB_URI=
MONGODB_DIRECT_URI=
MONGODB_DB_NAME=

PRIVATE_KEY=
POLYGONSCAN_API_KEY=
AMOY_RPC_URL=
NEXT_PUBLIC_AMOY_RPC_URL=

GOOGLE_API_KEY=
GEMINI_API_KEY=
GOOGLE_GENAI_API_KEY=

PYTHON_API_URL=http://127.0.0.1:7860
NEXT_PUBLIC_MAPTILER_API_KEY=
NEXT_PUBLIC_ADMIN_WALLETS=
```

---

## Local Development

### 1. Install Node dependencies

```bash
npm install
```

### 2. Create and activate Python virtual environment

**Windows**

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r python_backend/requirements.txt
```

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r python_backend/requirements.txt
```

### 3. Run the Python backend

**Windows**

```bash
cd python_backend
..\ .venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 7860
```

If needed, use the full path form:

```bash
cd python_backend
..\CivicLens\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 7860
```

**macOS / Linux**

```bash
cd python_backend
../.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 7860
```

Note:
- Some duplicate-detection flows can fall back to the local Python runner even if the FastAPI service is unavailable.
- Other AI flows still work best when the Python backend is running.

### 4. Start the Next.js app

```bash
npm run dev
```

Default local app URL:

```txt
http://localhost:9002
```

---

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run backfill:pincodes
```

### `backfill:pincodes`
Backfills `postal_code` values for older issue data when possible.

---

## Current Limitations

- SOS notifications are currently **in-app/browser-based**, not full native push notifications.
- Nearby SOS helper matching is **distance-aware**, but it still depends on available issue and location history.
- Some AI flows are strongest when the local Python backend is available and warmed up.
- SOS is suitable as an MVP/community response tool, but not a replacement for official emergency infrastructure.

---

## Recommended Next Improvements

- Native push notifications for SOS
- Map-based live SOS tracking
- Admin SOS monitoring dashboard
- Read/unread notification state
- Explicit SOS resolve/close flow
- Better role-based trust/reputation for Local Heroes

---

## Why This Project Matters

Civic Lens is not only a reporting app. It is a civic coordination system:
- citizens report issues
- AI reduces noise
- admins work with clearer signals
- communities see what is happening
- helpers can respond faster in urgent situations

The goal is a more transparent, responsive, and community-powered civic experience.
