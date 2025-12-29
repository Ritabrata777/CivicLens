import mongoose, { Schema, Document } from 'mongoose';

// --- ISSUE ---
export interface IIssue extends Omit<Document, '_id'> {
    _id: string; // ISSUE-XXXX
    title: string;
    description: string;
    category: string;
    status: string;
    location_address?: string;
    location_lat?: number;
    location_lng?: number;
    image_url?: string;
    image_hint?: string;
    submitted_by: string; // Ref to User._id
    submitted_at: Date;
    upvotes: number;
    is_urgent: number; // 0 or 1 to match SQLite boolean logic, or we can switch to Boolean
    license_plate?: string;
    violation_type?: string;
}

const IssueSchema = new Schema<IIssue>({
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    location_address: { type: String },
    location_lat: { type: Number },
    location_lng: { type: Number },
    image_url: { type: String },
    image_hint: { type: String },
    submitted_by: { type: String, ref: 'User', required: true },
    submitted_at: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    is_urgent: { type: Number, default: 0 },
    license_plate: { type: String },
    violation_type: { type: String },
}, { _id: false });

export const Issue = mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);


// --- ISSUE UPDATE ---
export interface IIssueUpdate extends Document {
    issue_id: string;
    status: string;
    timestamp: Date;
    updated_by?: string;
    notes?: string;
}

const IssueUpdateSchema = new Schema<IIssueUpdate>({
    issue_id: { type: String, ref: 'Issue', required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updated_by: { type: String }, // Admin ID or User ID
    notes: { type: String },
});

export const IssueUpdate = mongoose.models.IssueUpdate || mongoose.model<IIssueUpdate>('IssueUpdate', IssueUpdateSchema);


// --- ISSUE UPVOTE ---
export interface IIssueUpvote extends Document {
    issue_id: string;
    user_id: string;
    timestamp: Date;
}

const IssueUpvoteSchema = new Schema<IIssueUpvote>({
    issue_id: { type: String, ref: 'Issue', required: true },
    user_id: { type: String, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now }
});

// Composite unique index
IssueUpvoteSchema.index({ issue_id: 1, user_id: 1 }, { unique: true });

export const IssueUpvote = mongoose.models.IssueUpvote || mongoose.model<IIssueUpvote>('IssueUpvote', IssueUpvoteSchema);
