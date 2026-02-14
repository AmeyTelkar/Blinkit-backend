import express from 'express';
import Attendance from '../models/Attendance';

const router = express.Router();

// Get Attendance Records
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const records = await Attendance.find({ userId });

        // Map _id to id for frontend compatibility
        const formattedRecords = records.map(record => ({
            ...record.toObject(),
            id: record._id
        }));

        res.json(formattedRecords);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Mark Attendance (Check-in / Check-out)
router.post('/', async (req, res) => {
    try {
        const { userId, date, checkInTime, checkOutTime, hoursWorked, method, status, checkInPhoto, checkOutPhoto, id } = req.body;

        if (id) {
            // Update existing record (Check-out)
            const updatedRecord = await Attendance.findByIdAndUpdate(
                id,
                {
                    checkOutTime,
                    hoursWorked,
                    checkOutPhoto,
                    status
                },
                { new: true }
            );

            if (!updatedRecord) {
                return res.status(404).json({ message: 'Record not found' });
            }

            const response = {
                ...updatedRecord.toObject(),
                id: updatedRecord._id
            };

            res.json(response);
        } else {
            // Create new record (Check-in)
            const newRecord = new Attendance({
                userId,
                date,
                checkInTime,
                checkOutTime,
                hoursWorked,
                method,
                status,
                checkInPhoto
            });

            await newRecord.save();

            const response = {
                ...newRecord.toObject(),
                id: newRecord._id
            };

            res.status(201).json(response);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete Record
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Attendance.findByIdAndDelete(id);
        res.json({ message: 'Record deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

export default router;
