import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    hoursWorked: number;
    method: string;
    status: string;
    checkInPhoto?: string;
    checkOutPhoto?: string;
}

const AttendanceSchema: Schema = new Schema({
    userId: { type: String, required: true },
    date: { type: String, required: true },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String },
    hoursWorked: { type: Number, default: 0 },
    method: { type: String, required: true },
    status: { type: String, required: true },
    checkInPhoto: { type: String },
    checkOutPhoto: { type: String },
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
