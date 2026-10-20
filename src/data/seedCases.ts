import { MarketplaceCase, CaseConfidentialDossier } from '../types';

/**
 * Public Anonymous Case Pool (APP 11 Scrubbed)
 * Contains strictly NO PII (No client names, emails, phones, or unredacted stories).
 */
export const SEED_MARKETPLACE_CASES: MarketplaceCase[] = [
  {
    id: 'case_lease_lockout_syd',
    tag: 'lawyerselect',
    title: 'Urgent Commercial Tenancy Dispute & Unlawful Lockout',
    category: 'Commercial & Corporate',
    jurisdiction: 'NSW',
    urgency: 'Immediate (24h)',
    anonymousSummary: 'Commercial tenant operating a logistics hub was served an invalid 24-hour notice of default and locked out by the landlord without court order. Inventory and time-sensitive cargo are trapped inside. Tenant seeks immediate interlocutory injunction in Supreme Court and emergency damages assessment.',
    keyAssistanceRequired: 'Draft emergency urgent injunction application to NSW Supreme Court, re-entry demand notice, and breach mitigation advice.',
    estimatedBudget: '$3,000 - $6,000 AUD',
    status: 'open',
    postedAt: '2026-10-18T14:30:00Z',
  },
  {
    id: 'case_conveyancing_parra',
    tag: 'lawyerselect',
    title: 'Off-The-Plan Residential Property Settlement Rescission',
    category: 'Property & Conveyancing',
    jurisdiction: 'NSW',
    urgency: 'Urgent (2-3 Days)',
    anonymousSummary: 'Purchaser of an off-the-plan apartment in Western Sydney facing sunset date expiry. Developer has sent notice to complete despite critical defects, non-compliant fire safety certification, and missing occupation certificate (OC). Purchaser wishes to formally rescind contract and recover $78,000 held in statutory trust.',
    keyAssistanceRequired: 'Contract analysis, notice of rescission drafting under NSW Conveyancing Act s 66ZL, and representation for trust deposit recovery.',
    estimatedBudget: '$1,800 - $3,500 AUD',
    status: 'open',
    postedAt: '2026-10-19T09:15:00Z',
  },
  {
    id: 'case_fairwork_unlawful_melb',
    tag: 'lawyerselect',
    title: 'Senior Executive General Protections (Adverse Action) Claim',
    category: 'Employment & Workplace',
    jurisdiction: 'VIC',
    urgency: 'Standard (1-2 Weeks)',
    anonymousSummary: 'Senior Chief Financial Officer terminated abruptly after exercising workplace right to raise serious accounting discrepancies and ESG compliance breaches to the board of directors. Company offered an inadequate deed of release. Ex-executive seeks Fair Work Commission conciliation or Federal Court adverse action proceedings.',
    keyAssistanceRequired: 'Fair Work s 365 application review, negotiation of separation package / severance settlement, or filing in Federal Circuit and Family Court.',
    estimatedBudget: '$4,000 - $8,000 AUD',
    status: 'open',
    postedAt: '2026-10-19T11:00:00Z',
  },
  {
    id: 'case_partner_visa_appeal',
    tag: 'lawyerselect',
    title: 'Subclass 820 Partner Visa Refusal & Administrative Review Tribunal (ART)',
    category: 'Immigration Law',
    jurisdiction: 'Federal',
    urgency: 'Urgent (2-3 Days)',
    anonymousSummary: 'Applicant received notice of Partner Visa refusal citing insufficient evidence of shared financial commitments and social recognition. Statutory 28-day deadline to lodge review with the newly established Administrative Review Tribunal (ART) expires in 6 days.',
    keyAssistanceRequired: 'Urgent ART appeal lodgement, evidence compilation, statutory declarations, and hearing representation.',
    estimatedBudget: '$2,500 - $4,500 AUD',
    status: 'open',
    postedAt: '2026-10-19T16:45:00Z',
  },
  {
    id: 'case_defamation_online_bris',
    tag: 'lawyerselect',
    title: 'Urgent Concerns Notice for Defamatory Social Media Campaign',
    category: 'Defamation & Media',
    jurisdiction: 'QLD',
    urgency: 'Immediate (24h)',
    anonymousSummary: 'Medical specialist and clinic targeted by coordinated anonymous smear campaign across Google Reviews, Facebook community groups, and TikTok alleging malpractice without any clinical basis. Clinic appointments cancelled by 30% this week. Seeks immediate Concerns Notice under Defamation Act and preliminary discovery for IP subpoena.',
    keyAssistanceRequired: 'Draft formal Concerns Notice under Model Defamation Provisions, take-down letters to platforms, and preliminary discovery application against anonymous posters.',
    estimatedBudget: '$3,500 - $7,000 AUD',
    status: 'open',
    postedAt: '2026-10-20T08:10:00Z',
  }
];

/**
 * Encrypted/Secure Dossier Vault
 * Stored in restricted storage and only unlocked upon verified $20 payment.
 */
export const SEED_CONFIDENTIAL_DOSSIERS: Record<string, CaseConfidentialDossier> = {
  case_lease_lockout_syd: {
    caseId: 'case_lease_lockout_syd',
    clientFullName: 'Thomas Wright (Director, Apex Logistics Pty Ltd)',
    clientEmail: 'thomas.wright@apexlogistics-nsw.com.au',
    clientPhone: '+61 412 889 012',
    fullFactualDetails: 'We entered a 5-year lease in Blacktown in March 2024. Landlord claims arrears of $14,200 for outgoings reconciliation that we formally disputed in August with an independent accountant report. On Friday morning at 6:00 AM, security hired by landlord changed gate padlocks, preventing our 12 drivers from fulfilling deliveries. Daily business loss exceeds $9,500.',
  },
  case_conveyancing_parra: {
    caseId: 'case_conveyancing_parra',
    clientFullName: 'Rachel Tan & Benjamin Hughes',
    clientEmail: 'rachel.tan.syd@outlook.com',
    clientPhone: '+61 403 771 902',
    fullFactualDetails: 'We exchanged contracts on Lot 402, High Street Parramatta in 2023. Sunset date was 30 September 2026. Developer failed to obtain final Occupation Certificate and sent threatening notice to complete within 14 days or forfeit deposit. We need a conveyancer or property solicitor to issue formal rescission before the 14-day notice expires.',
  },
  case_fairwork_unlawful_melb: {
    caseId: 'case_fairwork_unlawful_melb',
    clientFullName: 'Alexander Montgomery',
    clientEmail: 'a.montgomery.melb@gmail.com',
    clientPhone: '+61 421 556 788',
    fullFactualDetails: 'Employed for 6 years as CFO at a healthcare device firm. In July I flagged $620k in non-compliant R&D tax concession claims. On October 10th I was called into a surprise 15-minute meeting and informed my position was "redundant" with 4 weeks pay. I have full email audit trails showing clear retaliatory adverse action.',
  },
  case_partner_visa_appeal: {
    caseId: 'case_partner_visa_appeal',
    clientFullName: 'Sofia Rossi & Liam Walker',
    clientEmail: 'sofia.rossi.au@gmail.com',
    clientPhone: '+61 498 123 456',
    fullFactualDetails: 'Department officer concluded our de facto relationship was not genuine because utility bills were solely in Liam’s name during our first 8 months renting. We have been together for 3.5 years, have a joint bank account, joint lease, and over 40 family photos with statutory declarations from friends.',
  },
  case_defamation_online_bris: {
    caseId: 'case_defamation_online_bris',
    clientFullName: 'Dr. Gregory Hall (Principal, Hall Specialist Clinic)',
    clientEmail: 'gregory@hallclinic.com.au',
    clientPhone: '+61 411 223 344',
    fullFactualDetails: 'Three separate fake accounts created over the weekend claiming I performed unaccredited procedures. Our practice management software shows these individuals were never patients. Revenue drop and reputational harm is catastrophic. Need immediate legal intervention today.',
  }
};
