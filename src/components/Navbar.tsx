import { Scale, Briefcase, FileText, Sparkles, MessageSquare, Users, Shield, UserCheck, ArrowRightLeft } from './icons';

export type ActiveTab = 'matchmaker' | 'caseboard' | 'postcase' | 'onboarding' | 'chat' | 'directory';
export type UserPersona = 'client' | 'lawyer';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userPersona: UserPersona;
  setUserPersona: (persona: UserPersona) => void;
  unreadChatCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userPersona,
  setUserPersona,
  unreadChatCount,
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(6, 8, 13, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('matchmaker')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(229, 169, 60, 0.25), rgba(229, 169, 60, 0.05))',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-light)',
          }}>
            <Scale size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#fff',
              }}>
                LAWYER SELECT
              </span>
              <span className="badge-gold" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                #lawyerselect
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
              All Legal Professions • AI Match & Case Exchange
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(16, 22, 34, 0.6)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          maxWidth: '100%',
        }}>
          <button
            onClick={() => setActiveTab('matchmaker')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'matchmaker' ? 'var(--gold-glow)' : 'transparent',
              color: activeTab === 'matchmaker' ? 'var(--gold-light)' : 'var(--text-muted)',
              borderBottom: activeTab === 'matchmaker' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={15} />
            <span>AI Match (Top 3)</span>
          </button>

          <button
            onClick={() => setActiveTab('caseboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'caseboard' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'caseboard' ? '#60a5fa' : 'var(--text-muted)',
              borderBottom: activeTab === 'caseboard' ? '1px solid #3b82f6' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <Briefcase size={15} />
            <span>Case Feed ($20 Leads)</span>
          </button>

          <button
            onClick={() => setActiveTab('postcase')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'postcase' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'postcase' ? '#34d399' : 'var(--text-muted)',
              borderBottom: activeTab === 'postcase' ? '1px solid #10b981' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <FileText size={15} />
            <span>Post a Legal Matter</span>
          </button>

          <button
            onClick={() => setActiveTab('onboarding')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'onboarding' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeTab === 'onboarding' ? '#a78bfa' : 'var(--text-muted)',
              borderBottom: activeTab === 'onboarding' ? '1px solid #8b5cf6' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <UserCheck size={15} />
            <span>Legal Pro AI Intake</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'chat' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
              color: activeTab === 'chat' ? '#fb7185' : 'var(--text-muted)',
              borderBottom: activeTab === 'chat' ? '1px solid #f43f5e' : '1px solid transparent',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            <MessageSquare size={15} />
            <span>Chat</span>
            {unreadChatCount > 0 && (
              <span style={{
                background: 'var(--accent-rose)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 700,
                borderRadius: '999px',
                padding: '0.1rem 0.45rem',
                marginLeft: '0.2rem',
              }}>
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'directory' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: activeTab === 'directory' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            <Users size={15} />
            <span>Directory</span>
          </button>
        </nav>

        {/* Perspective Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(10, 14, 23, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.35rem 0.75rem',
          }}>
            <ArrowRightLeft size={14} style={{ color: 'var(--gold-primary)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                Active Persona
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: userPersona === 'client' ? '#60a5fa' : 'var(--gold-light)' }}>
                {userPersona === 'client' ? 'Client: David K.' : 'Legal Pro: Elena Vance SC'}
              </span>
            </div>
            <button
              onClick={() => setUserPersona(userPersona === 'client' ? 'lawyer' : 'client')}
              className="btn-ghost"
              style={{
                padding: '0.25rem 0.55rem',
                fontSize: '0.72rem',
                borderRadius: 'var(--radius-sm)',
                marginLeft: '0.25rem',
              }}
              title="Switch persona to test both client search & lawyer lead unlock"
            >
              Switch to {userPersona === 'client' ? 'Lawyer' : 'Client'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
