import mongoose, { Document, Schema } from 'mongoose';

export interface IRewardClaim extends Omit<Document, '_id'> {
  _id: string;
  user_id: string;
  wallet_address: string;
  claim_units: number;
  points_redeemed: number;
  matic_amount: number;
  status: 'Pending' | 'Paid' | 'Rejected';
  requested_at: Date;
  reviewed_at?: Date;
  reviewed_by_id?: string;
  tx_hash?: string;
  payout_from_address?: string;
  note?: string;
}

const RewardClaimSchema = new Schema<IRewardClaim>({
  _id: { type: String, required: true },
  user_id: { type: String, required: true, ref: 'User', index: true },
  wallet_address: { type: String, required: true },
  claim_units: { type: Number, required: true, min: 1 },
  points_redeemed: { type: Number, required: true, min: 1 },
  matic_amount: { type: Number, required: true, min: 0 },
  status: { type: String, required: true, default: 'Pending', index: true },
  requested_at: { type: Date, default: Date.now },
  reviewed_at: { type: Date },
  reviewed_by_id: { type: String, ref: 'User' },
  tx_hash: { type: String },
  payout_from_address: { type: String },
  note: { type: String },
}, { _id: false });

RewardClaimSchema.index({ user_id: 1, status: 1 });
RewardClaimSchema.index({ requested_at: -1 });

export const RewardClaim = mongoose.models.RewardClaim || mongoose.model<IRewardClaim>('RewardClaim', RewardClaimSchema);
