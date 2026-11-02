import {
  LegalProfessional,
  MarketplaceCase,
  ChatInteraction,
  ChatMessage,
  CasePurchase,
  CaseConfidentialDossier,
  SystemSettings,
  ProductAndServiceItem,
  SuperAdminMessage,
  SuperAdminMessageType,
  GeolocationRegionInfo,
  LawFirmRegistration,
  PractitionerRegistration,
  EncryptedLawyerApplicationRecord,
} from '../types';
import { SEED_LEGAL_PROFESSIONALS } from '../data/seedLawyers';
import { SEED_MARKETPLACE_CASES, SEED_CONFIDENTIAL_DOSSIERS } from '../data/seedCases';
import { db } from '../config/firebase';
import { collection, doc, setDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY_PROS = 'lawyerselect_professionals_v1';
const STORAGE_KEY_CASES = 'lawyerselect_cases_v1';
const STORAGE_KEY_DOSSIERS = 'lawyerselect_dossiers_vault_v1';
const STORAGE_KEY_CHATS = 'lawyerselect_chats_v1';
const STORAGE_KEY_PURCHASES = 'lawyerselect_purchases_v1';
const STORAGE_KEY_SETTINGS = 'lawyerselect_settings_v1';
const STORAGE_KEY_PRODUCTS = 'lawyerselect_products_v1';
const STORAGE_KEY_SA_MSGS = 'lawyerselect_superadmin_messages_v1';
const STORAGE_KEY_USER_REGION = 'lawyerselect_user_region_v1';
const STORAGE_KEY_FIRMS = 'lawyerselect_law_firms_v1';
const STORAGE_KEY_PRAC_REGS = 'lawyerselect_practitioner_regs_v1';

export const DEFAULT_SETTINGS: SystemSettings = {
  id: 'global_config',
  tag: 'lawyerselect',
  source: 'lawyerselect',
  defaultCurrency: 'AUD',
  defaultTokenPriceAud: 1, // 1 Token = AUD $1
  roundingPolicy: 'CEIL_WHOLE_NUMBERS', // Math.ceil strictly whole numbers
  audToUsdExchangeRate: 0.655, // Max 3 decimal places
  isTokenSystemEnabled: true,
  isAudEnabled: true,
  isUsdEnabled: true,
  geoDetectionEnabled: true,
  auNzRegionCodes: ['AU', 'NZ', 'AUS', 'NZL'],
  invoiceDisclaimer: 'All invoices and receipts are issued strictly in Australian Dollars (AUD).',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_PRODUCTS: ProductAndServiceItem[] = [
  {
    id: 'prod_lead_unlock',
    tag: 'lawyerselect',
    source: 'lawyerselect',
    name: 'Marketplace Legal Case Lead Unlock',
    description: 'Unlock direct client contact info and confidential factual dossier for an active matter.',
    category: 'lead_unlock',
    tokenAmount: 20, // 20 tokens = AUD $20
    priceAud: 20,
    priceUsdEstimated: 13.1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_intake_triage',
    tag: 'lawyerselect',
    source: 'lawyerselect',
    name: 'Urgent 24h AI Case Triage & Specialist Broadcast',
    description: 'Expedite legal intake review and broadcast matter to accredited top specialists within 24 hours.',
    category: 'intake_triage',
    tokenAmount: 15, // 15 tokens = AUD $15
    priceAud: 15,
    priceUsdEstimated: 9.825,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_pro_verification',
    tag: 'lawyerselect',
    source: 'lawyerselect',
    name: 'Practitioner Gold Verification Badge (Monthly)',
    description: 'Verified regulatory badge, prioritized AI match scoring, and top placement in Australian directory.',
    category: 'practitioner_subscription',
    tokenAmount: 50, // 50 tokens = AUD $50
    priceAud: 50,
    priceUsdEstimated: 32.75,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_doc_summary',
    tag: 'lawyerselect',
    source: 'lawyerselect',
    name: 'AI Document Pre-Screening & Case Brief',
    description: 'Automated synthesis and executive legal brief generated from client supporting documents.',
    category: 'document_summary',
    tokenAmount: 10, // 10 tokens = AUD $10
    priceAud: 10,
    priceUsdEstimated: 6.55,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_consult_deposit',
    tag: 'lawyerselect',
    source: 'lawyerselect',
    name: 'Direct Practitioner Initial Consultation Escrow Deposit',
    description: 'Secure initial consultation retainer held in escrow for lawyer-client conference.',
    category: 'consultation_deposit',
    tokenAmount: 40, // 40 tokens = AUD $40
    priceAud: 40,
    priceUsdEstimated: 26.2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_profile_unlock',
    tag: 'lawyerselect',
    source: 'lawyerselect',
    name: 'Top 3 Lawyer Direct Contact Unlock',
    description: 'Unlock direct email, phone number, and priority booking URL for an AI-matched legal professional.',
    category: 'custom',
    tokenAmount: 1, // SuperAdmin controllable strict integer
    priceAud: 1,
    priceUsdEstimated: 0.655,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function detectDefaultUserRegion(): GeolocationRegionInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const isAuOrNz = tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland') || tz.startsWith('Pacific/Chatham');
    const city = isAuOrNz
      ? (tz.startsWith('Australia/') ? tz.replace('Australia/', '').replace('_', ' ') : 'Auckland')
      : 'International';
    return {
      countryCode: isAuOrNz ? (tz.startsWith('Pacific/') ? 'NZ' : 'AU') : 'US',
      countryName: isAuOrNz ? (tz.startsWith('Pacific/') ? 'New Zealand' : 'Australia') : 'United States (International)',
      city,
      isAuOrNz,
      detectedAt: new Date().toISOString(),
    };
  } catch {
    return {
      countryCode: 'AU',
      countryName: 'Australia',
      city: 'Sydney',
      isAuOrNz: true,
      detectedAt: new Date().toISOString(),
    };
  }
}

class LawyerSelectStore {
  private professionals: LegalProfessional[] = [];
  private cases: MarketplaceCase[] = [];
  private confidentialDossiers: Map<string, CaseConfidentialDossier> = new Map();
  private chats: ChatInteraction[] = [];
  private purchases: CasePurchase[] = [];
  private settings: SystemSettings = DEFAULT_SETTINGS;
  private products: ProductAndServiceItem[] = DEFAULT_PRODUCTS;
  private superadminMessages: SuperAdminMessage[] = [];
  private userRegion: GeolocationRegionInfo = detectDefaultUserRegion();
  private lawFirms: LawFirmRegistration[] = [];
  private practitionerRegistrations: PractitionerRegistration[] = [];
  private unlockedProfessionalIds: string[] = [];
  private clientTokens: number = 25;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadInitialData();
    this.initFirestoreSync();
  }

  private loadInitialData() {
    // 1. Load Professionals
    const storedPros = localStorage.getItem(STORAGE_KEY_PROS);
    if (storedPros) {
      try {
        this.professionals = JSON.parse(storedPros);
      } catch {
        this.professionals = [...SEED_LEGAL_PROFESSIONALS];
      }
    } else {
      this.professionals = [...SEED_LEGAL_PROFESSIONALS];
      this.saveProfessionals();
    }

    // 2a. Load Confidential Dossiers Vault
    const storedDossiers = localStorage.getItem(STORAGE_KEY_DOSSIERS);
    if (storedDossiers) {
      try {
        const parsed: Record<string, CaseConfidentialDossier> = JSON.parse(storedDossiers);
        this.confidentialDossiers = new Map(Object.entries(parsed));
      } catch {
        this.confidentialDossiers = new Map(Object.entries(SEED_CONFIDENTIAL_DOSSIERS));
      }
    } else {
      this.confidentialDossiers = new Map(Object.entries(SEED_CONFIDENTIAL_DOSSIERS));
      this.saveDossiers();
    }

    // 2b. Load Cases (Sanitizing any public PII from browser cache)
    const storedCases = localStorage.getItem(STORAGE_KEY_CASES);
    let loadedCases: MarketplaceCase[] = [];
    if (storedCases) {
      try {
        loadedCases = JSON.parse(storedCases);
      } catch {
        loadedCases = [...SEED_MARKETPLACE_CASES];
      }
    } else {
      loadedCases = [...SEED_MARKETPLACE_CASES];
    }

    // Scrub any legacy PII from public cases and archive into private dossiers
    this.cases = loadedCases.map((c) => {
      if (c.clientFullName || c.clientEmail || c.clientPhone || c.fullFactualDetails) {
        if (!this.confidentialDossiers.has(c.id)) {
          this.confidentialDossiers.set(c.id, {
            caseId: c.id,
            clientFullName: c.clientFullName || '',
            clientEmail: c.clientEmail || '',
            clientPhone: c.clientPhone || '',
            fullFactualDetails: c.fullFactualDetails,
          });
        }
      }
      return {
        ...c,
        clientFullName: undefined,
        clientEmail: undefined,
        clientPhone: undefined,
        fullFactualDetails: undefined,
      };
    });
    this.saveCases();
    this.saveDossiers();

    // 3. Load Chats
    const storedChats = localStorage.getItem(STORAGE_KEY_CHATS);
    if (storedChats) {
      try {
        this.chats = JSON.parse(storedChats);
      } catch {
        this.chats = [];
      }
    } else {
      this.chats = [
        {
          id: 'chat_demo_1',
          tag: 'lawyerselect',
          clientId: 'client_david_user',
          clientName: 'David K. (Corporate Client)',
          clientEmail: 'david.k@enterprise-nsw.com.au',
          lawyerId: 'lp_elena_vance',
          lawyerName: 'Elena Vance SC',
          lawyerTitle: 'Barrister',
          lawyerFirm: 'Wentworth Chambers',
          status: 'active',
          lastMessageSnippet: 'I have reviewed your commercial dispute summary and can accept the brief for Friday.',
          lastMessageAt: '2026-10-20T08:30:00Z',
          messages: [
            {
              id: 'msg_1',
              senderId: 'client_david_user',
              senderRole: 'client',
              senderName: 'David K.',
              content: 'Hi Ms Vance, I was matched with you on Lawyer Select regarding an urgent breach of contract in Sydney. Are you available for a brief consultation?',
              sentAt: '2026-10-20T08:15:00Z',
              read: true,
            },
            {
              id: 'msg_2',
              senderId: 'lp_elena_vance',
              senderRole: 'legal_professional',
              senderName: 'Elena Vance SC',
              content: 'Hello David, yes, Wentworth Chambers can assist. I have reviewed your commercial dispute summary and can accept the brief for Friday. Please send over the signed contract and notices.',
              sentAt: '2026-10-20T08:30:00Z',
              read: true,
            },
          ],
        },
      ];
      this.saveChats();
    }

    // 4. Load Purchases
    const storedPurchases = localStorage.getItem(STORAGE_KEY_PURCHASES);
    if (storedPurchases) {
      try {
        this.purchases = JSON.parse(storedPurchases);
      } catch {
        this.purchases = [];
      }
    }

    // 5. Load Settings
    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      try {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } catch {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
      this.saveSettings();
    }

    // 6. Load Products
    const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (storedProducts) {
      try {
        this.products = JSON.parse(storedProducts);
      } catch {
        this.products = [...DEFAULT_PRODUCTS];
      }
    } else {
      this.products = [...DEFAULT_PRODUCTS];
      this.saveProducts();
    }

    // 7. Load SuperAdmin Messages
    const storedSaMsgs = localStorage.getItem(STORAGE_KEY_SA_MSGS);
    if (storedSaMsgs) {
      try {
        this.superadminMessages = JSON.parse(storedSaMsgs);
      } catch {
        this.superadminMessages = [];
      }
    } else {
      // Demo welcome message
      this.superadminMessages = [
        {
          id: 'sam_welcome_demo',
          tag: 'lawyerselect',
          source: 'lawyerselect',
          senderId: 'client_david_user',
          senderEmail: 'david.k@enterprise-nsw.com.au',
          senderName: 'David K.',
          senderRole: 'client',
          recipientRole: 'superadmin',
          messageType: 'general_inquiry',
          subject: 'Token System & Australian Invoicing Confirmation',
          body: 'Hello SuperAdmin, confirming that all invoices are denominated in Australian Dollars. Inquiries sent here are always free.',
          costTokens: 0,
          costAud: 0,
          status: 'resolved',
          adminResponse: 'Confirmed David. All invoices are strictly AUD, and contact with SuperAdmin incurs zero tokens.',
          adminRespondedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      this.saveSuperAdminMessages();
    }

    // 8. Load User Region
    const storedRegion = localStorage.getItem(STORAGE_KEY_USER_REGION);
    if (storedRegion) {
      try {
        this.userRegion = JSON.parse(storedRegion);
      } catch {
        this.userRegion = detectDefaultUserRegion();
      }
    } else {
      this.userRegion = detectDefaultUserRegion();
      localStorage.setItem(STORAGE_KEY_USER_REGION, JSON.stringify(this.userRegion));
    }

    // 9. Load Registered Law Firms
    const storedFirms = localStorage.getItem(STORAGE_KEY_FIRMS);
    if (storedFirms) {
      try {
        this.lawFirms = JSON.parse(storedFirms);
      } catch {
        this.lawFirms = [];
      }
    }

    // 10. Load Practitioner Registrations
    const storedPracRegs = localStorage.getItem(STORAGE_KEY_PRAC_REGS);
    if (storedPracRegs) {
      try {
        this.practitionerRegistrations = JSON.parse(storedPracRegs);
      } catch {
        this.practitionerRegistrations = [];
      }
    }

    // 11. Load Unlocked Profiles & Client Tokens
    const storedUnlocked = localStorage.getItem('lawyerselect_unlocked_pros_v1');
    if (storedUnlocked) {
      try {
        this.unlockedProfessionalIds = JSON.parse(storedUnlocked);
      } catch {
        this.unlockedProfessionalIds = [];
      }
    }
    const storedTokens = localStorage.getItem('lawyerselect_client_tokens_v1');
    if (storedTokens) {
      try {
        this.clientTokens = Math.max(0, Math.ceil(Number(storedTokens)));
      } catch {
        this.clientTokens = 25;
      }
    }
  }

  private initFirestoreSync() {
    try {
      // Live Sync Marketplace Cases
      onSnapshot(
        collection(db, 'marketplace_cases'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteCases: MarketplaceCase[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as MarketplaceCase;
              remoteCases.push({
                ...data,
                id: docSnap.id,
                clientFullName: undefined,
                clientEmail: undefined,
                clientPhone: undefined,
                fullFactualDetails: undefined,
              });
            });

            const casesMap = new Map<string, MarketplaceCase>();
            this.cases.forEach((c) => casesMap.set(c.id, c));
            remoteCases.forEach((c) => {
              const existing = casesMap.get(c.id);
              casesMap.set(c.id, { ...(existing || {}), ...c });
            });

            this.cases = Array.from(casesMap.values());
            this.saveCases();
            this.notify();
          }
        },
        (err) => console.warn('Firestore marketplace_cases sync notice:', err.message)
      );

      // Live Sync Legal Professionals
      onSnapshot(
        collection(db, 'legal_professionals'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remotePros: LegalProfessional[] = [];
            snapshot.forEach((docSnap) => {
              remotePros.push({
                ...(docSnap.data() as LegalProfessional),
                id: docSnap.id,
              });
            });

            const prosMap = new Map<string, LegalProfessional>();
            this.professionals.forEach((p) => prosMap.set(p.id, p));
            remotePros.forEach((p) => prosMap.set(p.id, p));

            this.professionals = Array.from(prosMap.values());
            this.saveProfessionals();
            this.notify();
          }
        },
        (err) => console.warn('Firestore legal_professionals sync notice:', err.message)
      );

      // Live Sync Chat Interactions
      onSnapshot(
        collection(db, 'chat_interactions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteChats: ChatInteraction[] = [];
            snapshot.forEach((docSnap) => {
              remoteChats.push({
                ...(docSnap.data() as ChatInteraction),
                id: docSnap.id,
              });
            });

            const chatsMap = new Map<string, ChatInteraction>();
            this.chats.forEach((c) => chatsMap.set(c.id, c));

            remoteChats.forEach((remoteChat) => {
              const localChat = chatsMap.get(remoteChat.id);
              if (localChat) {
                const msgMap = new Map<string, ChatMessage>();
                (localChat.messages || []).forEach((m) => msgMap.set(m.id, m));
                (remoteChat.messages || []).forEach((m) => msgMap.set(m.id, m));
                const mergedMessages = Array.from(msgMap.values()).sort(
                  (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                );
                chatsMap.set(remoteChat.id, {
                  ...localChat,
                  ...remoteChat,
                  messages: mergedMessages,
                });
              } else {
                chatsMap.set(remoteChat.id, remoteChat);
              }
            });

            this.chats = Array.from(chatsMap.values());
            this.saveChats();
            this.notify();
          }
        },
        (err) => console.warn('Firestore chat_interactions sync notice:', err.message)
      );

      // Live Sync Case Purchases
      onSnapshot(
        collection(db, 'case_purchases'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remotePurchases: CasePurchase[] = [];
            snapshot.forEach((docSnap) => {
              remotePurchases.push({
                ...(docSnap.data() as CasePurchase),
                id: docSnap.id,
              });
            });

            const purchasesMap = new Map<string, CasePurchase>();
            this.purchases.forEach((p) => purchasesMap.set(p.id, p));
            remotePurchases.forEach((p) => purchasesMap.set(p.id, p));

            this.purchases = Array.from(purchasesMap.values());
            localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(this.purchases));
            this.notify();
          }
        },
        (err) => console.warn('Firestore case_purchases sync notice:', err.message)
      );

      // Live Sync System Settings
      onSnapshot(
        collection(db, 'system_settings'),
        (snapshot) => {
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              if (docSnap.id === 'global_config') {
                this.settings = { ...this.settings, ...(docSnap.data() as SystemSettings) };
                this.saveSettings();
                this.notify();
              }
            });
          }
        },
        () => { }
      );

      // Live Sync Products and Services
      onSnapshot(
        collection(db, 'products_and_services'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteProducts: ProductAndServiceItem[] = [];
            snapshot.forEach((docSnap) => {
              remoteProducts.push({
                ...(docSnap.data() as ProductAndServiceItem),
                id: docSnap.id,
              });
            });

            const pMap = new Map<string, ProductAndServiceItem>();
            this.products.forEach((p) => pMap.set(p.id, p));
            remoteProducts.forEach((p) => pMap.set(p.id, p));

            this.products = Array.from(pMap.values());
            this.saveProducts();
            this.notify();
          }
        },
        () => { }
      );

      // Live Sync SuperAdmin Messages
      onSnapshot(
        collection(db, 'superadmin_messages'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMsgs: SuperAdminMessage[] = [];
            snapshot.forEach((docSnap) => {
              remoteMsgs.push({
                ...(docSnap.data() as SuperAdminMessage),
                id: docSnap.id,
              });
            });

            const msgMap = new Map<string, SuperAdminMessage>();
            this.superadminMessages.forEach((m) => msgMap.set(m.id, m));
            remoteMsgs.forEach((m) => msgMap.set(m.id, m));

            this.superadminMessages = Array.from(msgMap.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            this.saveSuperAdminMessages();
            this.notify();
          }
        },
        () => { }
      );
    } catch (e: any) {
      console.warn('Firestore live listener initialization note:', e?.message);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ==========================================
  // CURRENCY, GEOLOCATION & TOKEN MATHEMATICS
  // ==========================================

  /**
   * Enforces business invariant: zero decimals, strictly whole numbers rounded up.
   */
  public roundUpToWhole(val: number): number {
    return Math.ceil(val);
  }

  /**
   * Currency conversion from AUD to USD.
   * Business invariant: maximum 3 decimals for conversion rate display.
   */
  public convertAudToUsd(audAmount: number): number {
    const rate = this.settings.audToUsdExchangeRate || 0.655;
    return Number((audAmount * rate).toFixed(3));
  }

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<SystemSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
      defaultCurrency: 'AUD', // Immutable default
      defaultTokenPriceAud: 1, // Fixed 1 Token = AUD $1
      roundingPolicy: 'CEIL_WHOLE_NUMBERS',
      updatedAt: new Date().toISOString(),
    };
    this.saveSettings();
    this.notify();

    try {
      const docRef = doc(db, 'system_settings', 'global_config');
      setDoc(docRef, this.settings, { merge: true }).catch(() => { });
    } catch { }
  }

  private saveSettings() {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
  }

  public getUserRegion(): GeolocationRegionInfo {
    return { ...this.userRegion };
  }

  public setUserRegionOverride(isAuOrNz: boolean, countryCode?: string, countryName?: string): void {
    this.userRegion = {
      countryCode: countryCode || (isAuOrNz ? 'AU' : 'US'),
      countryName: countryName || (isAuOrNz ? 'Australia' : 'United States (International)'),
      city: isAuOrNz ? 'Sydney' : 'New York',
      isAuOrNz,
      detectedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_USER_REGION, JSON.stringify(this.userRegion));
    this.notify();
  }

  /**
   * Format item prices conforming to all token and currency directives:
   * - Strict whole integer tokens (Math.ceil, no decimals).
   * - 1 Token = AUD $1 default.
   * - AU/NZ users see AUD natively.
   * - Outside AU/NZ users see USD currency conversion with max 3 decimals.
   * - Tooltip / Hover displays comprehensive AUD & USD equivalent details.
   */
  public formatItemPrice(tokenAmount: number) {
    const wholeTokens = Math.max(1, Math.ceil(tokenAmount));
    const priceAud = wholeTokens * (this.settings.defaultTokenPriceAud || 1);
    const priceUsd = this.convertAudToUsd(priceAud);
    const isAuOrNz = this.userRegion.isAuOrNz;

    const audText = `AUD $${priceAud}`;
    const usdText = `USD $${priceUsd.toFixed(3)}`;

    let primaryDisplay = '';
    let hoverDisclaimer = '';

    if (this.settings.isTokenSystemEnabled) {
      primaryDisplay = `${wholeTokens} Tokens`;
      hoverDisclaimer = isAuOrNz
        ? `${audText} (1 Token = AUD $1.00 • Invoices in AUD)`
        : `${usdText} (Converted from ${audText} @ max 3 decimals • Invoices in AUD)`;
    } else if (isAuOrNz) {
      primaryDisplay = audText;
      hoverDisclaimer = `USD Conversion: ${usdText} (Invoices strictly in AUD)`;
    } else {
      primaryDisplay = usdText;
      hoverDisclaimer = `Issued as: ${audText} (All statutory invoices are in AUD)`;
    }

    return {
      tokens: wholeTokens,
      priceAud,
      priceUsd,
      audText,
      usdText,
      primaryDisplay,
      hoverDisclaimer,
      isAuOrNz,
      invoiceDisclaimer: this.settings.invoiceDisclaimer,
    };
  }

  // ==========================================
  // PRODUCTS & SERVICES (SuperAdmin Item CRUD)
  // ==========================================

  public getProducts(): ProductAndServiceItem[] {
    return [...this.products];
  }

  public setProductTokenAmount(id: string, tokenAmount: number): void {
    const target = this.products.find((p) => p.id === id);
    if (!target) return;
    const wholeTokens = Math.max(1, Math.ceil(tokenAmount));
    target.tokenAmount = wholeTokens;
    target.priceAud = wholeTokens * (this.settings.defaultTokenPriceAud || 1);
    target.priceUsdEstimated = this.convertAudToUsd(target.priceAud);
    target.updatedAt = new Date().toISOString();

    this.saveProducts();
    this.notify();

    try {
      const docRef = doc(db, 'products_and_services', target.id);
      setDoc(docRef, target, { merge: true }).catch(() => { });
    } catch { }
  }

  public addProduct(item: Omit<ProductAndServiceItem, 'id' | 'tag' | 'source' | 'createdAt' | 'updatedAt' | 'priceAud' | 'priceUsdEstimated'> & { tokenAmount: number }): ProductAndServiceItem {
    const wholeTokens = Math.max(1, Math.ceil(item.tokenAmount));
    const priceAud = wholeTokens * (this.settings.defaultTokenPriceAud || 1);
    const priceUsdEstimated = this.convertAudToUsd(priceAud);

    const newProd: ProductAndServiceItem = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4),
      tag: 'lawyerselect',
      source: 'lawyerselect',
      name: item.name.trim(),
      description: item.description.trim(),
      category: item.category,
      tokenAmount: wholeTokens,
      priceAud,
      priceUsdEstimated,
      isActive: item.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.push(newProd);
    this.saveProducts();
    this.notify();

    try {
      const docRef = doc(db, 'products_and_services', newProd.id);
      setDoc(docRef, newProd, { merge: true }).catch(() => { });
    } catch { }

    return newProd;
  }

  public updateProduct(id: string, updates: Partial<ProductAndServiceItem>): void {
    const target = this.products.find((p) => p.id === id);
    if (!target) return;

    if (updates.tokenAmount !== undefined) {
      const wholeTokens = Math.max(1, Math.ceil(updates.tokenAmount));
      target.tokenAmount = wholeTokens;
      target.priceAud = wholeTokens * (this.settings.defaultTokenPriceAud || 1);
      target.priceUsdEstimated = this.convertAudToUsd(target.priceAud);
    }

    if (updates.name) target.name = updates.name.trim();
    if (updates.description) target.description = updates.description.trim();
    if (updates.category) target.category = updates.category;
    if (updates.isActive !== undefined) target.isActive = updates.isActive;
    target.updatedAt = new Date().toISOString();

    this.saveProducts();
    this.notify();

    try {
      const docRef = doc(db, 'products_and_services', target.id);
      setDoc(docRef, target, { merge: true }).catch(() => { });
    } catch { }
  }

  public deleteProduct(id: string): void {
    this.products = this.products.filter((p) => p.id !== id);
    this.saveProducts();
    this.notify();
  }

  private saveProducts() {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(this.products));
  }

  // ==========================================
  // SUPERADMIN MESSAGING (Strictly Free Support & Refunds)
  // ==========================================

  public getSuperAdminMessages(senderId?: string): SuperAdminMessage[] {
    if (senderId) {
      return this.superadminMessages.filter((m) => m.senderId === senderId);
    }
    return [...this.superadminMessages];
  }

  public sendSuperAdminMessage(payload: {
    senderId: string;
    senderEmail: string;
    senderName: string;
    senderRole: 'client' | 'lawyer' | 'guest';
    messageType: SuperAdminMessageType;
    subject: string;
    body: string;
  }): SuperAdminMessage {
    const newMsg: SuperAdminMessage = {
      id: 'sam_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4),
      tag: 'lawyerselect',
      source: 'lawyerselect',
      senderId: payload.senderId,
      senderEmail: payload.senderEmail,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      recipientRole: 'superadmin',
      messageType: payload.messageType,
      subject: payload.subject.trim(),
      body: payload.body.trim(),
      costTokens: 0, // Messages to superadmin are strictly free of charge
      costAud: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.superadminMessages = [newMsg, ...this.superadminMessages];
    this.saveSuperAdminMessages();
    this.notify();

    try {
      const docRef = doc(db, 'superadmin_messages', newMsg.id);
      setDoc(docRef, newMsg, { merge: true }).catch(() => { });
    } catch { }

    return newMsg;
  }

  public respondToSuperAdminMessage(messageId: string, responseText: string, status: any): void {
    const msg = this.superadminMessages.find((m) => m.id === messageId);
    if (!msg) return;

    msg.adminResponse = responseText.trim();
    msg.adminRespondedAt = new Date().toISOString();
    msg.status = status;
    msg.updatedAt = new Date().toISOString();

    this.saveSuperAdminMessages();
    this.notify();

    try {
      const docRef = doc(db, 'superadmin_messages', msg.id);
      setDoc(docRef, msg, { merge: true }).catch(() => { });
    } catch { }
  }

  private saveSuperAdminMessages() {
    localStorage.setItem(STORAGE_KEY_SA_MSGS, JSON.stringify(this.superadminMessages));
  }

  // ==========================================
  // LEGAL PROFESSIONALS
  // ==========================================
  public getProfessionals(): LegalProfessional[] {
    return [...this.professionals];
  }

  public addProfessional(pro: LegalProfessional) {
    this.professionals = [pro, ...this.professionals.filter((p) => p.id !== pro.id)];
    this.saveProfessionals();
    this.notify();

    try {
      const docRef = doc(db, 'legal_professionals', pro.id);
      setDoc(docRef, pro, { merge: true }).catch((err) => console.warn('Firestore pro sync notice:', err));
    } catch (e) {
      // offline safe
    }
  }

  private saveProfessionals() {
    localStorage.setItem(STORAGE_KEY_PROS, JSON.stringify(this.professionals));
  }

  // ==========================================
  // DUAL REGISTRATION: LAW FIRMS & PRACTITIONERS
  // ==========================================
  public getLawFirms(): LawFirmRegistration[] {
    return [...this.lawFirms];
  }

  public registerLawFirm(
    firmInput: Omit<LawFirmRegistration, 'id' | 'tag' | 'source' | 'registrationType' | 'status' | 'createdAt' | 'updatedAt'>
  ): LawFirmRegistration {
    const now = new Date().toISOString();
    const newFirm: LawFirmRegistration = {
      ...firmInput,
      id: 'firm_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4),
      tag: 'lawyerselect',
      source: 'lawyerselect',
      registrationType: 'law_firm',
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    };

    this.lawFirms = [newFirm, ...this.lawFirms];
    localStorage.setItem(STORAGE_KEY_FIRMS, JSON.stringify(this.lawFirms));
    this.notify();

    try {
      const docRef = doc(db, 'law_firms', newFirm.id);
      setDoc(docRef, newFirm, { merge: true }).catch(() => { });
    } catch { }

    return newFirm;
  }

  public getPractitionerRegistrations(): PractitionerRegistration[] {
    return [...this.practitionerRegistrations];
  }

  public registerPractitioner(
    pracInput: Omit<PractitionerRegistration, 'id' | 'tag' | 'source' | 'registrationType' | 'status' | 'createdAt' | 'updatedAt'>
  ): { registration: PractitionerRegistration; directoryProfile: LegalProfessional } {
    const now = new Date().toISOString();
    const regId = 'preg_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
    const proId = 'lp_' + Math.random().toString(36).substring(2, 9);

    const registration: PractitionerRegistration = {
      ...pracInput,
      id: regId,
      tag: 'lawyerselect',
      source: 'lawyerselect',
      registrationType: 'individual_practitioner',
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    };

    this.practitionerRegistrations = [registration, ...this.practitionerRegistrations];
    localStorage.setItem(STORAGE_KEY_PRAC_REGS, JSON.stringify(this.practitionerRegistrations));

    const p = pracInput.practitionerProfile;
    const cap = pracInput.operationalCapabilities;
    const comp = pracInput.complianceAndInsurance;

    const validJurisdictions = cap.jurisdictionsAdmitted.filter((j): j is any =>
      ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Federal'].includes(j)
    );

    const directoryProfile: LegalProfessional = {
      id: proId,
      tag: 'lawyerselect',
      source: 'lawyerselect',
      fullName: `${p.prefix ? p.prefix + ' ' : ''}${p.fullLegalName}${p.postNominals ? ', ' + p.postNominals : ''}`.trim(),
      title: p.title,
      firmName: p.affiliatedFirmName || 'Independent Legal Practice',
      email: p.email,
      phone: p.phone,
      jurisdictions: validJurisdictions.length > 0 ? validJurisdictions : ['NSW', 'Federal'],
      practiceAreas:
        cap.primaryPracticeAreas.length > 0
          ? cap.primaryPracticeAreas
          : ['Commercial & Corporate'],
      yearsOfExperience: Math.ceil(p.yearsOfExperience || 10),
      barOrRegistrationNumber: p.practisingCertificate.pcNumber || 'PC-AU-VERIFIED',
      bio: `${pracInput.approvedSheetMeta.executiveSummary} Admitted via ${p.practisingCertificate.admissionJurisdiction}. Insured under ${comp.insurerOrSchemeName} (${comp.policyNumber}). Languages: ${cap.languagesSpoken.join(', ')}.`,
      feeStructure: p.feeStructure,
      hourlyRateAud: Math.ceil(p.hourlyRateAud || 450),
      locationCity: p.locationCity || 'Sydney',
      locationPostcode: p.locationPostcode || '2000',
      isVerified: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.addProfessional(directoryProfile);

    try {
      const docRef = doc(db, 'practitioner_registrations', registration.id);
      setDoc(docRef, registration, { merge: true }).catch(() => { });
    } catch { }

    return { registration, directoryProfile };
  }

  // ==========================================
  // MARKETPLACE CASES (PII-Protected Public Feed)
  // ==========================================
  public getMarketplaceCases(viewerLawyerId?: string): MarketplaceCase[] {
    return this.cases.map((c) => {
      if (c.status === 'claimed' && viewerLawyerId && c.claimedBy === viewerLawyerId) {
        const dossier = this.confidentialDossiers.get(c.id);
        if (dossier) {
          return {
            ...c,
            clientFullName: dossier.clientFullName,
            clientEmail: dossier.clientEmail,
            clientPhone: dossier.clientPhone,
            fullFactualDetails: dossier.fullFactualDetails,
          };
        }
      }

      return {
        ...c,
        clientFullName: undefined,
        clientEmail: undefined,
        clientPhone: undefined,
        fullFactualDetails: undefined,
      };
    });
  }

  public getUnlockedCaseDossier(caseId: string, viewerLawyerId?: string): CaseConfidentialDossier | null {
    const targetCase = this.cases.find((c) => c.id === caseId);
    if (!targetCase || targetCase.status !== 'claimed') return null;
    if (!viewerLawyerId || targetCase.claimedBy !== viewerLawyerId) return null;
    return this.confidentialDossiers.get(caseId) || null;
  }

  public addMarketplaceCase(c: MarketplaceCase) {
    if (c.clientFullName || c.clientEmail || c.clientPhone || c.fullFactualDetails) {
      this.confidentialDossiers.set(c.id, {
        caseId: c.id,
        clientFullName: c.clientFullName || '',
        clientEmail: c.clientEmail || '',
        clientPhone: c.clientPhone || '',
        fullFactualDetails: c.fullFactualDetails,
      });
      this.saveDossiers();
    }

    const publicCase: MarketplaceCase = {
      ...c,
      clientFullName: undefined,
      clientEmail: undefined,
      clientPhone: undefined,
      fullFactualDetails: undefined,
    };

    this.cases = [publicCase, ...this.cases.filter((existing) => existing.id !== c.id)];
    this.saveCases();
    this.notify();

    try {
      const docRef = doc(db, 'marketplace_cases', c.id);
      setDoc(docRef, publicCase, { merge: true }).catch((err) => console.warn('Firestore case sync notice:', err));
    } catch (e) {
      // offline safe
    }
  }

  /**
   * Unlock case lead for $20 flat fee (or 20 tokens)
   */
  public purchaseCaseLead(caseId: string, lawyerId: string, lawyerName: string): MarketplaceCase | null {
    const targetCase = this.cases.find((c) => c.id === caseId);
    if (!targetCase) return null;

    const purchaseId = 'pur_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
    const purchase: CasePurchase = {
      id: purchaseId,
      tag: 'lawyerselect',
      source: 'lawyerselect',
      caseId: caseId,
      legalProfessionalId: lawyerId,
      amount: 2000, // $20.00 AUD (20 tokens)
      currency: 'aud',
      status: 'completed',
      stripeSessionId: 'cs_test_' + Math.random().toString(36).substring(2, 12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.purchases.push(purchase);
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(this.purchases));

    targetCase.status = 'claimed';
    targetCase.claimedBy = lawyerId;
    targetCase.claimedByName = lawyerName;
    targetCase.claimedAt = new Date().toISOString();

    this.saveCases();
    this.notify();

    try {
      const docRef = doc(db, 'marketplace_cases', caseId);
      setDoc(docRef, targetCase, { merge: true }).catch((err) => console.warn('Firestore lead purchase sync:', err));
      const purchaseDocRef = doc(db, 'case_purchases', purchase.id);
      setDoc(purchaseDocRef, purchase, { merge: true }).catch((err) => console.warn('Firestore purchase sync:', err));
    } catch (e) {
      // offline safe
    }

    const dossier = this.confidentialDossiers.get(caseId);
    return {
      ...targetCase,
      clientFullName: dossier?.clientFullName,
      clientEmail: dossier?.clientEmail,
      clientPhone: dossier?.clientPhone,
      fullFactualDetails: dossier?.fullFactualDetails,
    };
  }

  private saveCases() {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(this.cases));
  }

  private saveDossiers() {
    const obj = Object.fromEntries(this.confidentialDossiers.entries());
    localStorage.setItem(STORAGE_KEY_DOSSIERS, JSON.stringify(obj));
  }

  // ==========================================
  // CHAT INTERACTIONS (Strictly 1-on-1 on Selection)
  // ==========================================
  public getChatInteractions(): ChatInteraction[] {
    return [...this.chats];
  }

  public createOrGetChatInteraction(
    clientId: string,
    clientName: string,
    clientEmail: string,
    lawyer: LegalProfessional,
    caseId?: string
  ): ChatInteraction {
    let interaction = this.chats.find(
      (c) => c.clientId === clientId && c.lawyerId === lawyer.id
    );

    if (!interaction) {
      const chatId = 'chat_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
      interaction = {
        id: chatId,
        tag: 'lawyerselect',
        source: 'lawyerselect',
        clientId,
        clientName,
        clientEmail,
        lawyerId: lawyer.id,
        lawyerName: lawyer.fullName,
        lawyerTitle: lawyer.title,
        lawyerFirm: lawyer.firmName,
        caseId: caseId || null,
        status: 'active',
        lastMessageSnippet: `Consultation channel opened with ${lawyer.fullName}.`,
        lastMessageAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_init_' + Date.now(),
            senderId: 'system',
            senderRole: 'system',
            senderName: 'Lawyer Select Concierge',
            content: `Connected with ${lawyer.fullName} (${lawyer.title} at ${lawyer.firmName}). You can now discuss your legal matter securely.`,
            sentAt: new Date().toISOString(),
            read: true,
          },
        ],
      };
      this.chats = [interaction, ...this.chats];
      this.saveChats();
      this.notify();

      try {
        const cleanPayload = JSON.parse(JSON.stringify(interaction));
        const docRef = doc(db, 'chat_interactions', interaction.id);
        setDoc(docRef, cleanPayload, { merge: true }).catch((err) => console.warn('Firestore chat init sync:', err));
      } catch (e) {
        // offline safe
      }
    }

    return interaction;
  }

  public sendMessage(
    interactionId: string,
    senderId: string,
    senderRole: 'client' | 'legal_professional',
    senderName: string,
    content: string
  ): ChatMessage | null {
    const interaction = this.chats.find((c) => c.id === interactionId);
    if (!interaction) return null;

    const newMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4),
      senderId,
      senderRole,
      senderName,
      content: content.trim(),
      sentAt: new Date().toISOString(),
      read: false,
    };

    interaction.messages = interaction.messages || [];
    interaction.messages.push(newMessage);
    interaction.lastMessageSnippet = newMessage.content.substring(0, 120);
    interaction.lastMessageAt = newMessage.sentAt;

    this.saveChats();
    this.notify();

    try {
      const cleanPayload = JSON.parse(JSON.stringify(interaction));
      const docRef = doc(db, 'chat_interactions', interaction.id);
      setDoc(docRef, cleanPayload, { merge: true }).catch((err) => console.warn('Firestore message sync:', err));
    } catch (e) {
      // offline safe
    }

    return newMessage;
  }

  private saveChats() {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(this.chats));
  }

  public saveEncryptedLawyerApplication(record: EncryptedLawyerApplicationRecord): void {
    try {
      const storageKey = 'lawyerselect_encrypted_applications_v1';
      const existingRaw = localStorage.getItem(storageKey);
      const list: EncryptedLawyerApplicationRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = list.filter((item) => item.id !== record.id);
      filtered.unshift(record);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Local encrypted application storage notice:', e);
    }

    try {
      const cleanPayload = JSON.parse(JSON.stringify(record));
      const docRef = doc(db, 'lawyer_applications', record.id);
      setDoc(docRef, cleanPayload, { merge: true }).catch((err) =>
        console.warn('Firestore lawyer_applications sync notice:', err)
      );
    } catch {
      // Offline safe fallback
    }
  }

  public getClientTokens(): number {
    return this.clientTokens;
  }

  public getProfileUnlockCost(): number {
    const prod = this.products.find((p) => p.id === 'prod_profile_unlock');
    return prod ? Math.ceil(prod.tokenAmount) : 1;
  }

  public isProfessionalContactUnlocked(proId: string): boolean {
    return this.unlockedProfessionalIds.includes(proId);
  }

  public unlockProfessionalContact(proId: string): { success: boolean; message: string } {
    if (this.unlockedProfessionalIds.includes(proId)) {
      return { success: true, message: 'Contact channels already unlocked.' };
    }
    const cost = this.getProfileUnlockCost();
    if (this.clientTokens < cost) {
      return { success: false, message: `Insufficient tokens. Unlocking requires ${cost} token(s).` };
    }
    this.clientTokens = Math.max(0, this.clientTokens - cost);
    this.unlockedProfessionalIds.push(proId);
    localStorage.setItem('lawyerselect_unlocked_pros_v1', JSON.stringify(this.unlockedProfessionalIds));
    localStorage.setItem('lawyerselect_client_tokens_v1', String(this.clientTokens));
    this.notify();
    return { success: true, message: `Contact unlocked successfully (-${cost} token).` };
  }

  public addClientTokens(amount: number): void {
    const cleanAmount = Math.max(0, Math.ceil(amount));
    this.clientTokens += cleanAmount;
    localStorage.setItem('lawyerselect_client_tokens_v1', String(this.clientTokens));
    this.notify();
  }
}

export const lawyerSelectStore = new LawyerSelectStore();
