import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('[Auth] Register request received:', req.body.username);
        const { name, username, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword,
            joinDate: new Date().toLocaleDateString('en-GB'),
            role: 'employee',
            accountStatus: 'pending', // New users need admin approval
        });

        await newUser.save();

        // Return success message indicating pending approval
        res.status(201).json({
            success: true,
            message: 'Registration successful! Your account is pending admin approval.',
            pending: true,
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                accountStatus: 'pending',
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username' });
        }

        // Check password with bcrypt (fallback to plain text comparison for old users)
        let isPasswordValid = false;
        if (user.password?.startsWith('$2')) {
            // Password is hashed with bcrypt
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            // Plain text password (legacy)
            isPasswordValid = password === user.password;
        }
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Check account status (treat undefined as approved for backward compatibility)
        const status = user.accountStatus || 'approved';

        if (status === 'pending') {
            return res.status(403).json({
                message: 'Your account is pending admin approval. Please wait for approval.',
                accountStatus: 'pending'
            });
        }

        if (status === 'rejected') {
            return res.status(403).json({
                message: 'Your account registration was rejected. Please contact admin.',
                accountStatus: 'rejected'
            });
        }

        const userResponse = {
            id: user._id,
            name: user.name,
            username: user.username,
            storeLocation: user.storeLocation,
            joinDate: user.joinDate,
            role: user.role || 'employee',
            accountStatus: user.accountStatus,
            assignedStore: user.assignedStore,
        };

        console.log('Login successful for:', user.username, 'Role:', user.role);
        res.json(userResponse);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

export default router;
