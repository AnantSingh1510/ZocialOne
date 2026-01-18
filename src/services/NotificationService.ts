import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { ComplaintStatus } from '../entities/Complaint';

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);

  async sendComplaintStatusNotification(userId: number, status: ComplaintStatus, complaintId: number): Promise<void> {
    const { title, body } = this.getNotificationContent(status, complaintId);

    const notification = this.notificationRepository.create({
      user_id: userId,
      title,
      body,
      is_sent: false
    });

    await this.notificationRepository.save(notification);

    this.mockEmailSend(notification);

    notification.is_sent = true;
    await this.notificationRepository.save(notification);
  }

  async sendOnboardingReminder(userId: number, stage: number, reminderLevel: number): Promise<void> {
    const { title, body } = this.getOnboardingReminderContent(stage, reminderLevel);

    const notification = this.notificationRepository.create({
      user_id: userId,
      title,
      body,
      is_sent: false
    });

    await this.notificationRepository.save(notification);

    // Mock email sending
    this.mockEmailSend(notification);

    // Mark as sent
    notification.is_sent = true;
    await this.notificationRepository.save(notification);
  }

  private getNotificationContent(status: ComplaintStatus, complaintId: number): { title: string; body: string } {
    switch (status) {
      case ComplaintStatus.IN_PROGRESS:
        return {
          title: 'Complaint in progress',
          body: `Complaint #${complaintId} is now being worked on.`
        };
      
      case ComplaintStatus.RESOLVED:
        return {
          title: 'Complaint resolved',
          body: `Complaint #${complaintId} has been resolved.`
        };
      
      default:
        return {
          title: 'Status updated',
          body: `Complaint #${complaintId} status changed.`
        };
    }
  }

  private getOnboardingReminderContent(stage: number, reminderLevel: number): { title: string; body: string } {
    const content: Record<number, Record<number, { title: string; body: string }>> = {
      0: {
        1: {
          title: 'Complete your profile',
          body: 'You signed up 24 hours ago. Please complete your profile to get started.'
        },
        2: {
          title: 'Profile incomplete',
          body: 'It has been 3 days. Complete Stage 0 to continue.'
        },
        3: {
          title: 'Finish setup',
          body: '5 days passed. Complete your setup to start using features.'
        }
      },
      1: {
        1: {
          title: 'Connect social accounts',
          body: 'Stage 0 done. Connect your social media accounts now.'
        },
        2: {
          title: 'Account connection pending',
          body: 'Connect at least one platform to proceed.'
        }
      },
      2: {
        1: {
          title: 'Create first campaign',
          body: 'Accounts connected. Create your first campaign.'
        },
        2: {
          title: 'Campaign pending',
          body: 'Start creating your campaign to complete onboarding.'
        },
        3: {
          title: 'Complete onboarding',
          body: '3 days in Stage 2. Create a campaign to finish setup.'
        },
        4: {
          title: 'Final reminder',
          body: 'Complete your campaign setup to start using all features.'
        }
      }
    };

    return content[stage]?.[reminderLevel] || {
      title: 'Onboarding Reminder',
      body: 'Please complete your onboarding to unlock all features.'
    };
  }

  private mockEmailSend(notification: Notification): void {
    console.log('\nEMAIL NOTIFICATION');
    console.log('═'.repeat(50));
    console.log(`To: User ID ${notification.user_id}`);
    console.log(`Subject: ${notification.title}`);
    console.log(`Body: ${notification.body}`);
    console.log(`Sent At: ${new Date().toISOString()}`);
    console.log('═'.repeat(50) + '\n');
  }
}

export default new NotificationService();