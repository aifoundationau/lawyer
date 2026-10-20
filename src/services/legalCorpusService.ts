import { OPEN_AUSTRALIAN_LEGAL_CORPUS_REPRESENTATIVE, LegalCorpusDocument } from '../data/openAustralianLegalCorpus';

export interface CorpusSearchFilters {
  query?: string;
  jurisdiction?: string;
  category?: string;
  documentType?: string;
}

export interface LegalLibraryStatus {
  libraryName: string;
  isOnline: boolean;
  indexedDocumentsCount: number;
  coverage: string;
  jurisdictions: string[];
}

export class LegalCorpusService {
  private localDocuments: LegalCorpusDocument[] = [...OPEN_AUSTRALIAN_LEGAL_CORPUS_REPRESENTATIVE];

  public getStatus(): LegalLibraryStatus {
    return {
      libraryName: 'Australian National Legal Library & Precedents Archive',
      isOnline: true,
      indexedDocumentsCount: this.localDocuments.length,
      coverage: 'Commonwealth, High Court of Australia & State Jurisdictions',
      jurisdictions: ['Commonwealth', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'Federal'],
    };
  }

  /**
   * Search within the Australian Legal Library
   */
  public searchCorpus(filters: CorpusSearchFilters): LegalCorpusDocument[] {
    const q = (filters.query || '').toLowerCase().trim();
    const jur = filters.jurisdiction || 'All';
    const cat = filters.category || 'All';
    const docType = filters.documentType || 'All';

    return this.localDocuments.filter((doc) => {
      // Jurisdiction filtering
      if (jur !== 'All') {
        const matchesJur = doc.jurisdiction === jur || 
                           (jur === 'Commonwealth' && doc.jurisdiction === 'Federal') ||
                           (jur === 'Federal' && doc.jurisdiction === 'Commonwealth');
        if (!matchesJur) return false;
      }

      // Category filtering
      if (cat !== 'All' && doc.category !== cat) {
        return false;
      }

      // Document Type filtering
      if (docType !== 'All' && doc.documentType !== docType) {
        return false;
      }

      // Search Query
      if (q) {
        const inTitle = doc.title.toLowerCase().includes(q);
        const inCitation = doc.citation.toLowerCase().includes(q);
        const inSummary = doc.summary.toLowerCase().includes(q);
        const inSections = doc.keySections.some((s) => s.toLowerCase().includes(q));
        const inApplication = doc.practicalApplication.toLowerCase().includes(q);
        const inProfession = doc.recommendedProfession.toLowerCase().includes(q);
        const inAuthority = doc.sourceAuthority.toLowerCase().includes(q);

        if (!inTitle && !inCitation && !inSummary && !inSections && !inApplication && !inProfession && !inAuthority) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Automatically extracts applicable primary legislation and case law for a given client dispute
   */
  public findRelevantStatutesForDispute(disputeText: string): LegalCorpusDocument[] {
    const lower = disputeText.toLowerCase();
    const matches: LegalCorpusDocument[] = [];

    for (const doc of this.localDocuments) {
      let isRelevant = false;

      if (lower.includes('lease') || lower.includes('rent') || lower.includes('lockout') || lower.includes('tenancy')) {
        if (doc.id === 'law_retail_leases_lockout') isRelevant = true;
      }
      if (lower.includes('sunset') || lower.includes('off the plan') || lower.includes('conveyanc') || lower.includes('deposit') || lower.includes('property')) {
        if (doc.id === 'law_conveyancing_66zl') isRelevant = true;
      }
      if (lower.includes('dismiss') || lower.includes('fair work') || lower.includes('adverse action') || lower.includes('redundancy') || lower.includes('termination')) {
        if (doc.id === 'law_fw_act_365') isRelevant = true;
      }
      if (lower.includes('partner') || lower.includes('shareholder') || lower.includes('director') || lower.includes('deadlock') || lower.includes('oppression') || lower.includes('corporation')) {
        if (doc.id === 'law_corps_act_232' || doc.id === 'law_acl_s18') isRelevant = true;
      }
      if (lower.includes('child') || lower.includes('custody') || lower.includes('parenting') || lower.includes('divorce') || lower.includes('separation') || lower.includes('family')) {
        if (doc.id === 'law_family_law_60cc') isRelevant = true;
      }
      if (lower.includes('builder') || lower.includes('defect') || lower.includes('renovation') || lower.includes('construction') || lower.includes('building')) {
        if (doc.id === 'law_building_act_18b') isRelevant = true;
      }
      if (lower.includes('will') || lower.includes('probate') || lower.includes('estate') || lower.includes('inheritance') || lower.includes('executor')) {
        if (doc.id === 'law_succession_act_59') isRelevant = true;
      }
      if (lower.includes('visa') || lower.includes('immigration') || lower.includes('citizenship') || lower.includes('deportation') || lower.includes('art')) {
        if (doc.id === 'law_migration_act_501') isRelevant = true;
      }
      if (lower.includes('defam') || lower.includes('review') || lower.includes('reputation') || lower.includes('smear') || lower.includes('slander') || lower.includes('libel')) {
        if (doc.id === 'law_defamation_act_concerns' || doc.id === 'law_case_voller_hca') isRelevant = true;
      }
      if (lower.includes('guarantee') || lower.includes('unconscionable') || lower.includes('bank') || lower.includes('loan')) {
        if (doc.id === 'law_case_amadio_hca') isRelevant = true;
      }
      if (lower.includes('injury') || lower.includes('negligence') || lower.includes('slip') || lower.includes('fall') || lower.includes('accident')) {
        if (doc.id === 'law_civil_liability_5b') isRelevant = true;
      }
      if (lower.includes('police') || lower.includes('arrest') || lower.includes('bail') || lower.includes('assault') || lower.includes('criminal')) {
        if (doc.id === 'law_crimes_act_1900') isRelevant = true;
      }
      if (lower.includes('patent') || lower.includes('trademark') || lower.includes('invention') || lower.includes('intellectual property')) {
        if (doc.id === 'law_patents_act_1990') isRelevant = true;
      }
      if (lower.includes('privacy') || lower.includes('data breach') || lower.includes('surveillance') || lower.includes('confidential')) {
        if (doc.id === 'law_privacy_act_app11') isRelevant = true;
      }

      if (isRelevant) {
        matches.push(doc);
      }
    }

    return matches.length > 0 ? matches : this.localDocuments.slice(0, 3);
  }
}

export const legalCorpusService = new LegalCorpusService();
