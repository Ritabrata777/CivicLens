import mongoose, { Document, Schema } from 'mongoose';

export interface ISOSAlert extends Omit<Document, '_id'> {
    _id: string;
    sender_id: string;
    emergency_type: string;
    details?: string;
    location_address: string;
    postal_code: string;
    location_lat?: number;
    location_lng?: number;
    status: string;
    notified_hero_ids: string[];
    accepted_by_id?: string;
    accepted_at?: Date;
    created_at: Date;
}

const SOSAlertSchema = new Schema<ISOSAlert>({
    _id: { type: String, required: true },
    sender_id: { type: String, required: true, ref: 'User' },
    emergency_type: { type: String, required: true },
    details: { type: String },
    location_address: { type: String, required: true },
    postal_code: { type: String, required: true, index: true },
    location_lat: { type: Number },
    location_lng: { type: Number },
    status: { type: String, default: 'Active' },
    notified_hero_ids: [{ type: String, ref: 'User' }],
    accepted_by_id: { type: String, ref: 'User' },
    accepted_at: { type: Date },
    created_at: { type: Date, default: Date.now },
}, { _id: false });

export interface IAppNotification extends Document {
    user_id: string;
    title: string;
    message: string;
    href: string;
    kind: string;
    related_issue_id?: string;
    related_sos_id?: string;
    created_at: Date;
}

const AppNotificationSchema = new Schema<IAppNotification>({
    user_id: { type: String, required: true, ref: 'User', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    href: { type: String, required: true },
    kind: { type: String, required: true },
    related_issue_id: { type: String },
    related_sos_id: { type: String },
    created_at: { type: Date, default: Date.now },
});

export const SOSAlert = mongoose.models.SOSAlert || mongoose.model<ISOSAlert>('SOSAlert', SOSAlertSchema);
export const AppNotification = mongoose.models.AppNotification || mongoose.model<IAppNotification>('AppNotification', AppNotificationSchema);
