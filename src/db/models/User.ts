import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Omit<Document, '_id'> {
    _id: string; // user-XXXX
    email: string;
    password: string;
    name: string;
    avatar_url?: string;
    voter_id_front_url?: string;
    voter_id_back_url?: string;
    role: string;
    created_at: Date;
}

const UserSchema = new Schema<IUser>({
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    avatar_url: { type: String },
    voter_id_front_url: { type: String },
    voter_id_back_url: { type: String },
    role: { type: String, default: 'user' },
    created_at: { type: Date, default: Date.now },
}, {
    _id: false, // We provide our own _id
    timestamps: false // We manage created_at or use default
});

// Avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
