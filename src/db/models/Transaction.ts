import mongoose, { Schema, Document } from 'mongoose';

// --- BLOCKCHAIN TRANSACTION ---
export interface IBlockchainTransaction extends Document {
    tx_hash: string;
    issue_id: string;
    admin_id: string;
    status: string;
    timestamp: Date;
    explorer_url?: string;
}

const BlockchainTransactionSchema = new Schema<IBlockchainTransaction>({
    tx_hash: { type: String, required: true }, // Not PK required, but usually unique
    issue_id: { type: String, ref: 'Issue', required: true },
    admin_id: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    explorer_url: { type: String }
});

export const BlockchainTransaction = mongoose.models.BlockchainTransaction || mongoose.model<IBlockchainTransaction>('BlockchainTransaction', BlockchainTransactionSchema);


// --- RESOLUTION EVIDENCE ---
export interface IResolutionEvidence extends Document {
    issue_id: string;
    admin_id: string;
    image_url: string;
    notes?: string;
    timestamp: Date;
}

const ResolutionEvidenceSchema = new Schema<IResolutionEvidence>({
    issue_id: { type: String, ref: 'Issue', required: true },
    admin_id: { type: String, required: true },
    image_url: { type: String, required: true },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now }
});

export const ResolutionEvidence = mongoose.models.ResolutionEvidence || mongoose.model<IResolutionEvidence>('ResolutionEvidence', ResolutionEvidenceSchema);
