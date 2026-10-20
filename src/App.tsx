import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab, UserPersona } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AiMatchmaker } from './components/AiMatchmaker';
import { MarketplaceCaseBoard } from './components/MarketplaceCaseBoard';
import { PostCaseIntake } from './components/PostCaseIntake';
import { AiLawyerOnboarding } from './components/AiLawyerOnboarding';
import { ChatMessenger } from './components/ChatMessenger';
import { LegalDirectory } from './components/LegalDirectory';
import { LegalCorpusExplorer } from './components/LegalCorpusExplorer';
import { lawyerSelectStore } from './services/lawyerSelectStore';
import { LegalProfessional, MarketplaceCase, ChatInteraction } from './types';
import { Scale, ShieldCheck, Lock, Sparkles, Heart } from './components/icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('matchmaker');
  const [userPersona, setUserPersona] = useState<UserPersona>('client');
  const [professionals, setProfessionals] = useState<LegalProfessional[]>([]);
  const [cases, setCases] = useState<MarketplaceCase[]>([]);
  const [chatInteractions, setChatInteractions] = useState<ChatInteraction[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Sync state with lawyerSelectStore
  useEffect(() => {
    const updateFromStore = () => {
      setProfessionals(lawyerSelectStore.getProfessionals());
      setCases(lawyerSelectStore.getMarketplaceCases());
      const chats = lawyerSelectStore.getChatInteractions();
      setChatInteractions(chats);
      if (chats.length > 0 && !activeChatId) {
        setActiveChatId(chats[0].id);
      }
    };

    updateFromStore();
    const unsubscribe = lawyerSelectStore.subscribe(updateFromStore);
    return () => unsubscribe();
  }, [activeChatId]);

  // Current active lawyer for the "Legal Pro" persona view
  const currentLawyer = professionals.find((p) => p.id === 'lp_elena_vance') || professionals[0];

  // Handler: Select a lawyer from Matchmaker or Directory to open private chat
  const handleOpenChatWithLawyer = (lawyer: LegalProfessional, caseId?: string) => {
    const interaction = lawyerSelectStore.createOrGetChatInteraction(
      'client_david_user',
      'David K. (Corporate Client)',
      'david.k@enterprise-nsw.com.au',
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
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
              onPostCaseClick={() => setActiveTab('postcase')}
            />
            <div id="ai-match-container">
              <AiMatchmaker
                professionals={professionals}
                onOpenChat={handleOpenChatWithLawyer}
              />
            </div>
          </>
        )}

        {activeTab === 'caseboard' && (
          <MarketplaceCaseBoard
            cases={cases}
            currentLawyer={currentLawyer}
            onOpenChatWithClient={handleOpenChatWithCaseClient}
          />
        )}

        {activeTab === 'postcase' && (
          <PostCaseIntake
            onCasePosted={(newCase) => {
              setActiveTab('caseboard');
            }}
          />
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
                <span>Stripe PCI DSS Level 1 Lead Checkout</span>
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

    </div>
  );
}
