---
title: Civic Lens API
emoji: 🏙️
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Civic Lens AI Backend

This is the Python AI service for Civic Lens.
It handles:
- **Voter ID Verification** (OCR + Keyword Matching)
- **Issue Duplicate Detection** (BERT Embeddings + Perceptual Hashing)
- **Traffic Violation Detection** (YOLO)

## Setup
This Space expects the following Secret Environment Variable:
- `MONGODB_URI`: Connection string to the MongoDB database.

## API Endpoints
- `POST /verify-voter`
- `POST /detect-duplicates`
