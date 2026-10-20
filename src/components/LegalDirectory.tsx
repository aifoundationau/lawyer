import React, { useState } from 'react';
import { Users, Search, MapPin, Scale, MessageSquare, Award, CheckCircle2 } from './icons';
import { LegalProfessional, LegalTitle, Jurisdiction } from '../types';

interface LegalDirectoryProps {
  professionals: LegalProfessional[];
  onSelectLawyer: (pro: LegalProfessional) => void;
}

export const LegalDirectory: React.FC<LegalDirectoryProps> = ({ professionals, onSelectLawyer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTitle, setSelectedTitle] = useState<string>('All');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('All');

  const titles = [
    'All',
    'Solicitor',
    'Barrister',
    'Conveyancer',
    'Mediator',
    'Migration Agent',
    'Notary Public',
    'Patent Attorney',
  ];

  const jurisdictions = ['All', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'Federal'];

  const filtered = professionals.filter((pro) => {
    if (selectedTitle !== 'All' && pro.title !== selectedTitle) return false;
    if (selectedJurisdiction !== 'All' && !pro.jurisdictions.includes(selectedJurisdiction as Jurisdiction)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = pro.fullName.toLowerCase().includes(q);
      const matchFirm = pro.firmName.toLowerCase().includes(q);
      const matchArea = pro.practiceAreas.some((a) => a.toLowerCase().includes(q));
      const matchBio = pro.bio.toLowerCase().includes(q);
      if (!matchName && !matchFirm && !matchArea && !matchBio) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge-gold">
            <Users size={14} />
            <span>National Directory</span>
          </span>
          <span className="badge-blue">
            <span>All Australian Legal Disciplines</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '0.75rem' }}>
          Explore Verified Legal Practitioners
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Certified practitioners across Australia. Connect directly or let our AI Matchmaker pair you with the best 3 specialists for your dispute.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by practitioner name, firm, practice area, or keywords..."
            className="input-luxury"
            style={{ paddingLeft: '2.8rem' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, marginRight: '0.25rem' }}>
              Discipline:
            </span>
            {titles.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTitle(t)}
                className={selectedTitle === t ? 'btn-gold' : 'btn-ghost'}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)' }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, marginRight: '0.25rem' }}>
              State:
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

        </div>

      </div>

      {/* Directory Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem',
      }}>
        {filtered.map((pro) => (
          <div key={pro.id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge-blue">{pro.title}</span>
                <span className="badge-emerald" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={12} />
                  <span>Verified</span>
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.25rem' }}>
                {pro.fullName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--gold-light)', fontWeight: 600, marginBottom: '0.75rem' }}>
                {pro.firmName}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                <MapPin size={14} style={{ color: 'var(--gold-primary)' }} />
                <span>{pro.locationCity} • {pro.jurisdictions.join(', ')}</span>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {pro.bio}
              </p>

              {/* Practice Areas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
                {pro.practiceAreas.slice(0, 3).map((a, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {a}
                  </span>
                ))}
                {pro.practiceAreas.length > 3 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                    +{pro.practiceAreas.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Fee Structure</span>
                <strong style={{ fontSize: '0.88rem', color: '#fff' }}>
                  {pro.feeStructure} {pro.hourlyRateAud > 0 ? `($${pro.hourlyRateAud}/hr)` : ''}
                </strong>
              </div>

              <button
                onClick={() => onSelectLawyer(pro)}
                className="btn-gold"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                <MessageSquare size={14} />
                <span>Select & Chat</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
