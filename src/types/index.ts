// Domain data types for Lawyer Select (#lawyerselect). Field names follow data-contracts.md.
// The value lists below are the single source for dropdowns, filters and validation.

export const LEGAL_TITLES = [
  'Solicitor',
  'Barrister',
  'Conveyancer',
  'Paralegal',
  'Mediator',
  'Patent Attorney',
  'Notary Public',
  'Migration Agent',
  'Arbitrator',
  'Legal Consultant',
] as const;
export type LegalTitle = (typeof LEGAL_TITLES)[number];

export const JURISDICTIONS = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Federal'] as const;
export type Jurisdiction = (typeof JURISDICTIONS)[number];

export const PRACTICE_AREAS = [
  'Family Law',
  'Criminal Law',
  'Commercial & Corporate',
  'Property & Conveyancing',
  'Immigration Law',
  'Employment & Workplace',
  'Wills & Estates',
  'Intellectual Property',
  'Personal Injury',
  'Civil Litigation',
  'Tax Law',
  'Defamation & Media',
  'Building & Construction',
  'Administrative Law',
] as const;
export type PracticeArea = (typeof PRACTICE_AREAS)[number];

export const FEE_STRUCTURES = [
  'Hourly Rate',
  'Fixed Fee',
  'No Win No Fee',
  'Retainer',
  'Conditional',
  'Free Consultation',
] as const;
export type FeeStructure = (typeof FEE_STRUCTURES)[number];

// Stored values follow data-contracts.md; the labels are what people see.
export const URGENCY_LEVELS = ['Immediate (24h)', 'Urgent (2-3 Days)', 'Standard', 'Exploratory'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];
export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  'Immediate (24h)': 'Immediate (within 24 hours)',
  'Urgent (2-3 Days)': 'Urgent (2–3 days)',
  Standard: 'Standard (1–2 weeks)',
  Exploratory: 'Exploratory / planning',
};

export type ProfessionalStatus = 'active' | 'pending_review' | 'suspended';

/** Public directory profile: legal_professionals/{uid}. Only the server writes it. */
export interface LegalProfessional {
  id: string; // the practitioner's Firebase Auth uid
  tag: 'lawyerselect';
  source: 'lawyerselect';
  fullName: string;
  title: LegalTitle;
  firmName: string;
  jurisdictions: Jurisdiction[];
  practiceAreas: PracticeArea[];
  yearsOfExperience: number;
  barOrRegistrationNumber: string;
  bio: string;
  feeStructure: FeeStructure;
  hourlyRateAud: number | null; // null when the practitioner hasn't stated a rate
  locationCity: string;
  locationPostcode: string;
  avatarUrl?: string;
  isVerified: boolean;
  status: ProfessionalStatus;
  createdAt: string;
  updatedAt: string;
}

/** Private contact details: legal_professionals/{uid}/private/contact (the owner and the server only). */
export interface ProfessionalContact {
  email: string;
  phone: string;
  updatedAt: string;
}

/** What a practitioner submits when creating or editing their profile. */
export interface ProfessionalProfileInput {
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
  hourlyRateAud: number | null;
  locationCity: string;
  locationPostcode: string;
}

/** AI-extracted suggestions. A field is left out when the text didn't state it. */
export type ProfessionalProfileDraft = Partial<ProfessionalProfileInput>;

export interface MatchedProfessionalResult {
  professional: LegalProfessional;
  matchScore: number; // 0 - 100
  matchRationale: string;
}

export interface MatchResponse {
  matches: MatchedProfessionalResult[];
  method: 'ai' | 'keyword';
}

export type CaseStatus = 'open' | 'claimed' | 'closed';

/** Public, redacted case: marketplace_cases/{caseId}. Contains no personal details. */
export interface MarketplaceCase {
  id: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  title: string;
  category: PracticeArea;
  jurisdiction: Jurisdiction;
  urgency: UrgencyLevel;
  anonymousSummary: string;
  keyAssistanceRequired: string;
  estimatedBudget: string;
  status: CaseStatus;
  postedAt: string;
  updatedAt: string;
  claimedAt?: string | null;
}

/**
 * Confidential dossier: marketplace_cases/{caseId}/private/dossier.
 * Readable only by the client who posted the case and the one practitioner who paid for it.
 */
export interface CaseDossier {
  caseId: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  clientUid: string;
  clientFullName: string;
  clientEmail: string;
  clientPhone: string;
  fullFactualDetails: string;
  purchaserUid: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A case the signed-in practitioner has paid for, with its dossier. */
export interface UnlockedLead {
  purchase: CasePurchase;
  caseItem: MarketplaceCase | null;
  dossier: CaseDossier | null;
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

/** chat_interactions/{chatId}; messages live in the messages subcollection. */
export interface ChatInteraction {
  id: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  clientId: string;
  lawyerId: string;
  participants: string[];
  clientName: string;
  lawyerName: string;
  lawyerTitle: string;
  lawyerFirm: string;
  caseId: string | null;
  status: 'active' | 'closed';
  lastMessageSnippet: string;
  lastMessageAt: string;
  lastMessageSenderId: string | null;
  lastReadAt: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseStatus = 'initiated' | 'completed' | 'failed' | 'refunded';

/** case_purchases/{stripeSessionId}. Only the server writes it. */
export interface CasePurchase {
  id: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  caseId: string;
  legalProfessionalId: string;
  amount: number; // 2000 cents = $20.00 AUD
  currency: 'aud';
  status: PurchaseStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  clientNotificationSent: boolean;
  createdAt: string;
  completedAt?: string | null;
  updatedAt: string;
}
