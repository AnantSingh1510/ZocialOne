import { ComplaintType, ComplaintStatus } from '../entities/Complaint';

export interface LiveDemoData {
  preferred_date: string;
  preferred_time: string;
  business_name: string;
  contact_number: string;
  demo_type: string;
}

export interface TechnicalIssueData {
  module: string;
  platform: string;
  error_code?: string;
  issue_description: string;
  attachments?: string[];
}

export interface BillingIssueData {
  invoice_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  issue_reason: string;
}

export const validateComplaintData = (type: ComplaintType, data: any): { valid: boolean; error?: string } => {
  switch (type) {
    case ComplaintType.LIVE_DEMO:
      if (!data.preferred_date || !data.preferred_time) {
        return { valid: false, error: 'preferred_date and preferred_time are mandatory for live_demo' };
      }
      break;
    
    case ComplaintType.TECHNICAL_ISSUE:
      if (!data.issue_description) {
        return { valid: false, error: 'issue_description is mandatory for technical_issue' };
      }
      break;
    
    case ComplaintType.BILLING_ISSUE:
      if (!data.invoice_id || !data.amount) {
        return { valid: false, error: 'invoice_id and amount are mandatory for billing_issue' };
      }
      break;
  }
  
  return { valid: true };
};

export const VALID_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.RAISED]: [
    ComplaintStatus.IN_PROGRESS,
    ComplaintStatus.WAITING_ON_USER
  ],
  [ComplaintStatus.IN_PROGRESS]: [
    ComplaintStatus.WAITING_ON_USER,
    ComplaintStatus.RESOLVED
  ],
  [ComplaintStatus.WAITING_ON_USER]: [
    ComplaintStatus.IN_PROGRESS,
    ComplaintStatus.RESOLVED
  ],
  [ComplaintStatus.RESOLVED]: [
    ComplaintStatus.CLOSED
  ],
  [ComplaintStatus.CLOSED]: []
};

export const isValidStatusTransition = (currentStatus: ComplaintStatus, newStatus: ComplaintStatus): boolean => {
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};