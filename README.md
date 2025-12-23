
# 🏙️ Civic Lens - The Future of Civic Governance

> **"Trust, but Verify."** — Rebuilding the bridge between citizens and government through AI and Blockchain.


## 🚀 Overview
**Civic Lens** is a next-generation civic grievance redressal platform. Unlike traditional systems (like CPGRAMS) which are opaque and reactive, Civic Lens is **Transparent**, **Proactive**, and **Accountable**.

We use **Artificial Intelligence** to filter noise and **Blockchain** to ensure that once a complaint is filed, it can never be deleted or ignored without a trace.

## ✨ Key Features

### 🧠 1. AI-Powered Triage (Locally Hosted)
-   **Duplicate Detection**: Uses **BERT (Sentence Transformers)** and **Perceptual Hashing** to instantly find if 50 people reported the same pothole. Merges them into one "Mega-Issue" to save admin time.
-   **Violation Detection**: Analyze uploaded images (e.g., Traffic Violations) to automatically detect "No Helmet" or "Triple Riding" using **YOLO/Computer Vision**.
-   **Smart Categorization**: Auto-tags issues (Pothole, Garbage, Electrical) based on image and text analysis.

### ⛓️ 2. Blockchain "Truth Log"
-   **Immutable Records**: every critical admin action (Accept, Reject, Resolve) is hashed and stored on the **Ethereum/Polygon** blockchain.
-   **Anti-Corruption**: An admin cannot "quietly delete" an inconvenient complaint. The blockchain record remains as proof.

### 📸 3. The "Trust Protocol" (Proof of Fix)
-   **Accountability**: An admin *cannot* mark an issue as "Resolved" without uploading photographic evidence.
-   **Transparency**: The public dashboard shows a **Before vs. After** comparison slider for every resolved issue. Citizens verify the work.

### 🗳️ 4. Dual-Layer Voter Verification
-   **Identity Guard**: Ensures one citizen = one vote.
-   **OCR Verification**: Scans Voter ID cards (Front & Back) to verify citizenship before allowing critical actions.

---

## 🛠️ Tech Stack

### Frontend & Backend
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
-   **Language**: TypeScript
-   **Database**: SQLite (with `better-sqlite3`) for fast, local relational data.
-   **Styling**: Tailwind CSS + Shadcn/UI for a premium, accessible design.

### Machine Learning (The "Brain")
-   **Python Microservices**: Executed via Node.js `child_process`.
-   **Libraries**: `sentence-transformers` (Semantic Search), `imagehash`, `opencv-python`.
-   **Model**: `all-MiniLM-L6-v2` (Locally cached for performance).

### Web3 (The "Truth")
-   **Smart Contracts**: Solidity (Hardhat).
-   **Interaction**: Ethers.js.
-   **Network**: Local Ganache / Polygon Amoy Testnet.

---

## ⚡ Getting Started

### Prerequisites
-   Node.js 18+
-   Python 3.10+
-   MetaMask Wallet

### 1. Clone & Install
```bash
git clone https://github.com/your-username/civic-lens.git
cd civic-lens
npm install
```

### 2. Setup Python Environment (For AI)
We use a local Python scripts folder for the AI modules.
```bash
# Install dependencies globally or in a venv
pip install sentence-transformers imagehash scikit-learn pillow numpy opencv-python-headless
# Pre-cache the model (prevents timeouts)
cd ml/scripts
python download_model.py
```

### 3. Initialize Database
```bash
npm run db:init
# (Optional) Add dummy data
npm run db:seed
```

### 4. Run the App
```bash
npm run dev
```

