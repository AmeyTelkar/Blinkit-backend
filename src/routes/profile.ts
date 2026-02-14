import express from 'express';
import User from '../models/User';

const router = express.Router();

// Get Profile
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            username: user.username,
            storeLocation: user.storeLocation,
            joinDate: user.joinDate,
            profilePhoto: user.profilePhoto || '',
            phone: user.phone || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update Profile Info
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, phone } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            username: user.username,
            storeLocation: user.storeLocation,
            joinDate: user.joinDate,
            profilePhoto: user.profilePhoto || '',
            phone: user.phone || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update Profile Photo
router.put('/:userId/photo', async (req, res) => {
    try {
        const { userId } = req.params;
        const { profilePhoto } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { profilePhoto },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            username: user.username,
            storeLocation: user.storeLocation,
            joinDate: user.joinDate,
            profilePhoto: user.profilePhoto || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete Profile Photo
router.delete('/:userId/photo', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { profilePhoto: '' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile photo deleted', profilePhoto: '' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

export default router;
