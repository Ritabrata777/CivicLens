# 🏙️ Civic Lens
> **Trust, but Verify.** — The Future of Transparent Civic Governance.

<div align="center">

[![Vercel App](https://img.shields.io/badge/Deploy-Live%20App-black?logo=vercel&style=for-the-badge)](https://civic-lens-beige.vercel.app/)
[![YouTube Video](https://img.shields.io/badge/YouTube-Watch%20Demo-red?logo=youtube&style=for-the-badge)](https://www.youtube.com/watch?v=uf0jUmhDKeA)
[![Notion](https://img.shields.io/badge/Notion-Project%20Docs-white?logo=notion&style=for-the-badge&logoColor=black)](https://www.notion.so/CivicLens-2d8c1d9f2cca807194e2f70471124ed4)

</div>

---

## 💡 Inspiration
We've all seen them—potholes that stay unfilled for months, garbage piles that grow into hills, and traffic violations that go unnoticed. The current system of civic grievance redressal is **reactive, opaque, and often unaccountable**. Citizens file complaints, but they disappear into a black box. Did anyone see it? Was it fixed? Why was report #1234 deleted?

We built **Civic Lens** to replace "Trust me, bro" with **"Trust, but Verify."** usage state-of-the-art AI and Blockchain technology.

## 🚀 What it does
Civic Lens is a dual-interface platform (Citizen App + Admin Dashboard) that ensures every civic issue is tracked, verified, and permanently recorded.

*   **For Citizens**: A seamless way to report issues. You don't just "complain"; you create a verifiable digital record.
*   **For Authorities**: An AI-powered dashboard that filters noise (duplicates) and prioritizes action.
*   **For Democracy**: A blockchain ledger that ensures no valid complaint can ever be secretly deleted or ignored.

## ⚙️ How we built it

### 🧠 The Brain: Artificial Intelligence
We use a sophisticated Python microservice architecture to handle the "senses" of the platform.
*   **BERT (Sentence Transformers)**: Semantic search to detect if "Big hole in road" and "Deep pothole on Main St" are the same issue.
*   **Perceptual Hashing & Computer Vision**: Detects near-identical images to prevent spam.
*   **YOLOv8**: automatic detection of traffic violations (No Helmet, Triple Riding) from user-uploaded photos.

### ⛓️ The Truth: Blockchain
*   **Smart Contracts (Solidity/Polygon)**: Store the hash of every critical action (Issue Reported, Verified, Rejected, Resolved).
*   **Anti-Corruption Layer**: Even if a database admin wipes the SQL database, the blockchain hash remains as proof that an issue *existed* and was *ignored*.

### 💻 The Body: Full Stack Web
*   **Next.js 15 (App Router)**: Fast, server-rendered React application.
*   **Tailwind CSS + Shadcn/UI**: Beautiful, accessible, and responsive UI.
*   **SQLite / MongoDB**: Hybrid database approach for speed and flexibility.

## 🚧 Challenges we ran into
*   **AI-Model Latency**: Running BERT and YOLO on a standard web server caused timeouts. We solved this by creating a dedicated Python worker process that loads models into memory once and communicates via a lightweight IPC bridge.
*   **False Positives**: The duplicate detector was initially too aggressive. We fine-tuned the semantic similarity thresholds to balance between merging duplicates and keeping distinct issues.
*   **Blockchain Gas Fees**: Implementing this on Mainnet would be costly. We optimized our contract to only store **IPFS Hashes** and state changes, keeping gas costs negligible.

## 🏅 Accomplishments that we're proud of
*   **End-to-End "Truth" Flow**: Successfully implemented the full cycle: User Report -> AI Verification -> Admin Fix -> Evidence Upload -> Blockchain Confirmation.
*   **Real-time Duplicate Detection**: Seeing the AI instantly flag a new report as a duplicate of an existing one was a "magic moment."
*   **Seamless Integration**: Connecting a Python ML backend with a Next.js frontend and a Solidity smart contract in a unified monorepo.

## ⏭️ What's next for Civic Lens
*   **Dull-E Integration**: Generating "predicted repairs" to show citizens what the fix *should* look like.
*   **IoT Integration**: Connecting with smart streetlights to auto-report failures.
*   **Tokenized Rewards**: Gamifying civic duty by rewarding active citizens with "Civic Points" (ERC-20 tokens) for verified reports.

---

## 👥 Team
*   **Moinak Chakraborty**: Back-end, AI/ML
*   **Ritabrata Majumdar**: Blockchain, Back-end
*   **Tabassum Molla**: UI/UX, Front-end
*   **Arnava Hazra**: Front-end, Back-end
*   **Arya Roy**: AI/ML

---

## ⚡ Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/Ritabrata777/Civic-Lens
cd Civic-Lens
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup AI Environment
```bash
# Recommended: Create a virtual environment
cd ml/scripts
pip install -r requirements.txt
python download_model.py
cd ../..
```

### 4. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and start fixing your city! 🏙️

