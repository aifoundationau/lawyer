// Domain Data Types for Lawyer Select (#lawyerselect)
// Conforms to data-contracts.md

export type LegalTitle =
  | 'Solicitor'
  | 'Barrister'
  | 'Conveyancer'
  | 'Paralegal'
  | 'Mediator'
  | 'Patent Attorney'
  | 'Notary Public'
  | 'Migration Agent'
  | 'Arbitrator'
  | 'Legal Consultant';

export type Jurisdiction =
  | 'NSW'
  | 'VIC'
  | 'QLD'
  | 'WA'
  | 'SA'
  | 'TAS'
  | 'ACT'
  | 'NT'
  | 'Federal';

export type PracticeArea =
  | 'Family Law'
  | 'Criminal Law'
  | 'Commercial & Corporate'
  | 'Property & Conveyancing'
  | 'Immigration Law'
  | 'Employment & Workplace'
  | 'Wills & Estates'
  | 'Intellectual Property'
  | 'Personal Injury'
  | 'Civil Litigation'
  | 'Tax Law'
  | 'Defamation & Media'
  | 'Building & Construction'
  | 'Administrative Law';

export type FeeStructure =
  | 'Fixed Fee'
  | 'Hourly Rate'
  | 'No Win No Fee'
  | 'Retainer'
  | 'Conditional'
  | 'Free Consultation';

export type UrgencyLevel =
  | 'Immediate (24h)'
  | 'Urgent (2-3 Days)'
  | 'Standard (1-2 Weeks)'
  | 'Exploratory / Planning';

export interface LegalProfessional {
  id: string;
  tag: 'lawyerselect';
  fullName: string;
  title: LegalTitle;
  firmName: string;
  email: string;
  phone: string;
  jurisdictions: Jurisdiction[];
  practiceAreas: PracticeArea[];
  yearsOfExperience: number;
  barOrRegistrationNumber: string;
  bio: string;
  feeStructure: FeeStructure;
  hourlyRateAud: number;
  locationCity: string;
  locationPostcode: string;
  avatarUrl?: string;
  isVerified: boolean;
  status: 'active' | 'pending_review' | 'suspended';
  createdAt: string;
}

export interface MatchedProfessionalResult {
  professional: LegalProfessional;
  matchScore: number; // 0 - 100
  matchRationale: string;
}

export interface ClientInquiry {
  id: string;
  tag: 'lawyerselect';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  legalIssueDescription: string;
  category: PracticeArea;
  locationState: Jurisdiction;
  locationSuburb: string;
  urgency: UrgencyLevel;
  budgetExpectation: string;
  preferredProfession?: LegalTitle | 'Any Qualified Legal Professional';
  createdAt: string;
}

export interface MarketplaceCase {
  id: string;
  tag: 'lawyerselect';
  
  // Public Section (APP 11 Redacted)
  title: string;
  category: PracticeArea;
  jurisdiction: Jurisdiction;
  urgency: UrgencyLevel;
  anonymousSummary: string;
  keyAssistanceRequired: string;
  estimatedBudget: string;
  status: 'open' | 'claimed' | 'closed';
  postedAt: string;

  // Confidential Dossier (Unlocked only after $20 purchase)
  clientFullName?: string;
  clientEmail?: string;
  clientPhone?: string;
  fullFactualDetails?: string;
  claimedBy?: string; // legalProfessionalId
  claimedByName?: string;
  claimedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'client' | 'legal_professional';
  senderName: string;
  content: string;
  sentAt: string;
  read: boolean;
}

export interface ChatInteraction {
  id: string;
  tag: 'lawyerselect';
  clientId: string;
  clientName: string;
  clientEmail: string;
  lawyerId: string;
  lawyerName: string;
  lawyerTitle: string;
  lawyerFirm: string;
  lawyerAvatar?: string;
  caseId?: string;
  status: 'active' | 'closed';
  lastMessageSnippet: string;
  lastMessageAt: string;
  messages: ChatMessage[];
}

export interface CasePurchase {
  id: string;
  tag: 'lawyerselect';
  caseId: string;
  legalProfessionalId: string;
  amount: number; // 2000 cents = $20.00 AUD
  currency: 'aud';
  status: 'completed' | 'pending' | 'failed';
  stripeSessionId?: string;
  createdAt: string;
}
