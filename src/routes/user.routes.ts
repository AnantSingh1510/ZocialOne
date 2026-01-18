import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Complaint } from '../entities/Complaint';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const complaintRepository = AppDataSource.getRepository(Complaint);

router.get('/user/details', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userRepository.findOne({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const complaintsCount = await complaintRepository.count({
      where: { user_id: user.id }
    });

    const onboardingComplete = user.onboarding_stage >= 3;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      onboarding_stage: user.onboarding_stage,
      complaints_count: complaintsCount,
      onboarding_complete: onboardingComplete
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;