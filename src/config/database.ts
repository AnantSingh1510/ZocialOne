import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Complaint } from '../entities/Complaint';
import { Notification } from '../entities/Notification';
import { OnboardingReminder } from '../entities/OnboardingReminder';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'zocialone_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Complaint, Notification, OnboardingReminder],
  migrations: [],
  subscribers: [],
});