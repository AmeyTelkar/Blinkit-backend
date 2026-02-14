import express, { Request, Response } from 'express';
import Certificate from '../models/Certificate';

const router = express.Router();

// GET /certificates - Get certificates for logged-in employee
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
            return res.status(401).json({ message: 'User ID required' });
        }

        const certificates = await Certificate.find({ employeeId: userId })
            .sort({ createdAt: -1 });

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

// GET /certificates/:id - Get specific certificate details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const { id } = req.params;

        const certificate = await Certificate.findOne({
            _id: id,
            employeeId: userId
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        res.json({
            success: true,
            certificate
        });
    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ message: 'Failed to fetch certificate' });
    }
});

export default router;
