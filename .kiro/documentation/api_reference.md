# 📡 API Reference

## Authentication Endpoints

### POST /api/auth/login
Authenticate user with credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "citizen",
    "verified": true
  }
}
```

### POST /api/auth/verify-voter
Verify voter ID with OCR.

**Request Body:**
```json
{
  "voterId": "ABC1234567",
  "frontImage": "base64_encoded_image",
  "backImage": "base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "extractedId": "ABC1234567",
  "confidence": 0.95
}
```

## Issue Management Endpoints

### POST /api/issues
Submit a new issue.

**Request Body:**
```json
{
  "title": "Pothole on Main Street",
  "description": "Large pothole causing traffic issues",
  "category": "infrastructure",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Main Street, New Delhi"
  },
  "images": ["base64_image_1", "base64_image_2"],
  "priority": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "issueId": "issue_12345",
  "status": "submitted",
  "duplicateCheck": {
    "isDuplicate": false,
    "similarIssues": []
  }
}
```

### GET /api/issues
Retrieve issues with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (submitted, accepted, resolved)
- `category`: Filter by category
- `userId`: Filter by user (admin only)

**Response:**
```json
{
  "success": true,
  "issues": [
    {
      "id": "issue_12345",
      "title": "Pothole on Main Street",
      "status": "submitted",
      "category": "infrastructure",
      "createdAt": "2025-01-15T10:30:00Z",
      "location": {...},
      "images": [...],
      "duplicateCount": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### PUT /api/issues/:id/status
Update issue status (admin only).

**Request Body:**
```json
{
  "status": "accepted",
  "adminNotes": "Forwarded to maintenance team",
  "proofImage": "base64_encoded_proof"
}
```

**Response:**
```json
{
  "success": true,
  "issue": {...},
  "blockchainTx": "0x1234567890abcdef",
  "timestamp": "2025-01-15T11:00:00Z"
}
```

## AI Service Endpoints

### POST /api/ai/detect-duplicates
Check for duplicate issues.

**Request Body:**
```json
{
  "issueId": "issue_12345",
  "mongoUri": "mongodb://...",
  "dbName": "civic_lens"
}
```

**Response:**
```json
{
  "matches": [
    {
      "issueId": "issue_11111",
      "similarity": 0.89,
      "type": "semantic",
      "title": "Road damage on Main St"
    }
  ],
  "processingTime": 1.2
}
```

### POST /api/ai/detect-violation
Analyze image for traffic violations.

**Request Body:**
```json
{
  "image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "violations": [
    {
      "type": "no_helmet",
      "confidence": 0.92,
      "boundingBox": [100, 150, 200, 250]
    }
  ],
  "licenseplate": {
    "text": "DL01AB1234",
    "confidence": 0.87
  },
  "processingTime": 2.1
}
```

## Blockchain Endpoints

### GET /api/blockchain/verify/:txHash
Verify blockchain transaction.

**Response:**
```json
{
  "success": true,
  "transaction": {
    "hash": "0x1234567890abcdef",
    "blockNumber": 12345678,
    "timestamp": "2025-01-15T11:00:00Z",
    "status": "confirmed",
    "gasUsed": 45000
  },
  "eventData": {
    "issueId": "issue_12345",
    "action": "accepted",
    "adminId": "admin_001"
  }
}
```

### GET /api/blockchain/audit/:issueId
Get complete audit trail for an issue.

**Response:**
```json
{
  "success": true,
  "auditTrail": [
    {
      "action": "submitted",
      "timestamp": "2025-01-15T10:30:00Z",
      "txHash": null,
      "actor": "user_123"
    },
    {
      "action": "accepted",
      "timestamp": "2025-01-15T11:00:00Z",
      "txHash": "0x1234567890abcdef",
      "actor": "admin_001"
    }
  ]
}
```

## Analytics Endpoints

### GET /api/analytics/dashboard
Get dashboard statistics (admin only).

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalIssues": 1250,
    "resolvedIssues": 890,
    "pendingIssues": 360,
    "resolutionRate": 0.712,
    "avgResolutionTime": "5.2 days",
    "duplicatesDetected": 234,
    "categoryBreakdown": {
      "infrastructure": 450,
      "sanitation": 320,
      "traffic": 280,
      "utilities": 200
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_REQUIRED`: Missing or invalid token
- `AUTHORIZATION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server-side error
- `BLOCKCHAIN_ERROR`: Blockchain transaction failed
- `AI_SERVICE_ERROR`: AI processing failed
