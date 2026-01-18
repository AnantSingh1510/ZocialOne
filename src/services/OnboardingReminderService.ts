import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { OnboardingReminder } from '../entities/OnboardingReminder';
import NotificationService from './NotificationService';
import { LessThan, MoreThan } from 'typeorm';

export class OnboardingReminderService {
  private userRepository = AppDataSource.getRepository(User);
  private reminderRepository = AppDataSource.getRepository(OnboardingReminder);

  private readonly REMINDER_SCHEDULES: Record<number, number[]> = {
    0: [24, 72, 120],      // 24h, 3d, 5d
    1: [12, 24],           // 12h, 24h
    2: [24, 24, 72, 120]   // 24h, 1d, 3d, 5d 
  }; // Comment by Anant, not by AI, setting reminder schedules here

  async processReminders(): Promise<void> {
    console.log(`\nOnboarding reminder check - ${new Date().toISOString()}`);
    
    const users = await this.userRepository.find({
      where: {
        onboarding_stage: LessThan(3)
      }
    });

    console.log(`Found ${users.length} users in onboarding stages - active`);

    for (const user of users) {
      await this.checkAndSendReminders(user);
    }
  }

  private async checkAndSendReminders(user: User): Promise<void> {
    const stage = user.onboarding_stage;
    const reminderSchedule = this.REMINDER_SCHEDULES[stage];

    if (!reminderSchedule) {
      return;
    }
    const sentReminders = await this.reminderRepository.find({
      where: {
        user_id: user.id,
        stage: stage
      }
    });

    const sentReminderLevels = new Set(sentReminders.map(r => r.reminder_level));
    const hoursSinceStageStart = this.getHoursSince(user.created_at);

    for (let level = 0; level < reminderSchedule.length; level++) {
      const reminderLevel = level + 1;
      const requiredHours = reminderSchedule[level];

      // Check if the reminder was already sent and time has exceeded - Anant
      if (!sentReminderLevels.has(reminderLevel) && hoursSinceStageStart >= requiredHours) {
        await this.sendReminder(user, stage, reminderLevel);
      }
    }
  }

  private async sendReminder(user: User, stage: number, reminderLevel: number): Promise<void> {
    console.log(`Sending Stage ${stage} Reminder ${reminderLevel} to User ${user.id} (${user.email})`);
    await NotificationService.sendOnboardingReminder(user.id, stage, reminderLevel);

    const reminder = this.reminderRepository.create({
      user_id: user.id,
      stage: stage,
      reminder_level: reminderLevel,
      sent_at: new Date()
    });

    await this.reminderRepository.save(reminder);
  }

  private getHoursSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    return diffMs / (1000 * 60 * 60);
  }

  // Helper method to manually update user's onboarding stage - testing - Anant
  async updateUserStage(userId: number, newStage: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    if (newStage < 0 || newStage > 2) {
      throw new Error('Invalid stage. Must be 0, 1, or 2');
    }

    user.onboarding_stage = newStage;
    await this.userRepository.save(user);

    console.log(`Updated User ${userId} to stage ${newStage}`);
  }
}

export default new OnboardingReminderService();