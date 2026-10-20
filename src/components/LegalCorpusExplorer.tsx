import React, { useState } from 'react';
import { Search, Scale, BookOpen, ExternalLink, Copy, Check, Sparkles, Filter } from './icons';
import { legalCorpusService } from '../services/legalCorpusService';
import { LegalCorpusDocument } from '../data/openAustralianLegalCorpus';

export interface LegalCorpusExplorerProps {
  onSelectTopic?: (topic: string) => void;
}

export const LegalCorpusExplorer: React.FC<LegalCorpusExplorerProps> = ({ onSelectTopic }) => {
  const [query, setQuery] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const status = legalCorpusService.getStatus();

  const documents = legalCorpusService.searchCorpus({
    query,
    jurisdiction: selectedJurisdiction,
    category: selectedCategory,
  });

  const jurisdictions = ['All', 'Commonwealth', 'NSW', 'VIC', 'QLD', 'WA', 'Federal'];
  const categories = [
    'All',
    'Commercial & Corporate',
    'Property & Conveyancing',
    'Employment & Workplace',
    'Immigration Law',
    'Defamation & Media',
    'Administrative Law',
  ];

  const handleCopyCitation = (doc: LegalCorpusDocument) => {
    navigator.clipboard.writeText(doc.citation);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge-gold">
            <BookOpen size={14} />
            <span>Open Australian Legal Corpus (OALC)</span>
          </span>
          <span className="badge-blue">
            <span>isaacus/open-australian-legal-corpus</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '0.75rem' }}>
          Australian Legal Intelligence & Statutory Precedents
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '780px', margin: '0 auto', lineHeight: 1.6 }}>
          Powered by Isaacus’s open multijurisdictional corpus of Australian legislation, regulations, and judicial decisions. 
          Used by Lawyer Select’s AI engine to ground lawyer matches and case analysis in primary law.
        </p>
      </div>

      {/* Dataset Link Card */}
      <div className="glass-panel glass-panel-gold" style={{ padding: '1.25rem 1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(229, 169, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
            <Scale size={22} />
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.15rem' }}>
              Hugging Face Dataset Integration
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Identifier: <code>{status.datasetName}</code> • Scope: {status.totalCorpusTokens}
            </p>
          </div>
        </div>

        <a
          href={status.hfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold"
          style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
        >
          <span>View on Hugging Face</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search statutes, section numbers, case names (e.g. 'Retail Leases Act', 's 365', 'Voller')..."
            className="input-luxury"
            style={{ paddingLeft: '2.8rem' }}
          />
        </div>

        {/* Filter Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Jurisdiction:
            </span>
            {jurisdictions.map((j) => (
              <button
                key={j}
                onClick={() => setSelectedJurisdiction(j)}
                className={selectedJurisdiction === j ? 'btn-gold' : 'btn-ghost'}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)' }}
              >
                {j}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Area of Law:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-luxury"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Document Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {documents.map((doc) => (
          <div key={doc.id} className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid var(--gold-primary)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge-gold">{doc.jurisdiction}</span>
                <span className="badge-blue">{doc.category}</span>
                <span className="badge-emerald" style={{ fontSize: '0.75rem' }}>{doc.documentType}</span>
              </div>

              <button
                onClick={() => handleCopyCitation(doc)}
                className="btn-ghost"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                title="Copy standard legal citation"
              >
                {copiedId === doc.id ? (
                  <>
                    <Check size={13} style={{ color: '#34d399' }} />
                    <span style={{ color: '#34d399' }}>Copied Citation</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Citation</span>
                  </>
                )}
              </button>
            </div>

            <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.25rem' }}>
              {doc.title}
            </h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--gold-light)', marginBottom: '1rem' }}>
              {doc.citation}
            </p>

            {/* Key Sections Pill List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {doc.keySections.map((sec, idx) => (
                <span key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-main)',
                }}>
                  {sec}
                </span>
              ))}
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
              {doc.summary}
            </p>

            <div style={{
              background: 'rgba(10, 14, 23, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <Sparkles size={16} style={{ color: 'var(--gold-light)', flexShrink: 0, marginTop: '0.15rem' }} />
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--gold-light)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Practical Legal Application:
                </span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '0.15rem', lineHeight: 1.5 }}>
                  {doc.practicalApplication}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
