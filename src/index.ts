import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blinkit-attendance';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import profileRoutes from './routes/profile';
import adminRoutes from './routes/admin';
import certificateRoutes from './routes/certificates';

app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/certificates', certificateRoutes);


// Health Check
app.get('/', (req, res) => {
    res.send('Blinkit Attendance Backend is Running');
});

// Seed default admin user
async function seedAdminUser() {
    try {
        const adminUsername = 'admin@blinkit.com';
        const adminPassword = 'Admin@123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: adminUsername });

        if (existingAdmin) {
            console.log('✓ Admin user already exists:', adminUsername);
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = new User({
            name: 'Blinkit Admin',
            username: adminUsername,
            password: hashedPassword,
            storeLocation: 'All Stores',
            joinDate: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'numeric',
                year: 'numeric',
            }),
            role: 'admin',
            accountStatus: 'approved', // Admin is auto-approved
            assignedStore: {
                name: 'Blinkit HQ',
                address: 'Gurugram, Haryana',
                city: 'Gurugram',
                latitude: 28.4595,
                longitude: 77.0266,
                radius: 500,
            },
        });

        await admin.save();
        console.log('✓ Admin user created successfully!');
        console.log('  Username:', adminUsername);
        console.log('  Password:', adminPassword);

    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
}

// Database Connection
mongoose
    .connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Seed admin user
        await seedAdminUser();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
