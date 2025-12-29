# Design Document: Traffic Violation Detection

## Overview

The Traffic Violation Detection system is a multi-layered AI-powered service that automatically identifies traffic violations from uploaded images, extracts evidence, and generates comprehensive violation reports. The system integrates with the existing Civic Lens platform to provide seamless violation management alongside regular civic issues.

The architecture follows a microservices pattern with clear separation between image processing (Python/FastAPI), business logic (Node.js/Server Actions), and user interface (Next.js). All critical actions are logged to the blockchain for immutable audit trails.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (Next.js)                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Violation Upload │  │ Admin Review UI  │  │ Report View  │  │
│  │    Component     │  │   Dashboard      │  │  Component   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Backend Layer (Node.js)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Violation Server │  │ Report Generator │  │ Blockchain   │  │
│  │    Actions       │  │    & Validator   │  │  Integrator  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AI Services Layer (Python)                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ YOLO Helmet      │  │ EasyOCR License  │  │ Image        │  │
│  │ Detector         │  │ Plate Extractor  │  │ Annotator    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ SQLite Database  │  │ File Storage     │  │ Blockchain   │  │
│  │ (Violations)     │  │ (Images/Evidence)│  │ (Audit Trail)│  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Violation Detection Flow:**
```
User Upload Image
    ↓
Validate Image Format & Size
    ↓
Send to YOLO Helmet Detector (Python)
    ↓
Detect Helmet Violations
    ↓
Extract Bounding Boxes & Confidence Scores
    ↓
Send Motorcycle Region to OCR Service
    ↓
Extract License Plate Text
    ↓
Validate License Plate Format
    ↓
Create Annotated Image (highlight violation)
    ↓
Generate Violation Report
    ↓
Store in Database + Blockchain Log
    ↓
Display in Admin Review Queue
```

## Components and Interfaces

### 1. Frontend Components

#### ViolationUploadComponent
- **Purpose**: Allow users to upload images for violation detection
- **Inputs**: Image file, location (optional), description (optional)
- **Outputs**: Upload status, violation detection results
- **Behavior**: 
  - Validates image format (JPEG, PNG)
  - Validates file size (max 10MB)
  - Shows real-time processing status
  - Displays detected violations with confidence scores

#### AdminReviewDashboard
- **Purpose**: Display violations pending admin review
- **Inputs**: Filter criteria (status, confidence, date range)
- **Outputs**: Violation list, detailed violation view
- **Behavior**:
  - Lists violations ordered by confidence score (descending)
  - Shows original and annotated images side-by-side
  - Provides approve/reject actions
  - Tracks approval statistics

#### ViolationReportView
- **Purpose**: Display comprehensive violation report
- **Inputs**: Violation ID
- **Outputs**: Full report with evidence, metadata, blockchain verification
- **Behavior**:
  - Shows violation details (type, timestamp, location, license plate)
  - Displays before/after images
  - Shows blockchain transaction hash
  - Provides evidence download options

### 2. Backend Services

#### ViolationServerActions
- **Purpose**: Handle violation submission and processing
- **Key Functions**:
  - `submitViolationImage(file, metadata)`: Receives image upload
  - `processViolation(imageId)`: Orchestrates detection pipeline
  - `approveViolation(violationId, adminId)`: Admin approval workflow
  - `rejectViolation(violationId, adminId, reason)`: Admin rejection workflow
  - `getViolationDetails(violationId)`: Retrieve violation data

#### ReportGenerator
- **Purpose**: Create comprehensive violation reports
- **Key Functions**:
  - `generateViolationReport(detectionResult)`: Create report from detection
  - `calculatePenalty(violationType, jurisdiction)`: Determine penalty amount
  - `createAnnotatedImage(originalImage, detections)`: Generate highlighted image
  - `assignViolationId()`: Generate unique violation ID

#### BlockchainIntegrator
- **Purpose**: Log violations to blockchain
- **Key Functions**:
  - `logViolationCreation(violationId, metadata)`: Record violation creation
  - `logViolationApproval(violationId, adminId)`: Record admin approval
  - `logViolationRejection(violationId, adminId, reason)`: Record rejection
  - `verifyViolationIntegrity(violationId)`: Verify blockchain record

### 3. AI Services (Python/FastAPI)

#### HelmetDetectionService
- **Purpose**: Detect motorcycle riders without helmets
- **Model**: YOLOv8 (nano variant for speed)
- **Inputs**: Image file
- **Outputs**: List of detections with bounding boxes and confidence scores
- **Endpoint**: `POST /detect/helmet`
- **Response Format**:
```json
{
  "detections": [
    {
      "type": "rider_no_helmet",
      "confidence": 0.92,
      "bbox": [x1, y1, x2, y2],
      "motorcycle_bbox": [x1, y1, x2, y2]
    }
  ],
  "processing_time_ms": 1200
}
```

#### LicensePlateOCRService
- **Purpose**: Extract license plate text from images
- **Model**: EasyOCR (trained on Indian vehicle formats)
- **Inputs**: Image region (motorcycle area)
- **Outputs**: Extracted text, confidence score, validation status
- **Endpoint**: `POST /ocr/license-plate`
- **Response Format**:
```json
{
  "plates": [
    {
      "text": "KA-01-AB-1234",
      "confidence": 0.88,
      "bbox": [x1, y1, x2, y2],
      "valid_format": true
    }
  ],
  "processing_time_ms": 800
}
```

#### ImageAnnotationService
- **Purpose**: Create annotated versions highlighting violations
- **Inputs**: Original image, detection results
- **Outputs**: Annotated image with highlights
- **Endpoint**: `POST /annotate/violation`
- **Behavior**:
  - Draws bounding boxes around violations
  - Adds labels with confidence scores
  - Highlights license plate region
  - Adds timestamp and location metadata

## Data Models

### Violation Schema
```typescript
interface Violation {
  id: string;                    // VIO-YYYYMMDD-XXXXX
  type: "helmet" | "other";
  status: "pending" | "approved" | "rejected" | "resolved";
  
  // Detection Data
  originalImagePath: string;
  annotatedImagePath: string;
  detectionConfidence: number;   // 0-1
  
  // License Plate Data
  licensePlate: string;          // KA-01-AB-1234
  plateConfidence: number;       // 0-1
  plateValidated: boolean;
  
  // Metadata
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  
  // Admin Actions
  approvedBy?: string;           // Admin user ID
  approvedAt?: Date;
  rejectionReason?: string;
  rejectedBy?: string;
  
  // Blockchain
  blockchainHash?: string;
  blockchainTimestamp?: Date;
  
  // Penalty
  penaltyAmount?: number;
  penaltyCalculatedAt?: Date;
  
  // Evidence
  evidencePackageId: string;
  cryptographicHash: string;
}
```

### EvidencePackage Schema
```typescript
interface EvidencePackage {
  id: string;
  violationId: string;
  
  // Images
  originalImage: {
    path: string;
    hash: string;
    size: number;
    uploadedAt: Date;
  };
  
  annotatedImage: {
    path: string;
    hash: string;
    size: number;
    createdAt: Date;
  };
  
  // Extracted Data
  detectionData: {
    helmetDetections: Array<{
      confidence: number;
      bbox: [number, number, number, number];
    }>;
    licensePlateData: {
      text: string;
      confidence: number;
      bbox: [number, number, number, number];
    };
  };
  
  // Access Log
  accessLog: Array<{
    userId: string;
    accessedAt: Date;
    action: "view" | "download" | "verify";
  }>;
  
  // Retention
  createdAt: Date;
  retentionUntil: Date;  // 7 years from creation
}
```

## Error Handling

### Image Processing Errors
- **Invalid Format**: Return 400 with message "Unsupported image format"
- **File Too Large**: Return 413 with message "Image exceeds 10MB limit"
- **Corrupted Image**: Return 422 with message "Image file is corrupted"

### Detection Errors
- **Low Confidence**: Flag for manual review if confidence < 0.70
- **Multiple Violations**: Process each violation separately
- **No Violations Detected**: Return empty result, no report generated

### OCR Errors
- **Unreadable Plate**: Flag for manual review
- **Invalid Format**: Attempt alternative OCR parameters
- **Multiple Plates**: Associate each plate with detected motorcycle

### Blockchain Errors
- **Transaction Failed**: Retry up to 3 times with exponential backoff
- **Network Unavailable**: Queue for later processing
- **Gas Limit Exceeded**: Log error and alert admin

## Testing Strategy

### Unit Tests
- Test image validation logic
- Test license plate format validation
- Test penalty calculation algorithms
- Test violation ID generation
- Test evidence package creation

### Property-Based Tests
- **Property 1**: Helmet detection consistency - For any image with helmeted riders, detection should return 0 violations
- **Property 2**: License plate format validation - For any extracted text, validation should correctly identify Indian format plates
- **Property 3**: Evidence integrity - For any stored evidence package, cryptographic hash should match original data
- **Property 4**: Violation ID uniqueness - For any two violations, generated IDs should be unique
- **Property 5**: Annotation round-trip - For any violation, annotated image should contain all original image data plus annotations

### Integration Tests
- Test end-to-end violation detection flow
- Test admin approval workflow
- Test blockchain logging
- Test database persistence
- Test concurrent image processing

### Performance Tests
- Load test with 100 concurrent image uploads
- Measure average detection time (target: < 5s)
- Measure OCR accuracy on diverse plate images
- Measure blockchain transaction confirmation time

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Helmet Detection Accuracy
**For any** image containing motorcycles with ground truth labels, the helmet detection model should identify riders without helmets with at least 85% accuracy.

**Validates: Requirements 1.1, 6.2**

### Property 2: License Plate Format Validation
**For any** extracted license plate text, the validation function should correctly identify whether it matches the Indian vehicle registration format (XX-XX-XX-XXXX).

**Validates: Requirements 2.1, 2.2**

### Property 3: Violation Detection Triggers OCR
**For any** detected helmet violation, the system should automatically trigger the OCR service to extract the license plate from the motorcycle region.

**Validates: Requirements 1.2**

### Property 4: Failed OCR Flags for Review
**For any** violation where license plate extraction fails, the violation should be flagged with status "pending_manual_review" and remain in the admin queue.

**Validates: Requirements 1.3**

### Property 5: Violation Report Completeness
**For any** confirmed violation, the generated Violation_Report should contain all required fields: violation type, timestamp, location, license plate, and evidence images.

**Validates: Requirements 3.1**

### Property 6: Evidence Integrity Verification
**For any** stored evidence package, the cryptographic hash should match the hash of the original data, ensuring no tampering or corruption.

**Validates: Requirements 5.2, 5.5**

### Property 7: Violation ID Uniqueness
**For any** two violations created in the system, their assigned violation IDs should be unique and follow the format VIO-YYYYMMDD-XXXXX.

**Validates: Requirements 3.4**

### Property 8: Annotation Preservation
**For any** violation image, the annotated version should preserve all original image data plus add annotation overlays without data loss.

**Validates: Requirements 3.3, 5.1**

### Property 9: Blockchain Audit Trail Immutability
**For any** violation action (creation, approval, rejection), the blockchain log should record the action with timestamp and actor information that cannot be modified.

**Validates: Requirements 3.5, 5.5**

### Property 10: Admin Approval State Transition
**For any** violation, once approved by an admin, the violation status should transition to "approved" and remain immutable until resolution.

**Validates: Requirements 4.3, 4.4**

### Property 11: Rejection Reason Persistence
**For any** rejected violation, the rejection reason should be stored and the violation should be removed from the active processing queue.

**Validates: Requirements 4.4**

### Property 12: Concurrent Processing Isolation
**For any** set of concurrent image uploads, each violation should be processed independently without interference, and all violations should be correctly stored.

**Validates: Requirements 6.5**

### Property 13: Violation-to-Issue Integration
**For any** traffic violation detected, a corresponding issue should be created in the main platform database with appropriate categorization.

**Validates: Requirements 7.1**

### Property 14: Blockchain Infrastructure Reuse
**For any** violation action, the system should use the existing blockchain logging infrastructure without creating separate logging mechanisms.

**Validates: Requirements 7.2**

### Property 15: Proof of Fix Workflow Consistency
**For any** resolved violation, the resolution should follow the same "proof of fix" workflow as regular civic issues, requiring photographic evidence.

**Validates: Requirements 7.5**
