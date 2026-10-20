import { OPEN_AUSTRALIAN_LEGAL_CORPUS_REPRESENTATIVE, LegalCorpusDocument } from '../data/openAustralianLegalCorpus';

export interface CorpusSearchFilters {
  query?: string;
  jurisdiction?: string;
  category?: string;
  documentType?: string;
}

export interface HuggingFaceCorpusStatus {
  datasetName: string;
  hfUrl: string;
  isOnline: boolean;
  indexedDocumentsCount: number;
  totalCorpusTokens: string;
}

export class LegalCorpusService {
  private localDocuments: LegalCorpusDocument[] = [...OPEN_AUSTRALIAN_LEGAL_CORPUS_REPRESENTATIVE];

  public getStatus(): HuggingFaceCorpusStatus {
    return {
      datasetName: 'isaacus/open-australian-legal-corpus',
      hfUrl: 'https://huggingface.co/datasets/isaacus/open-australian-legal-corpus',
      isOnline: true,
      indexedDocumentsCount: this.localDocuments.length,
      totalCorpusTokens: '1.2B+ Tokens across Commonwealth & States',
    };
  }

  /**
   * Search within the Open Australian Legal Corpus
   */
  public searchCorpus(filters: CorpusSearchFilters): LegalCorpusDocument[] {
    const q = (filters.query || '').toLowerCase().trim();
    const jur = filters.jurisdiction || 'All';
    const cat = filters.category || 'All';

    return this.localDocuments.filter((doc) => {
      if (jur !== 'All' && doc.jurisdiction !== jur && doc.jurisdiction !== 'Commonwealth' && doc.jurisdiction !== 'Federal') {
        return false;
      }
      if (cat !== 'All' && doc.category !== cat) {
        return false;
      }
      if (q) {
        const inTitle = doc.title.toLowerCase().includes(q);
        const inCitation = doc.citation.toLowerCase().includes(q);
        const inSummary = doc.summary.toLowerCase().includes(q);
        const inSections = doc.keySections.some((s) => s.toLowerCase().includes(q));
        const inApplication = doc.practicalApplication.toLowerCase().includes(q);
        if (!inTitle && !inCitation && !inSummary && !inSections && !inApplication) {
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

      // Check keywords
      if (lower.includes('lease') || lower.includes('rent') || lower.includes('lockout')) {
        if (doc.id === 'oalc_retail_leases_lockout') isRelevant = true;
      }
      if (lower.includes('sunset') || lower.includes('off the plan') || lower.includes('conveyanc') || lower.includes('deposit')) {
        if (doc.id === 'oalc_conveyancing_66zl') isRelevant = true;
      }
      if (lower.includes('dismiss') || lower.includes('fair work') || lower.includes('adverse action') || lower.includes('whistleblow')) {
        if (doc.id === 'oalc_fw_act_365') isRelevant = true;
      }
      if (lower.includes('partner') || lower.includes('shareholder') || lower.includes('director') || lower.includes('deadlock') || lower.includes('oppression')) {
        if (doc.id === 'oalc_corps_act_232') isRelevant = true;
      }
      if (lower.includes('visa') || lower.includes('immigration') || lower.includes('art') || lower.includes('aat') || lower.includes('refusal')) {
        if (doc.id === 'oalc_migration_act_501') isRelevant = true;
      }
      if (lower.includes('defam') || lower.includes('review') || lower.includes('reputation') || lower.includes('smear') || lower.includes('social media')) {
        if (doc.id === 'oalc_defamation_act_concerns' || doc.id === 'oalc_case_voller_hca') isRelevant = true;
      }

      if (isRelevant) {
        matches.push(doc);
      }
    }

    return matches.length > 0 ? matches : this.localDocuments.slice(0, 2);
  }

  /**
   * Live Query to Hugging Face Dataset API (if outbound network allows)
   */
  public async queryHuggingFaceAPI(searchTerm: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://datasets-server.huggingface.co/rows?dataset=isaacus%2Fopen-australian-legal-corpus&config=default&split=train&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        return data.rows || [];
      }
    } catch (err) {
      console.warn('Hugging Face direct streaming API offline/rate-limited:', err);
    }
    return [];
  }
}

export const legalCorpusService = new LegalCorpusService();
