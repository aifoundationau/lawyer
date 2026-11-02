import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab, UserPersona } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AiMatchmaker } from './components/AiMatchmaker';
import { AiLawyerOnboarding } from './components/AiLawyerOnboarding';
import { ChatMessenger } from './components/ChatMessenger';
import { LegalDirectory } from './components/LegalDirectory';
import { LegalCorpusExplorer } from './components/LegalCorpusExplorer';
import { lawyerSelectStore } from './services/lawyerSelectStore';
import { LegalProfessional, MarketplaceCase, ChatInteraction } from './types';
import { Scale, ShieldCheck, Lock, Sparkles, Heart } from './components/icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { GeoFooterWidget } from './components/GeoFooterWidget';

function AppContent() {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('matchmaker');
  const [userPersona, setUserPersona] = useState<UserPersona>('client');
  const [professionals, setProfessionals] = useState<LegalProfessional[]>([]);
  const [cases, setCases] = useState<MarketplaceCase[]>([]);
  const [chatInteractions, setChatInteractions] = useState<ChatInteraction[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Sync user persona tab view when user role updates
  useEffect(() => {
    if (currentUser?.role === 'lawyer') {
      setUserPersona('lawyer');
    } else if (currentUser?.role === 'client') {
      setUserPersona('client');
    }
  }, [currentUser?.role]);

  // Current active lawyer for the "Legal Pro" persona view (bound to authenticated user if lawyer)
  const currentLawyer = (currentUser?.lawyerProfileId 
    ? professionals.find((p) => p.id === currentUser.lawyerProfileId)
    : undefined) || professionals.find((p) => p.id === 'lp_elena_vance') || professionals[0];

  const activeLawyerId = currentUser?.role === 'lawyer'
    ? (currentUser.lawyerProfileId || currentUser.uid || currentLawyer?.id)
    : undefined;

  // Sync state with lawyerSelectStore
  useEffect(() => {
    const updateFromStore = () => {
      setProfessionals(lawyerSelectStore.getProfessionals());
      setCases(lawyerSelectStore.getMarketplaceCases(activeLawyerId));
      const chats = lawyerSelectStore.getChatInteractions();
      setChatInteractions(chats);
      if (chats.length > 0 && !activeChatId) {
        setActiveChatId(chats[0].id);
      }
    };

    updateFromStore();
    const unsubscribe = lawyerSelectStore.subscribe(updateFromStore);
    return () => unsubscribe();
  }, [activeChatId, activeLawyerId]);

  // Handle return from Stripe checkout payment with server session verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get('payment_success');
    const caseIdParam = params.get('case_id');
    const sessionIdParam = params.get('session_id');

    if (paymentSuccess === 'true' && (caseIdParam || sessionIdParam)) {
      const verifyAndUnlock = async () => {
        let targetCaseId = caseIdParam;
        let claimingLawyerId = activeLawyerId || currentLawyer?.id || 'lp_elena_vance';
        let claimingLawyerName = currentLawyer?.fullName || currentUser?.displayName || 'Elena Vance SC';

        if (sessionIdParam) {
          try {
            const res = await fetch(`/api/checkout/verify-session?sessionId=${sessionIdParam}`);
            if (res.ok) {
              const data = await res.json();
              if (data.verified) {
                if (data.caseId) targetCaseId = data.caseId;
                if (data.lawyerId) claimingLawyerId = data.lawyerId;
                if (data.lawyerName) claimingLawyerName = data.lawyerName;
              }
            }
          } catch (err) {
            console.warn('Session verification fallback notice:', err);
          }
        }

        if (targetCaseId) {
          lawyerSelectStore.purchaseCaseLead(targetCaseId, claimingLawyerId, claimingLawyerName);
          // Refresh cases immediately so the unlocked dossier is attached for this lawyer
          setCases(lawyerSelectStore.getMarketplaceCases(claimingLawyerId));
        }

        setUserPersona('lawyer');
        setActiveTab('directory');
      };

      verifyAndUnlock();
    }
  }, [currentLawyer, activeLawyerId]);

  // Handler: Select a lawyer from Matchmaker or Directory to open private chat
  const handleOpenChatWithLawyer = (lawyer: LegalProfessional, caseId?: string) => {
    const clientId = currentUser ? currentUser.uid : 'client_user';
    const clientName = currentUser ? currentUser.displayName : 'Client';
    const clientEmail = currentUser ? currentUser.email : 'client@lawyerselect.com.au';

    const interaction = lawyerSelectStore.createOrGetChatInteraction(
      clientId,
      clientName,
      clientEmail,
      lawyer,
      caseId
    );

    setActiveChatId(interaction.id);
    setActiveTab('chat');
  };

  // Handler: Lawyer opens direct chat with client from unlocked case
  const handleOpenChatWithCaseClient = (c: MarketplaceCase) => {
    const interaction = lawyerSelectStore.createOrGetChatInteraction(
      'client_' + c.id,
      c.clientFullName || 'Client',
      c.clientEmail || 'client@lawyerselect.com.au',
      currentLawyer,
      c.id
    );

    setActiveChatId(interaction.id);
    setActiveTab('chat');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '38px' }}>
      {/* Authentication Modal */}
      <AuthModal />
      
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userPersona={userPersona}
        setUserPersona={setUserPersona}
        unreadChatCount={chatInteractions.length}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'matchmaker' && (
          <>
            <HeroBanner
              onSearchClick={() => {
                const el = document.getElementById('ai-match-container');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <div id="ai-match-container">
              <AiMatchmaker
                professionals={professionals}
                onOpenChat={handleOpenChatWithLawyer}
              />
            </div>
          </>
        )}

        {activeTab === 'onboarding' && (
          <AiLawyerOnboarding
            onProfilePublished={(newPro) => {
              setActiveTab('directory');
            }}
          />
        )}

        {activeTab === 'chat' && (
          <ChatMessenger
            chatInteractions={chatInteractions}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            userPersona={userPersona}
            setUserPersona={setUserPersona}
            onGoToMatchmaker={() => setActiveTab('matchmaker')}
          />
        )}

        {activeTab === 'directory' && (
          <LegalDirectory
            professionals={professionals}
            onSelectLawyer={handleOpenChatWithLawyer}
          />
        )}

        {activeTab === 'corpus' && (
          <LegalCorpusExplorer
            onSelectTopic={() => {
              setActiveTab('matchmaker');
            }}
          />
        )}
      </main>

      {/* Luxury Footer */}
      <footer style={{
        background: 'rgba(6, 8, 13, 0.95)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '3rem 1.5rem 2rem',
        marginTop: '4rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2.5rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Scale size={22} style={{ color: 'var(--gold-primary)' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                LAWYER SELECT
              </span>
              <span className="badge-gold">#lawyerselect</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              The unified intelligence exchange for all Australian legal professions. Connecting consumers with solicitors, barristers, conveyancers, and mediators via AI.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              Legal Disciplines
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>• Solicitors & Commercial Barristers</li>
              <li>• Licensed Property Conveyancers</li>
              <li>• NMAS Accredited Mediators</li>
              <li>• Registered Migration Agents (MARA)</li>
              <li>• Notaries Public & Patent Attorneys</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              System Integrity & Compliance
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={14} style={{ color: '#34d399' }} />
                <span>Australian Privacy Act 1988 & APP 11</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Lock size={14} style={{ color: 'var(--gold-light)' }} />
                <span>Stripe PCI DSS Level 1 Secure Payments</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Sparkles size={14} style={{ color: '#60a5fa' }} />
                <span>Gemini 3.8 Flash AI Model Routing</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
        }}>
          <div>
            © 2026 Lawyer Select Pty Ltd • All Rights Reserved • Tag: <code>#lawyerselect</code>
          </div>
          <div>
            Data Contracts Version: <code>1.0.0-IMMUTABLE</code> • Retention: 7 Years Statutory
          </div>
        </div>
      </footer>

      {/* Geolocation, Weather, Time & Daily AUD/USD Converter Thin Footer Bar */}
      <GeoFooterWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
