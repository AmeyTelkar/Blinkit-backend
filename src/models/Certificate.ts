import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
    employeeId: mongoose.Types.ObjectId;
    employeeName: string;
    employeeUsername: string;
    certificateType: 'experience' | 'appreciation' | 'completion';
    duration: number; // in months
    customMessage: string;
    issueDate: Date;
    issuedBy: string;
    signature: string;
    verificationCode: string;
    storeName?: string;
    storeLocation?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>({
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeName: { type: String, required: true },
    employeeUsername: { type: String, required: true },
    certificateType: {
        type: String,
        enum: ['experience', 'appreciation', 'completion'],
        default: 'experience'
    },
    duration: { type: Number, required: true, min: 1, max: 60 },
    customMessage: { type: String, default: '' },
    issueDate: { type: Date, default: Date.now },
    issuedBy: { type: String, required: true },
    signature: { type: String, default: '' },
    verificationCode: {
        type: String,
        unique: true,
        default: () => 'BLNK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    },
    storeName: { type: String },
    storeLocation: { type: String }
}, { timestamps: true });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
