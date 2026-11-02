import React from 'react';
import { Sparkles, ShieldCheck, Scale, Zap, Lock } from './icons';

interface HeroBannerProps {
  onSearchClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSearchClick }) => {
  return (
    <div style={{
      position: 'relative',
      padding: '3.5rem 1.5rem 2.5rem',
      background: 'linear-gradient(180deg, rgba(16, 22, 34, 0.4) 0%, rgba(6, 8, 13, 0) 100%)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Top Tagline Pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="badge-gold pulse-glow" style={{ padding: '0.35rem 0.85rem' }}>
            <Sparkles size={14} />
            <span>Next-Generation Australian Legal Intelligence</span>
          </span>
          <span className="badge-emerald" style={{ padding: '0.35rem 0.75rem' }}>
            <ShieldCheck size={14} />
            <span>APP 11 Privacy Certified</span>
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#ffffff',
          marginBottom: '1rem',
          maxWidth: '900px',
          margin: '0 auto 1.25rem',
        }}>
          Search Across <span style={{
            background: 'linear-gradient(135deg, #f5bc54 0%, #e5a93c 60%, #fff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>ALL Legal Professions</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: 'var(--text-muted)',
          maxWidth: '780px',
          margin: '0 auto 2rem',
          lineHeight: 1.6,
        }}>
          Not just lawyers — connect with certified Barristers, Solicitors, Conveyancers, Mediators, 
          Notaries, Migration Agents, and Patent Attorneys. Tell our AI your legal dispute and get the 
          <strong> top 3 curated specialists</strong> suited to your needs.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '3rem',
        }}>
          <button onClick={onSearchClick} className="btn-gold" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            <Sparkles size={18} />
            <span>Find Best 3 Lawyers with AI</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          textAlign: 'left',
        }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(229, 169, 60, 0.15)', color: 'var(--gold-light)' }}>
                <Zap size={20} />
              </div>
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Zero Boring Forms</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Legal professionals enter details in natural language. Our Gemini 3.8 Flash engine structures credentials automatically.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <Scale size={20} />
              </div>
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Top 3 Precise Match</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              AI analyzes case urgency, jurisdiction, and subject matter to pinpoint the 3 most qualified legal specialists.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                <Lock size={20} />
              </div>
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Selected Direct Chat</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Initial contact strictly occurs through Firebase chat interactions. Only clients who select a lawyer can initiate contact.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
