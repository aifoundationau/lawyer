import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { Shield, User, Briefcase, Lock, X, CheckCircle2, Sparkles, Scale } from './icons';

export const AuthModal: React.FC = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    signInWithGoogle,
    signInAsDemoClient,
    signInAsDemoLawyer,
    signUpCustom,
  } = useAuth();

  const [activeMode, setActiveMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAuthModal) {
        setShowAuthModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAuthModal, setShowAuthModal]);

  if (!showAuthModal) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter an email address.');
      return;
    }
    if (activeMode === 'register' && !name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    try {
      const displayName = name.trim() || email.split('@')[0];
      signUpCustom(displayName, email, role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
      onClick={() => setShowAuthModal(false)}
    >
      <div
        className="glass-panel glass-panel-gold"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2.25rem',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(229, 169, 60, 0.15)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-light)',
              margin: '0 auto 1rem',
            }}
          >
            <Scale size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.35rem' }}>
            {activeMode === 'signin' ? 'Sign In to Lawyer Select' : 'Create an Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Access Australia’s unified legal intelligence network securely
          </p>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            padding: '0.8rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1.25rem',
          }}
          className="btn-ghost"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Email Sign In / Sign Up Form */}
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {activeMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="input-luxury"
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com.au"
              className="input-luxury"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Account Type / Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setRole('client')}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: role === 'client' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  background: role === 'client' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: role === 'client' ? '#93c5fd' : 'var(--text-dim)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <User size={14} />
                <span>Client / Consumer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('lawyer')}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: role === 'lawyer' ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                  background: role === 'lawyer' ? 'rgba(229, 169, 60, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: role === 'lawyer' ? 'var(--gold-light)' : 'var(--text-dim)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Briefcase size={14} />
                <span>Legal Practitioner</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '0.2rem' }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="btn-gold"
            disabled={isLoading}
            style={{ padding: '0.75rem', marginTop: '0.25rem' }}
          >
            <span>{activeMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setActiveMode(activeMode === 'signin' ? 'register' : 'signin');
                setErrorMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {activeMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        {/* Quick Testing Personas */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'center' }}>
            Quick Demo & Testing Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => signInAsDemoClient('David K.', 'david.k@enterprise-nsw.com.au')}
              className="btn-ghost"
              style={{ padding: '0.5rem', fontSize: '0.75rem', textAlign: 'left' }}
            >
              <div style={{ fontWeight: 700, color: '#60a5fa' }}>Client: David K.</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Corporate Dispute</div>
            </button>

            <button
              type="button"
              onClick={() => signInAsDemoLawyer('lp_elena_vance')}
              className="btn-ghost"
              style={{ padding: '0.5rem', fontSize: '0.75rem', textAlign: 'left' }}
            >
              <div style={{ fontWeight: 700, color: 'var(--gold-light)' }}>Lawyer: Elena Vance</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Barrister (Chambers)</div>
            </button>

            <button
              type="button"
              onClick={() => signInAsDemoLawyer('lp_marcus_sterling')}
              className="btn-ghost"
              style={{ padding: '0.5rem', fontSize: '0.75rem', textAlign: 'left' }}
            >
              <div style={{ fontWeight: 700, color: '#34d399' }}>Lawyer: M. Sterling</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Commercial Solicitor</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
