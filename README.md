# Civic Lens

### AI + Community + Accountability for civic problem solving

Civic Lens is a civic action platform where citizens can report local problems, measure neighborhood health, alert nearby helpers in emergencies, and keep public action visible through AI-assisted workflows and blockchain-backed verification.

---

## Why Civic Lens?

Most complaint systems feel slow, hidden, and disconnected from the people they are supposed to serve.

**Civic Lens** is built to change that with:

- **smart reporting** for real civic problems
- **AI duplicate detection** to reduce report noise
- **pincode-based locality score** to show area health
- **Local Heroes** to reward community action
- **SOS alerts** to route emergency help nearby
- **transparent admin workflows** with proof-of-fix and blockchain support

---

## What Makes It Stand Out

### Smart Issue Reporting
Citizens can submit public reports with title, description, category, urgency, location, pincode, and media.

### AI Duplicate Detection
The platform compares reports using semantic text similarity, image hashing, utility keywords, and locality overlap so admins can identify repeated issues quickly.

### Locality Score
Users can search a pincode and instantly see:
- issue score out of 100
- open vs resolved issue count
- urgency signals
- top civic problem categories

### Domestic Utilities Support
There is a dedicated category for:
- water supply issues
- LPG gas supply issues
- electricity outages
- meter problems
- utility-access issues in flats and housing complexes

### Local Heroes
The app tracks active contributors and surfaces a community leaderboard based on reporting and support activity.

### SOS Emergency Flow
Users can trigger a fast SOS alert from the home page. Nearby Local Heroes can receive alerts, review active requests, and accept them from the SOS dashboard.

### Admin Accountability
Admins can:
- review issues
- inspect duplicate matches
- see resident locations
- upload proof of fix
- record key actions with blockchain-backed verification

---

## Feature Snapshot

| Area | What It Does |
|---|---|
| Reporting | Submit civic issues with location, pincode, urgency, and media |
| AI | Detect duplicates, utility overlap, and semantic similarity |
| Locality Score | Show pincode-based civic health score |
| Local Heroes | Reward active community participation |
| SOS | Send emergency alerts to nearby helpers |
| Admin Tools | Review duplicates, update status, verify fixes |
| Transparency | Support blockchain-linked admin records |

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
  app/                 App routes and pages
  components/          UI and feature components
  db/models/           Mongoose models
  lib/                 shared utilities, types, scoring logic
  server/              server actions and data access

python_backend/        FastAPI AI backend
contracts/             Solidity smart contracts
scripts/               utilities and migration helpers
```

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Python environment

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

### 3. Add environment variables

Create a `.env` file in the project root:

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

### 4. Start the Python backend

**Windows**

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

### 5. Start the app

```bash
npm run dev
```

App URL:

```txt
http://localhost:9002
```

---

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run backfill:pincodes
```

### `backfill:pincodes`
Backfills missing `postal_code` values for older issue records.

---

## Current MVP Limits

- SOS uses in-app/browser alerts, not full mobile push notifications yet.
- Nearby SOS matching is distance-aware, but it still depends on available user and issue location history.
- Some AI flows work best when the Python backend is running locally.
- SOS is a community-assistance feature, not a replacement for official emergency dispatch.

---

## Best Next Upgrades

- native push notifications for SOS
- map-based live SOS tracking
- admin SOS oversight panel
- better notification read/unread state
- explicit SOS close/resolve flow
- stronger Local Hero trust and reputation model

---

## Vision

Civic Lens is not just a complaint board.

It is a **community action system** where:
- citizens report what matters
- AI reduces noise
- local areas become measurable
- admins act with visibility
- helpers respond faster in urgent situations

The goal is simple: make civic action more transparent, more responsive, and more human.
