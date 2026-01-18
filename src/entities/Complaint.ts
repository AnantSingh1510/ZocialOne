import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum ComplaintType {
  LIVE_DEMO = 'live_demo',
  BILLING_ISSUE = 'billing_issue',
  TECHNICAL_ISSUE = 'technical_issue',
  FEEDBACK = 'feedback'
}

export enum ComplaintStatus {
  RAISED = 'raised',
  IN_PROGRESS = 'in_progress',
  WAITING_ON_USER = 'waiting_on_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({
    type: 'enum',
    enum: ComplaintType
  })
  complaint_type: ComplaintType;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.RAISED
  })
  status: ComplaintStatus;

  @Column({ type: 'jsonb', nullable: true })
  additional_data: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  status_updated_at: Date;

  @ManyToOne(() => User, user => user.complaints)
  @JoinColumn({ name: 'user_id' })
  user: User;
}