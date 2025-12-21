# Tech Stack & Build System

## Core Technologies

### Frontend & Backend
- **Framework**: Next.js 15 with App Router and Server Actions
- **Language**: TypeScript with strict mode enabled
- **Database**: SQLite with `better-sqlite3` for fast local relational data
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**: React Hook Form with Zod validation

### AI/ML Stack
- **Runtime**: Python 3.10+ executed via Node.js child_process
- **Libraries**: 
  - `sentence-transformers` (semantic search, duplicate detection)
  - `ultralytics` (YOLO for computer vision)
  - `easyocr` (voter ID verification)
  - `imagehash` (perceptual hashing)
  - `opencv-python-headless` (image processing)
- **Model**: `all-MiniLM-L6-v2` (locally cached)

### Blockchain
- **Smart Contracts**: Solidity with Hardhat framework
- **Interaction**: Ethers.js v6
- **Networks**: Local Ganache / Polygon Amoy Testnet
- **Artifacts**: Generated in `src/artifacts/`

### UI Frame