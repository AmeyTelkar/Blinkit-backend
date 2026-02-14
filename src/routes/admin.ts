import express, { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Attendance from '../models/Attendance';
import Certificate from '../models/Certificate';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
            return res.status(401).json({ message: 'User ID required' });
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /admin/employees - Get all employees
router.get('/employees', requireAdmin, async (req: Request, res: Response) => {
    try {
        const employees = await User.find({ role: 'employee' })
            .select('-password')
            .sort({ name: 1 });

        res.json({
            success: true,
            count: employees.length,
            employees,
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Failed to fetch employees' });
    }
});

// GET /admin/employees/all - Get all users (including admins)
router.get('/employees/all', requireAdmin, async (req: Request, res: Response) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ role: 1, name: 1 });

        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// GET /admin/attendance - Get all attendance records
router.get('/attendance', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { date, userId } = req.query;

        let query: any = {};
        if (date) query.date = date;
        if (userId) query.userId = userId;

        const records = await Attendance.find(query)
            .sort({ createdAt: -1 })
            .limit(500);

        // Get user names for records
        const userIds = [...new Set(records.map(r => r.userId))];
        const users = await User.find({ _id: { $in: userIds } }).select('name username');
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const enrichedRecords = records.map(record => ({
            ...record.toObject(),
            userName: userMap.get(record.userId)?.name || 'Unknown',
            userUsername: userMap.get(record.userId)?.username || 'unknown',
        }));

        res.json({
            success: true,
            count: enrichedRecords.length,
            records: enrichedRecords,
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Failed to fetch attendance records' });
    }
});

// GET /admin/attendance/:userId - Get specific user's attendance
router.get('/attendance/:userId', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const records = await Attendance.find({ userId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            user,
            records,
        });
    } catch (error) {
        console.error('Error fetching user attendance:', error);
        res.status(500).json({ message: 'Failed to fetch user attendance' });
    }
});

// GET /admin/stats - Get admin dashboard statistics
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
        const today = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'numeric',
            year: 'numeric',
        });

        const totalEmployees = await User.countDocuments({ role: 'employee' });

        // Get today's check-ins
        const todayRecords = await Attendance.find({ date: today });
        const checkedInToday = new Set(todayRecords.map(r => r.userId)).size;

        // Currently checked in (have checkInTime but no checkOutTime today)
        const currentlyCheckedIn = todayRecords.filter(r => !r.checkOutTime).length;

        // Total hours today
        const totalHoursToday = todayRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

        res.json({
            success: true,
            stats: {
                totalEmployees,
                checkedInToday,
                currentlyCheckedIn,
                totalHoursToday: Math.round(totalHoursToday * 10) / 10,
                date: today,
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

// PUT /admin/employees/:userId/assign-store - Assign store to employee
router.put('/employees/:userId/assign-store', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { assignedStore } = req.body;

        if (!assignedStore || !assignedStore.name || !assignedStore.city ||
            assignedStore.latitude === undefined || assignedStore.longitude === undefined) {
            return res.status(400).json({ message: 'Invalid store data' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { assignedStore },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Store assigned successfully',
            user,
        });
    } catch (error) {
        console.error('Error assigning store:', error);
        res.status(500).json({ message: 'Failed to assign store' });
    }
});

// DELETE /admin/employees/:userId - Delete an employee
router.delete('/employees/:userId', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const adminId = req.headers['x-user-id'] as string;

        // Prevent admin from deleting themselves
        if (userId === adminId) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting other admins
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin users' });
        }

        // Delete user's attendance records first
        await Attendance.deleteMany({ userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'Employee and their attendance records deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Failed to delete employee' });
    }
});

// DELETE /admin/attendance/:recordId - Delete an attendance record
router.delete('/attendance/:recordId', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { recordId } = req.params;

        const record = await Attendance.findById(recordId);
        if (!record) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        await Attendance.findByIdAndDelete(recordId);

        res.json({
            success: true,
            message: 'Attendance record deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        res.status(500).json({ message: 'Failed to delete attendance record' });
    }
});

// GET /admin/pending-users - Get all users pending approval
router.get('/pending-users', requireAdmin, async (req: Request, res: Response) => {
    try {
        console.log('[Admin] Fetching pending users...');
        const pendingUsers = await User.find({ accountStatus: 'pending' })
            .select('-password')
            .sort({ joinDate: -1 });

        res.json({
            success: true,
            count: pendingUsers.length,
            users: pendingUsers,
        });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Failed to fetch pending users' });
    }
});

// PUT /admin/users/:userId/approve - Approve a user registration
router.put('/users/:userId/approve', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.accountStatus === 'approved') {
            return res.status(400).json({ message: 'User is already approved' });
        }

        user.accountStatus = 'approved';
        await user.save();

        res.json({
            success: true,
            message: `User ${user.name} has been approved`,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                accountStatus: user.accountStatus,
            },
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Failed to approve user' });
    }
});

// PUT /admin/users/:userId/reject - Reject a user registration
router.put('/users/:userId/reject', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.accountStatus === 'rejected') {
            return res.status(400).json({ message: 'User is already rejected' });
        }

        user.accountStatus = 'rejected';
        await user.save();

        res.json({
            success: true,
            message: `User ${user.name} has been rejected`,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                accountStatus: user.accountStatus,
            },
        });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ message: 'Failed to reject user' });
    }
});

// PUT /admin/users/:userId/reset-password - Reset user password
router.put('/users/:userId/reset-password', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Import bcrypt for password hashing
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.json({
            success: true,
            message: `Password reset successfully for ${user.name}`,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
            },
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

// ==================== CERTIFICATE ROUTES ====================

// POST /admin/certificates - Generate a certificate for an employee
router.post('/certificates', requireAdmin, async (req: Request, res: Response) => {
    try {
        const adminId = req.headers['x-user-id'] as string;
        const {
            employeeId,
            certificateType,
            duration,
            customMessage,
            signature
        } = req.body;

        // Validate required fields
        if (!employeeId || !duration) {
            return res.status(400).json({ message: 'Employee ID and duration are required' });
        }

        // Get employee details
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get admin details for signature
        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Create certificate
        const certificate = new Certificate({
            employeeId: employee._id,
            employeeName: employee.name,
            employeeUsername: employee.username,
            certificateType: certificateType || 'experience',
            duration,
            customMessage: customMessage || '',
            issuedBy: admin.name,
            signature: signature || admin.name,
            storeName: employee.assignedStore?.name || 'Blinkit Store',
            storeLocation: employee.assignedStore?.city || 'India'
        });

        await certificate.save();

        res.status(201).json({
            success: true,
            message: 'Certificate generated successfully',
            certificate
        });
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ message: 'Failed to generate certificate' });
    }
});

// GET /admin/certificates - Get all certificates
router.get('/certificates', requireAdmin, async (req: Request, res: Response) => {
    try {
        const certificates = await Certificate.find()
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: certificates.length,
            certificates
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Failed to fetch certificates' });
    }
});

// GET /admin/certificates/:employeeId - Get certificates for specific employee
router.get('/certificates/employee/:employeeId', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        const certificates = await Certificate.find({ employeeId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: certificates.length,
            certificates
        });
    } catch (error) {
        console.error('Error fetching employee certificates:', error);
        res.status(500).json({ message: 'Failed to fetch employee certificates' });
    }
});

// DELETE /admin/certificates/:certificateId - Revoke/Delete a certificate
router.delete('/certificates/:certificateId', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findById(certificateId);
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        await Certificate.findByIdAndDelete(certificateId);

        res.json({
            success: true,
            message: 'Certificate revoked successfully'
        });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ message: 'Failed to delete certificate' });
    }
});

// GET /admin/certificates/verify/:code - Verify certificate by code
router.get('/certificates/verify/:code', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;

        const certificate = await Certificate.findOne({ verificationCode: code });
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found or invalid verification code'
            });
        }

        res.json({
            success: true,
            verified: true,
            certificate: {
                employeeName: certificate.employeeName,
                certificateType: certificate.certificateType,
                duration: certificate.duration,
                issueDate: certificate.issueDate,
                issuedBy: certificate.issuedBy,
                storeName: certificate.storeName
            }
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ message: 'Failed to verify certificate' });
    }
});

export default router;
