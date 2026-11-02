import { Scale, Sparkles, MessageSquare, Users, Shield, UserCheck, BookOpen, User, LogOut, GoogleIcon } from './icons';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'matchmaker' | 'onboarding' | 'chat' | 'directory' | 'corpus';
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
  const { currentUser, role, isAuthenticated, signOut, signInWithGoogle, setShowAuthModal } = useAuth();
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
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '1rem',
        width: '100%',
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('matchmaker')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
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

          <button
            onClick={() => setActiveTab('corpus')}
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
              background: activeTab === 'corpus' ? 'rgba(229, 169, 60, 0.18)' : 'transparent',
              color: activeTab === 'corpus' ? 'var(--gold-light)' : 'var(--text-muted)',
              borderBottom: activeTab === 'corpus' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <BookOpen size={15} />
            <span>Legal Library</span>
          </button>
        </nav>

        {/* Google Log In / SuperAdmin Account Widget (Pinned Far Top Right) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, marginLeft: 'auto' }}>
          {isAuthenticated && currentUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(10, 14, 23, 0.95)',
              border: currentUser.isSuperAdmin ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
              borderRadius: '999px',
              padding: '0.35rem 0.85rem',
            }}>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentUser.isSuperAdmin ? 'rgba(229, 169, 60, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  border: currentUser.isSuperAdmin ? '1px solid var(--border-gold)' : '1px solid var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentUser.isSuperAdmin ? 'var(--gold-light)' : '#93c5fd',
                }}>
                  <User size={14} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {currentUser.displayName || currentUser.email}
                </span>
                {currentUser.isSuperAdmin ? (
                  <span style={{
                    fontSize: '0.62rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: 'var(--gold-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <Shield size={10} style={{ color: 'var(--gold-light)' }} />
                    SuperAdmin
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.62rem',
                    color: 'var(--text-dim)',
                  }}>
                    {currentUser.email}
                  </span>
                )}
              </div>

              <button
                onClick={signOut}
                className="btn-ghost"
                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#f87171' }}
                title="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              }}
              title="Sign In with Google"
            >
              <GoogleIcon size={18} />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
