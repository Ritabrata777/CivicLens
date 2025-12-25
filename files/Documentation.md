# 📘 Civic Lens Documentation

## 1. Project Overview
Civic Lens is a transparent, AI-powered civic grievance redressal platform. It leverages specific technologies to ensure issues are reported, tracked, and resolved with accountability.

### Core Philosophy
- **Transparency:** Blockchain immutable records for critical actions.
- **Efficiency:** AI-powered deduplication and categorization.
- **Accountability:** "Proof of Fix" requiring photographic evidence for resolving issues.

## 2. Technical Architecture

### 2.1 Frontend & Backend (Next.js)
- **Framework:** Next.js 15 (App Router).
- **Language:** TypeScript.
- **Styling:** Tailwind CSS + Shadcn/UI.
- **Server Actions:** Used for backend logic, database interactions, and blockchain triggering.

### 2.2 Database (MongoDB)
The project uses MongoDB for data persistence, managed via Mongoose models.
- **Users:** Stores user profiles and authentication details (`src/db/models/User.ts`).
- **Issues:** Stores reported grievances, including image URLs, location, and status (`src/db/models/Issue.ts`).
- **Transactions:** Logs blockchain transaction hashes for admin actions (`src/db/models/Transaction.ts`).

### 2.3 Artificial Intelligence (Python Microservices)
Localized AI execution via Node.js `child_process`.
- **Location:** `ml/scripts/`
- **Capabilities:**
    - **Duplicate Detection:** Uses BERT (Sentence Transformers) and Perceptual Hashing.
    - **Traffic Violation Detection:** YOLO-based detection for helmet usage and license plate recognition.
    - **OCR:** Reads text from images (Voter IDs, License Plates).

### 2.4 Blockchain (Web3)
- **Network:** Polygon Amoy Testnet / Local Ganache.
- **Contracts:** Solidity smart contracts for logging administrative actions.
- **Integration:** Ethers.js used in Server Actions to interact with the blockchain.

## 3. Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (Local or Atlas URI)
- MetaMask Wallet

### Environment Variables (.env)
```env
MONGODB_URI=...
MONGODB_DB_NAME=...
NEXT_PUBLIC_ADMIN_WALLETS=...
PRIVATE_KEY=...
AMOY_RPC_URL=...
GOOGLE_GENAI_API_KEY=...
```

### Installation Steps
1.  **Install Node Dependencies:**
    ```bash
    npm install
    ```
2.  **Setup Python Environment:**
    ```bash
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r ml/scripts/requirements.txt
    ```
3.  **Download ML Models:**
    ```bash
    python ml/scripts/download_model.py
    ```
4.  **Seed Database:**
    ```bash
    node scripts/seed-mongo.cjs
    ```
5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 4. API Endpoints
- **Voter Verification:** `GET /api/verify-voter` - Validates voter credentials.

## 5. Directory Structure
- `src/app`: Next.js App Router pages and API routes.
- `src/components`: React components (UI, Layouts).
- `src/db`: Mongoose models and connection logic.
- `src/server`: Server actions for business logic.
- `ml`: Python scripts, models, and datasets.
- `contracts`: Solidity smart contracts.
