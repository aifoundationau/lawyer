// Open Australian Legal Corpus (isaacus/open-australian-legal-corpus)
// Curated high-frequency statutory provisions, regulations, and landmark judicial decisions
// Dataset origin: https://huggingface.co/datasets/isaacus/open-australian-legal-corpus

export interface LegalCorpusDocument {
  id: string;
  title: string;
  citation: string;
  jurisdiction: 'Commonwealth' | 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'Federal';
  category: string;
  documentType: 'Legislation' | 'Case Law' | 'Regulation' | 'Tribunal Decision';
  keySections: string[];
  summary: string;
  practicalApplication: string;
  sourceUrl: string;
}

export const OPEN_AUSTRALIAN_LEGAL_CORPUS_REPRESENTATIVE: LegalCorpusDocument[] = [
  {
    id: 'oalc_fw_act_365',
    title: 'Fair Work Act 2009 (Cth)',
    citation: 'Fair Work Act 2009 (Cth) s 365',
    jurisdiction: 'Commonwealth',
    category: 'Employment & Workplace',
    documentType: 'Legislation',
    keySections: ['s 340 (Protection of workplace rights)', 's 341 (Meaning of workplace right)', 's 365 (Application for FWC to deal with dispute)'],
    summary: 'Governs adverse action and general protections. Prohibits employers from taking adverse action against employees because they exercised a workplace right, made a complaint, or flagged statutory compliance breaches.',
    practicalApplication: 'Crucial for executive dismissals, whistleblower retaliation, and workplace rights disputes. Imposes a reverse onus of proof on the employer.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  },
  {
    id: 'oalc_conveyancing_66zl',
    title: 'Conveyancing Act 1919 (NSW)',
    citation: 'Conveyancing Act 1919 (NSW) s 66ZL',
    jurisdiction: 'NSW',
    category: 'Property & Conveyancing',
    documentType: 'Legislation',
    keySections: ['s 66ZL (Rescission under sunset clause)', 's 52A (Contracts for sale of land)'],
    summary: 'Restricts developers from rescinding off-the-plan residential contracts under sunset clauses without Supreme Court approval or purchaser consent. Designed to prevent bad-faith developer cancellations in rising property markets.',
    practicalApplication: 'Primary statutory weapon for off-the-plan apartment buyers seeking deposit recovery or opposing unlawful developer contract termination.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  },
  {
    id: 'oalc_retail_leases_lockout',
    title: 'Retail Leases Act 1994 (NSW)',
    citation: 'Retail Leases Act 1994 (NSW) ss 62-68',
    jurisdiction: 'NSW',
    category: 'Commercial & Corporate',
    documentType: 'Legislation',
    keySections: ['s 10 (Excluded leases)', 's 64 (Mediation of retail tenancy disputes)', 's 68 (Orders NCAT may make)'],
    summary: 'Regulates commercial leases for retail premises. Prohibits summary eviction and lockout without mandatory dispute notice and formal statutory mediation before NCAT.',
    practicalApplication: 'Immediate interlocutory relief against unlawful landlord lockouts, security gatepad changes, and inventory seizure.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  },
  {
    id: 'oalc_corps_act_232',
    title: 'Corporations Act 2001 (Cth)',
    citation: 'Corporations Act 2001 (Cth) s 232',
    jurisdiction: 'Commonwealth',
    category: 'Commercial & Corporate',
    documentType: 'Legislation',
    keySections: ['s 232 (Oppressive conduct of affairs)', 's 233 (Orders court can make)', 's 181 (Good faith and best interests)'],
    summary: 'Provides remedies for minority shareholders where the conduct of company affairs is contrary to the interests of the members as a whole or oppressive, unfairly prejudicial, or unfairly discriminatory.',
    practicalApplication: 'Used by co-founders and minority partners to resolve director deadlocks, share buyouts, and frozen bank access in proprietary companies.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  },
  {
    id: 'oalc_migration_act_501',
    title: 'Migration Act 1958 (Cth)',
    citation: 'Migration Act 1958 (Cth) s 501',
    jurisdiction: 'Federal',
    category: 'Immigration Law',
    documentType: 'Legislation',
    keySections: ['s 501 (Refusal or cancellation of visa on character grounds)', 's 501CA (Revocation of mandatory cancellation)'],
    summary: 'Empowers the Minister or delegate to refuse or cancel an Australian visa if the person does not satisfy the statutory character test. Reviewed before the Administrative Review Tribunal (ART) under Ministerial Direction 110.',
    practicalApplication: 'Appealing visa cancellations and refusals for partner visas, skilled workers, and permanent residents.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  },
  {
    id: 'oalc_defamation_act_concerns',
    title: 'Defamation Act 2005 (NSW / Uniform Provisions)',
    citation: 'Defamation Act 2005 (NSW) Part 3',
    jurisdiction: 'NSW',
    category: 'Defamation & Media',
    documentType: 'Legislation',
    keySections: ['s 10A (Serious harm threshold)', 's 12B (Concerns notices)', 's 14 (Offers to make amends)'],
    summary: 'Requires a plaintiff to prove that defamatory matter has caused, or is likely to cause, serious harm before issuing court proceedings. Enforces mandatory service of a Concerns Notice giving the publisher 28 days to make an offer of amends.',
    practicalApplication: 'First line of defence and offence for digital defamation, fake Google reviews, social media smear campaigns, and takedown demands.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  },
  {
    id: 'oalc_case_voller_hca',
    title: 'Fairfax Media Publications Pty Ltd v Voller [2021] HCA 27',
    citation: '(2021) 273 CLR 346; [2021] HCA 27',
    jurisdiction: 'Federal',
    category: 'Defamation & Media',
    documentType: 'Case Law',
    keySections: ['Publication rule for online platform administrators and third-party comments'],
    summary: 'Landmark High Court decision establishing that administrators of public social media pages who encourage and facilitate third-party comments are "publishers" of defamatory comments posted by others.',
    practicalApplication: 'Critical precedent for online reviews, community moderators, corporate social pages, and digital liability assessments.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  },
  {
    id: 'oalc_privacy_act_app11',
    title: 'Privacy Act 1988 (Cth)',
    citation: 'Privacy Act 1988 (Cth) Schedule 1 (APPs)',
    jurisdiction: 'Commonwealth',
    category: 'Administrative Law',
    documentType: 'Legislation',
    keySections: ['APP 6 (Use or disclosure)', 'APP 11 (Security of personal info)', 'Part IIIC (Notifiable Data Breaches)'],
    summary: 'Governs the handling of personal information by Australian organizations. Mandates reasonable steps to protect personal data from misuse, interference, loss, unauthorized access, or disclosure.',
    practicalApplication: 'Governs Lawyer Select’s data redaction boundary, client dossier unlock security, and 7-year statutory retention.',
    sourceUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
  }
];
