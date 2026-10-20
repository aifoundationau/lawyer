import { LegalProfessional, MarketplaceCase, ChatInteraction, ChatMessage, CasePurchase } from '../types';
import { SEED_LEGAL_PROFESSIONALS } from '../data/seedLawyers';
import { SEED_MARKETPLACE_CASES } from '../data/seedCases';
import { db } from '../config/firebase';
import { collection, doc, setDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY_PROS = 'lawyerselect_professionals_v1';
const STORAGE_KEY_CASES = 'lawyerselect_cases_v1';
const STORAGE_KEY_CHATS = 'lawyerselect_chats_v1';
const STORAGE_KEY_PURCHASES = 'lawyerselect_purchases_v1';

class LawyerSelectStore {
  private professionals: LegalProfessional[] = [];
  private cases: MarketplaceCase[] = [];
  private chats: ChatInteraction[] = [];
  private purchases: CasePurchase[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadInitialData();
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

    // 2. Load Cases
    const storedCases = localStorage.getItem(STORAGE_KEY_CASES);
    if (storedCases) {
      try {
        this.cases = JSON.parse(storedCases);
      } catch {
        this.cases = [...SEED_MARKETPLACE_CASES];
      }
    } else {
      this.cases = [...SEED_MARKETPLACE_CASES];
      this.saveCases();
    }

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
  // MARKETPLACE CASES
  // ==========================================
  public getMarketplaceCases(): MarketplaceCase[] {
    return [...this.cases];
  }

  public addMarketplaceCase(c: MarketplaceCase) {
    this.cases = [c, ...this.cases.filter((existing) => existing.id !== c.id)];
    this.saveCases();
    this.notify();

    try {
      const docRef = doc(db, 'marketplace_cases', c.id);
      setDoc(docRef, c, { merge: true }).catch((err) => console.warn('Firestore case sync notice:', err));
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
    } catch (e) {
      // offline safe
    }

    return targetCase;
  }

  private saveCases() {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(this.cases));
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
        clientId,
        clientName,
        clientEmail,
        lawyerId: lawyer.id,
        lawyerName: lawyer.fullName,
        lawyerTitle: lawyer.title,
        lawyerFirm: lawyer.firmName,
        caseId,
        status: 'active',
        lastMessageSnippet: `Consultation channel opened with ${lawyer.fullName}.`,
        lastMessageAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_init_' + Date.now(),
            senderId: 'system',
            senderRole: 'client',
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
        const docRef = doc(db, 'chat_interactions', interaction.id);
        setDoc(docRef, interaction, { merge: true }).catch((err) => console.warn('Firestore chat init sync:', err));
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
      const docRef = doc(db, 'chat_interactions', interaction.id);
      setDoc(docRef, interaction, { merge: true }).catch((err) => console.warn('Firestore message sync:', err));
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
