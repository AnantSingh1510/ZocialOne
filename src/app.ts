import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import complaintRoutes from './routes/complaint.routes';
import { startOnboardingCron } from './jobs/onboarding.cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', complaintRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');
    
    // Start cron job for onboarding reminders
    startOnboardingCron();
    console.log('✅ Onboarding reminder cron job started');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

export default app;