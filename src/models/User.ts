import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignedStore {
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    radius: number;
}

export interface IUser extends Document {
    name: string;
    username: string;
    password?: string;
    storeLocation: string;
    joinDate: string;
    profilePhoto?: string;
    role: 'employee' | 'admin';
    accountStatus: 'pending' | 'approved' | 'rejected';
    assignedStore?: IAssignedStore;
    phone?: string;
}

const AssignedStoreSchema: Schema = new Schema({
    name: { type: String, required: true },
    address: { type: String, default: '' },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, default: 100 },
}, { _id: false });

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    storeLocation: { type: String, default: 'Blinkit Store' },
    joinDate: { type: String, required: true },
    profilePhoto: { type: String, default: '' },
    role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
    accountStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    assignedStore: { type: AssignedStoreSchema, default: null },
    phone: { type: String, default: '' },
});

export default mongoose.model<IUser>('User', UserSchema);

