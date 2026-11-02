import React from 'react';
import { X, Award, Sparkles, MapPin, Globe, User } from './icons';

interface AboutDavidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDavidModal: React.FC<AboutDavidModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-david-title"
      data-agent-id="about-david-modal-backdrop"
      data-testid="about-david-modal"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(94vw, 760px)',
          maxHeight: '90vh',
          backgroundColor: '#0a0e17',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-light)',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h2
                id="about-david-title"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#ffffff',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.02em',
                }}
              >
                About David Robertson
              </h2>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Founder of the AI Foundation • University Convenor & AI Specialist
              </p>
            </div>
          </div>

          <button
            type="button"
            data-agent-id="about-david-close-btn"
            data-testid="about-david-close-btn"
            aria-label="Close About David Popup"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Portrait + Bio */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          {/* Left Column: Portrait & Credentials */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: '180px',
                height: '240px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(212, 175, 55, 0.45)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(212, 175, 55, 0.2)',
                marginBottom: '1rem',
                backgroundColor: '#111827',
              }}
            >
              <img
                src="/images/david-robertson.jpg"
                alt="David Robertson"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  // Fallback avatar if local image copy is still finalizing
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                }}
              />
            </div>

            <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 0.3rem', fontWeight: 700 }}>
              David Robertson
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--gold-light)', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
              Founder, AI Foundation
            </span>

            {/* Quick Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                }}
              >
                🎓 MBA in Digital Transformation
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                }}
              >
                📜 Master's in Applied Linguistics
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                }}
              >
                🇦🇺 Govt Trainer & Assessor (TAE40110)
              </div>
              <div
                style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.74rem',
                  color: 'var(--gold-light)',
                  fontWeight: 600,
                }}
              >
                🔬 HDR Researcher: AI in Education
              </div>
            </div>
          </div>

          {/* Right Column: Narrative Biography */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.88rem', lineHeight: 1.65, color: '#e2e8f0' }}>
            <p style={{ margin: 0 }}>
              <strong>David Robertson</strong> is an Australian AI and digital transformation specialist, university lecturer, and founder of the AI Foundation. He holds an MBA in Digital Transformation, a Master's degree in Applied Linguistics, and is a certified Australian Government Trainer and Assessor (TAE40110) currently completing Higher Degree by Research (HDR) thesis work in AI for education and training.
            </p>

            <p style={{ margin: 0 }}>
              As a university convenor specializing in business applications for artificial intelligence and agentic systems, his work bridges technical engineering and operational strategy by designing custom, vendor-agnostic AI agent ecosystems, structured data pipelines, and practical automation tools. Over a multi-decade career spanning Australia, Japan, and Southeast Asia, Robertson has spearheaded digital transformation across corporate, higher education, medical regulatory, and small-business sectors.
            </p>

            <p style={{ margin: 0 }}>
              Currently developing an AI Centre in Phnom Penh, he focuses on scaling agentic AI capabilities, practical business automation, and workforce digital skills across Southeast Asia.
            </p>

            {/* Geographical Footprint */}
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.78rem',
                color: 'var(--gold-light)',
              }}
            >
              <Globe size={16} />
              <span>
                <strong>Global Leadership:</strong> Australia • Japan • Southeast Asia (Phnom Penh AI Centre)
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(6, 8, 13, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
            <span>AI Foundation • Advancing Agentic Systems & Digital Transformation</span>
          </div>

          <button
            type="button"
            data-agent-id="about-david-close-action-btn"
            data-testid="about-david-close-action-btn"
            onClick={onClose}
            className="btn-gold"
            style={{ padding: '0.4rem 1.15rem', fontSize: '0.78rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

