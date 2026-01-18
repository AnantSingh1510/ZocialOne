import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Complaint, ComplaintType, ComplaintStatus } from '../entities/Complaint';
import { validateComplaintData, isValidStatusTransition } from '../validators/complaint.validator';
import NotificationService from '../services/NotificationService';

const router = Router();
const complaintRepository = AppDataSource.getRepository(Complaint);

router.post('/complaints',
  authenticate,
  [
    body('complaint_type').isIn(Object.values(ComplaintType)).withMessage('Invalid complaint type')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { complaint_type, ...additionalData } = req.body;

      const validation = validateComplaintData(complaint_type, additionalData);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const initialStatus = complaint_type === ComplaintType.LIVE_DEMO 
        ? ComplaintStatus.IN_PROGRESS 
        : ComplaintStatus.RAISED;

      const complaint = complaintRepository.create({
        user_id: req.userId!,
        complaint_type,
        status: initialStatus,
        additional_data: additionalData,
        status_updated_at: new Date()
      });

      await complaintRepository.save(complaint);

      if (initialStatus === ComplaintStatus.IN_PROGRESS) {
        await NotificationService.sendComplaintStatusNotification(
          req.userId!,
          ComplaintStatus.IN_PROGRESS,
          complaint.id
        );
      }

      res.status(201).json({
        message: 'Complaint created successfully',
        complaint: {
          id: complaint.id,
          complaint_type: complaint.complaint_type,
          status: complaint.status,
          created_at: complaint.created_at
        }
      });
    } catch (error) {
      console.error('Create complaint error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.patch('/complaints/:id/status',
  authenticate,
  [
    body('status').isIn(Object.values(ComplaintStatus)).withMessage('Invalid status')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const complaintId = parseInt(req.params.id);
      const { status: newStatus } = req.body;

      const complaint = await complaintRepository.findOne({
        where: { id: complaintId, user_id: req.userId }
      });

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      if (!isValidStatusTransition(complaint.status, newStatus)) {
        return res.status(400).json({
          error: `Invalid status transition from ${complaint.status} to ${newStatus}`
        });
      }

      const oldStatus = complaint.status;
      complaint.status = newStatus;
      complaint.status_updated_at = new Date();

      await complaintRepository.save(complaint);

      if (newStatus === ComplaintStatus.IN_PROGRESS || newStatus === ComplaintStatus.RESOLVED) {
        await NotificationService.sendComplaintStatusNotification(
          req.userId!,
          newStatus,
          complaint.id
        );
      }

      res.json({
        message: 'Complaint status updated successfully',
        complaint: {
          id: complaint.id,
          old_status: oldStatus,
          new_status: complaint.status,
          status_updated_at: complaint.status_updated_at
        }
      });
    } catch (error) {
      console.error('Update complaint status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/complaints/:id/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const complaintId = parseInt(req.params.id);

    const complaint = await complaintRepository.findOne({
      where: { id: complaintId, user_id: req.userId }
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const now = new Date();

    const totalTimeMs = now.getTime() - new Date(complaint.created_at).getTime();
    const totalTimeMinutes = Math.floor(totalTimeMs / (1000 * 60));

    const statusTimeMs = now.getTime() - new Date(complaint.status_updated_at).getTime();
    const timeInCurrentStatusMinutes = Math.floor(statusTimeMs / (1000 * 60));

    res.json({
      complaint_id: complaint.id,
      current_status: complaint.status,
      time_in_current_status_minutes: timeInCurrentStatusMinutes,
      total_time_minutes: totalTimeMinutes
    });
  } catch (error) {
    console.error('Get complaint metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;