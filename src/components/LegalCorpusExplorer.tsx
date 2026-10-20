import React, { useState } from 'react';
import { Search, Scale, BookOpen, Copy, Check, Sparkles, Filter, Briefcase, Shield, UserCheck, ArrowRight } from './icons';
import { legalCorpusService } from '../services/legalCorpusService';
import { LegalCorpusDocument } from '../data/openAustralianLegalCorpus';

export interface LegalCorpusExplorerProps {
  onSelectTopic?: (topic: string) => void;
}

export const LegalCorpusExplorer: React.FC<LegalCorpusExplorerProps> = ({ onSelectTopic }) => {
  const [query, setQuery] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDocType, setSelectedDocType] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const status = legalCorpusService.getStatus();

  const documents = legalCorpusService.searchCorpus({
    query,
    jurisdiction: selectedJurisdiction,
    category: selectedCategory,
    documentType: selectedDocType,
  });

  const jurisdictions = ['All', 'Commonwealth', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'Federal'];
  const categories = [
    'All',
    'Commercial & Corporate',
    'Employment & Workplace',
    'Property & Conveyancing',
    'Family Law',
    'Building & Construction',
    'Wills & Estates',
    'Defamation & Media',
    'Immigration Law',
    'Criminal & Traffic',
    'Personal Injury & Negligence',
    'IP & Patent Law',
    'Administrative & Public Law',
  ];

  const handleCopyCitation = (doc: LegalCorpusDocument) => {
    navigator.clipboard.writeText(doc.citation);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFindLawyer = (doc: LegalCorpusDocument) => {
    if (onSelectTopic) {
      onSelectTopic(`${doc.title} (${doc.category})`);
    }
  };

  const hasActiveFilters = query.trim() !== '' || selectedJurisdiction !== 'All' || selectedCategory !== 'All' || selectedDocType !== 'All';

  const resetFilters = () => {
    setQuery('');
    setSelectedJurisdiction('All');
    setSelectedCategory('All');
    setSelectedDocType('All');
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <span className="badge-gold">
            <BookOpen size={14} />
            <span>Australian National Legal Library</span>
          </span>
          <span className="badge-blue">
            <span>Primary Law & Precedents</span>
          </span>
        </div>

        <h1 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.85rem', letterSpacing: '-0.02em' }}>
          Statutory Provisions & Judicial Precedents
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '760px', margin: '0 auto', lineHeight: 1.65, fontSize: '0.98rem' }}>
          Search our comprehensive database of Australian Commonwealth and State legislation, regulations, and landmark court decisions. 
          Cross-referenced to determine which accredited legal discipline is qualified to handle your matter.
        </p>
      </div>

      {/* Search & Filter Station */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Search Input Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-primary)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Act, Section, Citation, or Issue (e.g. 'Fair Work s 365', 'sunset clause', 'oppressive conduct', 'Voller', 'unconscionable')..."
            className="input-luxury"
            style={{ paddingLeft: '3.1rem', fontSize: '1rem', height: '52px' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Bar: Jurisdictions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Jurisdiction
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedDocType('All')}
                className={selectedDocType === 'All' ? 'btn-gold' : 'btn-ghost'}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                All Sources
              </button>
              <button
                onClick={() => setSelectedDocType('Legislation')}
                className={selectedDocType === 'Legislation' ? 'btn-gold' : 'btn-ghost'}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                Legislation
              </button>
              <button
                onClick={() => setSelectedDocType('Case Law')}
                className={selectedDocType === 'Case Law' ? 'btn-gold' : 'btn-ghost'}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                Case Law Precedents
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {jurisdictions.map((j) => (
              <button
                key={j}
                onClick={() => setSelectedJurisdiction(j)}
                className={selectedJurisdiction === j ? 'btn-gold' : 'btn-ghost'}
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar: Practice Area Category Chips */}
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Practice Area
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  borderRadius: '999px',
                  border: selectedCategory === c ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  background: selectedCategory === c ? 'rgba(229, 169, 60, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedCategory === c ? 'var(--gold-light)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontWeight: selectedCategory === c ? 600 : 500,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results summary bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: '#fff' }}>{documents.length}</strong> primary statutes & landmark precedents
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-primary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                textDecoration: 'underline',
              }}
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Scale size={42} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            No legal provisions matched your search
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Try adjusting your search terms or clearing jurisdiction and practice area filters.
          </p>
          <button onClick={resetFilters} className="btn-gold" style={{ padding: '0.6rem 1.5rem' }}>
            Reset Search Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {documents.map((doc) => {
            const isCopied = copiedId === doc.id;
            const isCaseLaw = doc.documentType === 'Case Law';

            return (
              <div
                key={doc.id}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  borderLeft: isCaseLaw ? '3px solid #60a5fa' : '3px solid var(--gold-primary)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* Top Badges & Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={isCaseLaw ? 'badge-blue' : 'badge-gold'}>
                      {isCaseLaw ? <Scale size={12} /> : <BookOpen size={12} />}
                      <span>{doc.documentType}</span>
                    </span>

                    <span style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      color: 'var(--text-light)',
                      fontWeight: 600,
                    }}>
                      {doc.jurisdiction}
                    </span>

                    <span style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                    }}>
                      {doc.category}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Authority: <strong style={{ color: 'var(--text-muted)' }}>{doc.sourceAuthority}</strong>
                  </span>
                </div>

                {/* Title & Citation */}
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                    {doc.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <code style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--gold-light)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      {doc.citation}
                    </code>
                    <button
                      onClick={() => handleCopyCitation(doc)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isCopied ? '#34d399' : 'var(--text-dim)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.4rem',
                      }}
                      title="Copy legal citation to clipboard"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? 'Citation Copied' : 'Copy Citation'}</span>
                    </button>
                  </div>
                </div>

                {/* Key Sections / Provisions */}
                {doc.keySections && doc.keySections.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Key Provisions:
                    </span>
                    {doc.keySections.map((sec, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(229, 169, 60, 0.08)',
                          border: '1px solid rgba(229, 169, 60, 0.2)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          color: 'var(--gold-light)',
                        }}
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Plain-English Legal Summary */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold-light)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} />
                    <span>Statutory Summary & Legal Rule</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.6, margin: 0 }}>
                    {doc.summary}
                  </p>
                </div>

                {/* Practical Application & Recommended Profession */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  paddingTop: '0.25rem',
                }}>
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                      When This Applies To You
                    </span>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {doc.practicalApplication}
                    </p>
                  </div>

                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(229, 169, 60, 0.05)',
                    border: '1px solid rgba(229, 169, 60, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                        Qualified Legal Profession
                      </span>
                      <p style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, margin: 0 }}>
                        {doc.recommendedProfession}
                      </p>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        onClick={() => handleFindLawyer(doc)}
                        className="btn-gold"
                        style={{
                          padding: '0.45rem 1rem',
                          fontSize: '0.82rem',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>Find Specialist in this Law</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Library Reference Footnote */}
      <div style={{
        marginTop: '3.5rem',
        padding: '1.5rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          <Shield size={16} />
          <span>Statutory Integrity & Primary Law Grounding</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
          All statutory references, section numbers, and judicial citations in the Lawyer Select Legal Library are maintained in accordance with Commonwealth of Australia, State legislative databases, and authoritative law reporting standards. Information is provided for legal assistance matching and research purposes.
        </p>
      </div>

    </div>
  );
};
