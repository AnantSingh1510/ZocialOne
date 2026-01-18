import cron from 'node-cron';
import OnboardingReminderService from '../services/OnboardingReminderService';

export const startOnboardingCron = (): void => {
  // Default: run every 10 minutes
  // Format: */10 * * * * (every 10 minutes) - By Anant
  const schedule = process.env.CRON_SCHEDULE || '*/10 * * * *';

  cron.schedule(schedule, async () => {
    try {
      await OnboardingReminderService.processReminders();
    } catch (error) {
      console.error('Error in onboarding cron job:', error);
    }
  });

  console.log(`Onboarding reminder cron scheduled: ${schedule}`);
};