import { LegalProfessional, MarketplaceCase, ChatInteraction, ChatMessage, CasePurchase, CaseConfidentialDossier } from '../types';
import { SEED_LEGAL_PROFESSIONALS } from '../data/seedLawyers';
import { SEED_MARKETPLACE_CASES, SEED_CONFIDENTIAL_DOSSIERS } from '../data/seedCases';
import { db } from '../config/firebase';
import { collection, doc, setDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY_PROS = 'lawyerselect_professionals_v1';
const STORAGE_KEY_CASES = 'lawyerselect_cases_v1';
const STORAGE_KEY_DOSSIERS = 'lawyerselect_dossiers_vault_v1';
const STORAGE_KEY_CHATS = 'lawyerselect_chats_v1';
const STORAGE_KEY_PURCHASES = 'lawyerselect_purchases_v1';

class LawyerSelectStore {
  private professionals: LegalProfessional[] = [];
  private cases: MarketplaceCase[] = [];
  private confidentialDossiers: Map<string, CaseConfidentialDossier> = new Map();
  private chats: ChatInteraction[] = [];
  private purchases: CasePurchase[] = [];
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
      // Create initial demo chat
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
  }

  /**
   * Real-time multi-user synchronization with Cloud Firestore.
   * Ensures matters, profiles, chats, and claims reflect live across all client devices.
   */
  private initFirestoreSync() {
    try {
      // 1. Live Sync Marketplace Cases (guaranteeing public PII scrub)
      onSnapshot(
        collection(db, 'marketplace_cases'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteCases: MarketplaceCase[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as MarketplaceCase;
              // Mandatory PII scrub: never allow raw PII from public collection
              remoteCases.push({
                ...data,
                id: docSnap.id,
                clientFullName: undefined,
                clientEmail: undefined,
                clientPhone: undefined,
                fullFactualDetails: undefined,
              });
            });

            // Merge with local state, preserving local cases while taking latest remote data
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
        (err) => {
          console.warn('Firestore marketplace_cases sync notice:', err.message);
        }
      );

      // 2. Live Sync Legal Professionals
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
        (err) => {
          console.warn('Firestore legal_professionals sync notice:', err.message);
        }
      );

      // 3. Live Sync Chat Interactions
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
                // Merge message histories by ID and sort chronologically
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
        (err) => {
          console.warn('Firestore chat_interactions sync notice:', err.message);
        }
      );

      // 4. Live Sync Case Purchases
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
        (err) => {
          console.warn('Firestore case_purchases sync notice:', err.message);
        }
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
  // LEGAL PROFESSIONALS
  // ==========================================
  public getProfessionals(): LegalProfessional[] {
    return [...this.professionals];
  }

  public addProfessional(pro: LegalProfessional) {
    this.professionals = [pro, ...this.professionals.filter((p) => p.id !== pro.id)];
    this.saveProfessionals();
    this.notify();

    // Async sync to Firestore
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
  // MARKETPLACE CASES (PII-Protected Public Feed)
  // ==========================================
  public getMarketplaceCases(viewerLawyerId?: string): MarketplaceCase[] {
    return this.cases.map((c) => {
      // Attach confidential dossier ONLY if the case is claimed AND the viewer is the claiming lawyer
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

      // For open, locked, or claimed cases viewed by non-purchaser, PII is strictly stripped
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
    // If incoming submission includes confidential PII, archive it securely in the vault
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

    // Strip PII from public case
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
   * Unlock case lead for $20 flat fee
   */
  public purchaseCaseLead(caseId: string, lawyerId: string, lawyerName: string): MarketplaceCase | null {
    const targetCase = this.cases.find((c) => c.id === caseId);
    if (!targetCase) return null;

    const purchaseId = 'pur_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
    const purchase: CasePurchase = {
      id: purchaseId,
      tag: 'lawyerselect',
      caseId: caseId,
      legalProfessionalId: lawyerId,
      amount: 2000, // $20.00 AUD
      currency: 'aud',
      status: 'completed',
      stripeSessionId: 'cs_test_' + Math.random().toString(36).substring(2, 12),
      createdAt: new Date().toISOString(),
    };

    this.purchases.push(purchase);
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(this.purchases));

    // Update case status to claimed
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

  /**
   * Creates or gets a chat interaction strictly when client selects to speak with a lawyer.
   */
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
        source: 'lawyerselect' as any,
        clientId,
        clientName,
        clientEmail,
        lawyerId: lawyer.id,
        lawyerName: lawyer.fullName,
        lawyerTitle: lawyer.title,
        lawyerFirm: lawyer.firmName,
        caseId: caseId || null as any,
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
}

export const lawyerSelectStore = new LawyerSelectStore();
