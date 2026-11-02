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
export const URGENCY_LEVELS = [
  'Immediate (24h)',
  'Urgent (2-3 Days)',
  'Standard',
  'Exploratory',
  'Standard (1-2 Weeks)',
] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];
export const URGENCY_LABELS: Record<string, string> = {
  'Immediate (24h)': 'Immediate (within 24 hours)',
  'Urgent (2-3 Days)': 'Urgent (2–3 days)',
  Standard: 'Standard (1–2 weeks)',
  'Standard (1-2 Weeks)': 'Standard (1–2 weeks)',
  Exploratory: 'Exploratory / planning',
};

export type ProfessionalStatus = 'active' | 'pending_review' | 'suspended';

/** Public directory profile: legal_professionals/{uid}. Only the server writes it. */
export interface LegalProfessional {
  id: string; // the practitioner's Firebase Auth uid
  tag: 'lawyerselect';
  source?: 'lawyerselect';
  fullName: string;
  title: LegalTitle;
  firmName: string;
  email?: string;
  phone?: string;
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
  updatedAt?: string;
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
  source?: 'lawyerselect';
  title: string;
  category: PracticeArea;
  jurisdiction: Jurisdiction;
  urgency: UrgencyLevel;
  anonymousSummary: string;
  keyAssistanceRequired: string;
  estimatedBudget: string;
  status: CaseStatus;
  postedAt: string;
  updatedAt?: string;
  claimedAt?: string | null;
  claimedBy?: string | null;
  claimedByName?: string | null;
  // PII fields present only on unlocked lead / intake
  clientFullName?: string;
  clientEmail?: string;
  clientPhone?: string;
  fullFactualDetails?: string;
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

export interface CaseConfidentialDossier {
  caseId: string;
  clientFullName: string;
  clientEmail: string;
  clientPhone: string;
  fullFactualDetails?: string;
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
  senderRole: 'client' | 'legal_professional' | 'system';
  senderName: string;
  content: string;
  sentAt: string;
  read: boolean;
}

/** chat_interactions/{chatId}; messages live in the messages subcollection or embedded. */
export interface ChatInteraction {
  id: string;
  tag: 'lawyerselect';
  source?: 'lawyerselect';
  clientId: string;
  lawyerId: string;
  participants?: string[];
  clientName: string;
  clientEmail?: string;
  lawyerName: string;
  lawyerTitle: string;
  lawyerFirm: string;
  caseId?: string | null;
  status: 'active' | 'closed';
  lastMessageSnippet: string;
  lastMessageAt: string;
  lastMessageSenderId?: string | null;
  lastReadAt?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  messages?: ChatMessage[];
}

export type PurchaseStatus = 'initiated' | 'completed' | 'failed' | 'refunded';

/** case_purchases/{stripeSessionId}. Only the server writes it. */
export interface CasePurchase {
  id: string;
  tag: 'lawyerselect';
  source?: 'lawyerselect';
  caseId: string;
  legalProfessionalId: string;
  amount: number; // 2000 cents = $20.00 AUD
  currency: 'aud';
  status: PurchaseStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  clientNotificationSent?: boolean;
  createdAt: string;
  completedAt?: string | null;
  updatedAt?: string;
}

// =========================================================================
// Multi-Currency, Geolocation, SuperAdmin & Token Economy Contracts
// =========================================================================

export interface SystemSettings {
  id: 'global_config';
  tag: 'lawyerselect';
  source: 'lawyerselect';
  defaultCurrency: 'AUD';
  defaultTokenPriceAud: 1;
  roundingPolicy: 'CEIL_WHOLE_NUMBERS';
  audToUsdExchangeRate: number; // Max 3 decimals, e.g. 0.655
  isTokenSystemEnabled: boolean;
  isAudEnabled: boolean;
  isUsdEnabled: boolean;
  geoDetectionEnabled: boolean;
  auNzRegionCodes: string[];
  invoiceDisclaimer: string;
  updatedAt: string;
  updatedByUid?: string;
}

export type ProductCategory = 
  | 'lead_unlock'
  | 'practitioner_subscription'
  | 'intake_triage'
  | 'document_summary'
  | 'consultation_deposit'
  | 'custom';

export interface ProductAndServiceItem {
  id: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  name: string;
  description: string;
  category: ProductCategory;
  tokenAmount: number; // Strict whole integer (rounded up with Math.ceil)
  priceAud: number; // Whole integer AUD ($1 per token)
  priceUsdEstimated: number; // Converted price with max 3 decimals
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SuperAdminMessageType = 'refund_request' | 'general_inquiry' | 'support' | 'dispute';
export type SuperAdminMessageStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'closed' | 'resolved';

export interface SuperAdminMessage {
  id: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderRole: 'client' | 'lawyer' | 'guest';
  recipientRole: 'superadmin';
  messageType: SuperAdminMessageType;
  subject: string;
  body: string;
  costTokens: 0; // Strictly 0 - Always free
  costAud: 0;
  status: SuperAdminMessageStatus;
  adminResponse?: string;
  adminRespondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeolocationRegionInfo {
  countryCode: string;
  countryName: string;
  city?: string;
  isAuOrNz: boolean;
  detectedAt: string;
}

// =========================================================================
// Dual Registration Forms & AI Approved Information Sheet Contracts
// =========================================================================

export const ENTITY_IDENTIFIER_TYPES = [
  'ABN/ACN (Australia)',
  'EIN (US)',
  'Companies House CRN (UK)',
  'NZBN (New Zealand)',
  'Other',
] as const;
export type EntityIdentifierType = (typeof ENTITY_IDENTIFIER_TYPES)[number];

export const PRACTICE_ENTITY_STRUCTURES = [
  'Sole Practitioner',
  'Partnership',
  'Incorporated Legal Practice (ILP)',
  'Multi-Disciplinary Partnership (MDP)',
  'Barristers Chambers',
] as const;
export type PracticeEntityStructure = (typeof PRACTICE_ENTITY_STRUCTURES)[number];

export const PRACTITIONER_ROLES = [
  'Partner',
  'Principal',
  'Senior Associate',
  'Associate',
  'Special Counsel',
  'Consultant',
  'Barrister',
  'Sole Practitioner',
] as const;
export type PractitionerRole = (typeof PRACTITIONER_ROLES)[number];

export const PC_CATEGORIES = [
  'Principal (Unrestricted)',
  'Employee Solicitor',
  'Corporate Practising Certificate',
  'Barrister Practising Certificate',
  'Unrestricted Practising Certificate',
  'Restricted (Supervised)',
  'Registered Migration Agent (MARA)',
  'Licensed Conveyancer',
] as const;
export type PractisingCertificateCategory = (typeof PC_CATEGORIES)[number];

export const KYC_DOCUMENT_TYPES = [
  'Australian Passport',
  'International Passport',
  'State Driver Licence',
  'Government Photo ID',
] as const;
export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

export const GOOD_STANDING_STATUSES = [
  'Clean & Active Standing',
  'Subject to Undertaking / Condition',
  'Pending Registry Check',
] as const;
export type GoodStandingStatus = (typeof GOOD_STANDING_STATUSES)[number];

/** 1. Legal Entity & Firm Information */
export interface LegalEntityInformation {
  legalBusinessName: string;
  tradingNames: string[];
  entityIdentifierType: EntityIdentifierType;
  entityIdentifierNumber: string; // e.g., ABN 51 824 753 556 / ACN 612 345 678
  practiceType: PracticeEntityStructure;
  firmRegulatoryNumber: string; // Law Society / Statutory Entity ID
  principalAddress: string;
  mailingAddress: string;
  branchOfficeLocations: string[];
  dxBoxDetails: string;
  firmEmail: string;
  firmTelephone: string;
  secureClientIntakeEndpoint: string;
  officialWebsiteUrl: string;
}

/** 2. Practitioner / Individual Lawyer Profile */
export interface PractisingCertificateDetails {
  pcNumber: string;
  licensingAuthority: string; // e.g., QLS, Law Society of NSW, LIV, SRA, State Bar
  certificateCategory: PractisingCertificateCategory;
  admissionDate: string;
  admissionJurisdiction: string;
  pcExpirationDate: string;
}

export interface IdentityVerificationKyc {
  documentType: KycDocumentType;
  issuingAuthority: string;
  documentReference: string;
  expirationDate: string;
  /** Standardized 1-2 sentence forensic verification summary per personal-id-inspection skill */
  forensicBriefDescription: string;
  verificationStatus: 'Verified Authentic' | 'Pending Manual Review' | 'Flagged';
}

export interface PractitionerProfileInformation {
  prefix: string;
  fullLegalName: string;
  preferredName: string;
  postNominals: string; // e.g., LLB (Hons), JD, LLM
  title: LegalTitle;
  roleOrPosition: PractitionerRole;
  affiliatedFirmName: string;
  affiliatedFirmId?: string;
  email: string;
  phone: string;
  locationCity: string;
  locationPostcode: string;
  yearsOfExperience: number; // Strict whole integer
  feeStructure: FeeStructure;
  hourlyRateAud: number; // Strict whole integer AUD
  practisingCertificate: PractisingCertificateDetails;
  identityVerificationKyc: IdentityVerificationKyc;
}

/** 3. Professional Compliance & Insurance */
export interface ProfessionalComplianceAndInsurance {
  insurerOrSchemeName: string; // e.g., Lawcover in NSW, Lexon in QLD, LPLC in VIC, SRA-qualifying
  policyNumber: string;
  currencyOfCoverCertificate: string;
  policyExpirationDate: string;
  isGoodStandingConfirmed: boolean;
  regulatoryRegisterStatus: GoodStandingStatus;
  disciplinaryDisclosureNotes: string;
}

/** 4. Practice Areas & Operational Capabilities */
export interface PracticeOperationalCapabilities {
  primaryPracticeAreas: PracticeArea[];
  secondaryPracticeAreas: PracticeArea[];
  accreditationsAndSpecialisations: string[]; // e.g., Law Society Accredited Specialist, NMAS Mediator, Public Notary
  jurisdictionsAdmitted: string[]; // State, Federal, High Court, Foreign Cross-Border
  courtAndRegistryIdentifiers: string[]; // High Court / Federal Court bulk filing IDs
  languagesSpoken: string[];
}

export interface ApprovedSheetMeta {
  sheetId: string;
  aiConfidenceScore: number; // Strict whole integer 1..100
  executiveSummary: string;
  generatedAt: string;
}

/** Form 1 Record: Law Firm / Legal Entity Registration (law_firms/{id}) */
export interface LawFirmRegistration {
  id: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  registrationType: 'law_firm';
  legalEntity: LegalEntityInformation;
  complianceAndInsurance: ProfessionalComplianceAndInsurance;
  operationalCapabilities: PracticeOperationalCapabilities;
  approvedSheetMeta: ApprovedSheetMeta;
  status: 'approved' | 'pending_review' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

/** Form 2 Record: Individual Practitioner / Lawyer Registration (practitioner_registrations/{id}) */
export interface PractitionerRegistration {
  id: string;
  tag: 'lawyerselect';
  source: 'lawyerselect';
  registrationType: 'individual_practitioner';
  practitionerProfile: PractitionerProfileInformation;
  complianceAndInsurance: ProfessionalComplianceAndInsurance;
  operationalCapabilities: PracticeOperationalCapabilities;
  approvedSheetMeta: ApprovedSheetMeta;
  status: 'approved' | 'pending_review' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export type DateFormatOption = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY' | 'MM/DD/YYYY';
export type TimeFormatOption = '12h' | '24h';

export interface GeoLocationSettings {
  suburb: string;
  state: string;
  country: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  dateFormat: DateFormatOption;
  timeFormat: TimeFormatOption;
  isAutoDetected: boolean;
  weatherTempC?: number;
  weatherCondition?: string;
  weatherCode?: number;
  audToUsdRate: number;
  rateLastUpdated?: string;
}


