import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('onboarding_reminders')
export class OnboardingReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'int' })
  stage: number;

  @Column({ type: 'int' })
  reminder_level: number;

  @Column({ type: 'timestamp' })
  sent_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, user => user.onboarding_reminders)
  @JoinColumn({ name: 'user_id' })
  user: User;
}