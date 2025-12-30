# 🏗️ Civic Lens Architecture Overview

## System Architecture

Civic Lens follows a modern, microservices-inspired architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ • User Portal   │    │ • Server Actions│    │ • Duplicate Det │
│ • Admin Dashboard│    │ • API Routes    │    │ • OCR Services  │
│ • Public View   │    │ • Auth Logic    │    │ • Violation Det │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Blockchain    │    │   File Storage  │
│   (MongoDB)     │    │   (Polygon)     │    │   (Local/IPFS)  │
│                 │    │                 │    │                 │
│ • Users         │    │ • Smart Contract│    │ • Images        │
│ • Issues        │    │ • Transaction Log│    │ • Documents     │
│ • Transactions  │    │ • Audit Trail   │    │ • ML Models     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Details

### Frontend Layer (Next.js 15)
**Location**: `src/app/`
- **User Portal**: Issue submission, status tracking, profile management
- **Admin Dashboard**: Issue review, resolution workflow, analytics
- **Public Interface**: Transparent view of all issues and resolutions
- **Technology**: React Server Components, TypeScript, Tailwind CSS

### Backend Layer (Node.js)
**Location**: `src/server/`
- **Server Actions**: Business logic for CRUD operations
- **API Routes**: RESTful endpoints for external integrations
- **Authentication**: JWT + voter verification system
- **Blockchain Integration**: Smart contract interactions via Ethers.js

### AI Services Layer (Python)
**Location**: `python_backend/` & `ml/`
- **Duplicate Detection**: BERT embeddings + perceptual hashing
- **OCR Services**: Voter ID and license plate text extraction
- **Violation Detection**: YOLO-based computer vision
- **Communication**: FastAPI server with REST endpoints

### Data Layer
**Database (MongoDB)**
- **Users**: Authentication, profiles, permissions
- **Issues**: Reports, metadata, status tracking
- **Transactions**: Blockchain transaction hashes and logs

**Blockchain (Polygon)**
- **Smart Contracts**: Immutable action logging
- **Transaction History**: Audit trail for admin actions
- **Verification**: Public proof of administrative decisions

## Data Flow Patterns

### 1. Issue Submission Flow
```
User Upload → Image Processing → Duplicate Check → Database Storage → Blockchain Log
     ↓              ↓               ↓                ↓                ↓
  Frontend    →  AI Service   →  Backend      →   MongoDB      →   Polygon
```

### 2. Admin Resolution Flow
```
Admin Action → Verification → Proof Upload → Database Update → Blockchain Record
     ↓             ↓             ↓              ↓                ↓
  Dashboard   →  Auth Check  →  File Store  →  MongoDB     →   Smart Contract
```

### 3. Public Verification Flow
```
Public Query → Database Lookup → Blockchain Verification → Display Results
     ↓              ↓                    ↓                     ↓
  Frontend    →    MongoDB         →   Polygon           →   UI Component
```

## Security Architecture

### Authentication & Authorization
- **Multi-layer Verification**: Email + Voter ID + Blockchain wallet
- **Role-based Access**: Citizen, Admin, Super Admin permissions
- **Session Management**: JWT tokens with refresh mechanism

### Data Protection
- **Encryption at Rest**: MongoDB encryption + file system encryption
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Privacy**: PII anonymization in public views

### Blockchain Security
- **Private Key Management**: Environment variables + HSM for production
- **Smart Contract Auditing**: Automated security scanning
- **Multi-signature**: Critical operations require multiple approvals

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: Vercel Edge Network for global distribution
- **Backend**: Stateless server actions for easy replication
- **AI Services**: Containerized Python services with load balancing
- **Database**: MongoDB sharding for large datasets

### Performance Optimization
- **Caching**: Redis for frequently accessed data
- **CDN**: Image and static asset distribution
- **Lazy Loading**: AI models loaded on-demand
- **Database Indexing**: Optimized queries for common operations

## Monitoring & Observability

### Application Monitoring
- **Error Tracking**: Sentry integration
- **Performance Metrics**: Custom dashboards
- **User Analytics**: Privacy-compliant usage tracking

### Infrastructure Monitoring
- **Server Health**: CPU, memory, disk usage
- **Database Performance**: Query optimization
- **Blockchain Status**: Transaction success rates
- **AI Service Metrics**: Processing times and accuracy
