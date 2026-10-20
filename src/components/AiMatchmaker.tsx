import React, { useState } from 'react';
import { Sparkles, MapPin, Clock, ArrowRight, MessageSquare, Award, CheckCircle2, DollarSign, ShieldAlert } from './icons';
import { LegalProfessional, MatchedProfessionalResult, UrgencyLevel, Jurisdiction } from '../types';
import { matchClientEnquiryWithAI } from '../services/geminiService';
import { lawyerSelectStore } from '../services/lawyerSelectStore';

interface AiMatchmakerProps {
  professionals: LegalProfessional[];
  onOpenChat: (lawyer: LegalProfessional) => void;
}

export const AiMatchmaker: React.FC<AiMatchmakerProps> = ({ professionals, onOpenChat }) => {
  const [enquiry, setEnquiry] = useState('');
  const [location, setLocation] = useState('Sydney, NSW');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Urgent (2-3 Days)');
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchedProfessionalResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleScenarios = [
    {
      label: 'Commercial Lease Lockout',
      text: 'My business landlord locked me out of our logistics warehouse in Parramatta yesterday without notice. Daily trade loss is over $9,000. Need immediate emergency injunction.',
      loc: 'Parramatta, NSW',
      urg: 'Immediate (24h)' as UrgencyLevel,
    },
    {
      label: 'Off-The-Plan Rescission',
      text: 'Sunset date on our off-the-plan apartment passed. Developer is demanding settlement without final occupation certificate. Need to rescind contract and recover $78k deposit.',
      loc: 'Sydney, NSW',
      urg: 'Urgent (2-3 Days)' as UrgencyLevel,
    },
    {
      label: 'Executive Fair Work Claim',
      text: 'Terminated abruptly as CFO after raising accounting compliance concerns to the board. Seeking representation for Fair Work adverse action s 365 claim.',
      loc: 'Melbourne, VIC',
      urg: 'Standard (1-2 Weeks)' as UrgencyLevel,
    },
    {
      label: 'Partner Visa ART Appeal',
      text: 'Subclass 820 Partner Visa refused citing lack of joint financial evidence. Need to lodge urgent review with the Administrative Review Tribunal within 6 days.',
      loc: 'Brisbane, QLD',
      urg: 'Urgent (2-3 Days)' as UrgencyLevel,
    },
  ];

  const handleRunMatch = async (customEnquiry?: string, customLoc?: string, customUrg?: UrgencyLevel) => {
    const textToMatch = customEnquiry || enquiry;
    const locToMatch = customLoc || location;
    const urgToMatch = customUrg || urgency;

    if (!textToMatch.trim()) {
      setErrorMsg('Please describe your legal issue so our AI can match you.');
      return;
    }

    setErrorMsg('');
    setIsMatching(true);

    try {
      const results = await matchClientEnquiryWithAI(textToMatch, locToMatch, urgToMatch, professionals);
      setMatchResults(results);
    } catch (err: any) {
      setErrorMsg(err.message || 'Matching failed. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectScenario = (sc: typeof sampleScenarios[0]) => {
    setEnquiry(sc.text);
    setLocation(sc.loc);
    setUrgency(sc.urg);
    handleRunMatch(sc.text, sc.loc, sc.urg);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge-gold">
            <Sparkles size={14} />
            <span>AI Legal Intake & Matchmaker</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '0.75rem' }}>
          Tell Us Your Legal Issue. <br />
          We’ll Return the <span style={{ color: 'var(--gold-light)' }}>Top 3 Specialists</span>.
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto' }}>
          Our AI evaluates jurisdiction, legal area, credentials, and urgency to pair you with the best lawyers, barristers, conveyancers, or mediators.
        </p>
      </div>

      {/* Input Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Scenario Quick Picks */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Quick Test Scenarios:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sampleScenarios.map((sc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enquiry Textarea */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
            Describe Your Legal Dispute or Question:
          </label>
          <textarea
            value={enquiry}
            onChange={(e) => setEnquiry(e.target.value)}
            placeholder="e.g. My landlord locked me out of our retail premises in Parramatta without giving proper notice. I need an urgent injunction and contract review..."
            className="input-luxury"
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Filters Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <MapPin size={14} style={{ color: 'var(--gold-primary)' }} />
              <span>Location / State:</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sydney, NSW or Melbourne, VIC"
              className="input-luxury"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <Clock size={14} style={{ color: '#60a5fa' }} />
              <span>Urgency Level:</span>
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              className="input-luxury"
            >
              <option value="Immediate (24h)">Immediate (Within 24 Hours)</option>
              <option value="Urgent (2-3 Days)">Urgent (2 - 3 Days)</option>
              <option value="Standard (1-2 Weeks)">Standard (1 - 2 Weeks)</option>
              <option value="Exploratory / Planning">Exploratory / Planning</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: '#fb7185',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={() => handleRunMatch()}
          disabled={isMatching}
          className="btn-gold"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem' }}
        >
          {isMatching ? (
            <>
              <Sparkles className="animate-spin" size={18} />
              <span>AI Analyzing Credentials & Case Suitability...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Analyze & Match with Top 3 Legal Professionals</span>
            </>
          )}
        </button>
      </div>

      {/* Top 3 Matches Results */}
      {matchResults && matchResults.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span className="badge-emerald" style={{ marginBottom: '0.35rem' }}>
                <CheckCircle2 size={13} />
                <span>3 Optimal Matches Found</span>
              </span>
              <h3 style={{ fontSize: '1.6rem', color: '#fff' }}>
                Your Recommended Legal Specialists
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Initial contact is strictly private. Click to open a direct chat interaction.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {matchResults.map((result, idx) => {
              const { professional: pro, matchScore, matchRationale } = result;
              return (
                <div
                  key={pro.id}
                  className="glass-panel glass-panel-gold"
                  style={{
                    padding: '1.75rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Match Rank Banner */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span className="badge-gold" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', fontWeight: 800 }}>
                      <Award size={15} />
                      <span>{matchScore}% MATCH #{idx + 1}</span>
                    </span>
                  </div>

                  <div style={{ maxWidth: '85%' }}>
                    {/* Role & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge-blue" style={{ fontSize: '0.8rem' }}>
                        {pro.title}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>•</span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {pro.firmName}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>•</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        {pro.locationCity}, {pro.jurisdictions.join('/')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>
                      {pro.fullName}
                    </h3>

                    {/* Practice Area Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                      {pro.practiceAreas.map((area, i) => (
                        <span key={i} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}>
                          {area}
                        </span>
                      ))}
                    </div>

                    {/* AI RATIONALE BOX */}
                    <div style={{
                      background: 'rgba(229, 169, 60, 0.08)',
                      border: '1px solid rgba(229, 169, 60, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem 1.15rem',
                      marginBottom: '1.25rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-light)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        <Sparkles size={13} />
                        <span>AI Match Intelligence Rationale:</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {matchRationale}
                      </p>
                    </div>

                    {/* Meta Credentials & Fee */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)' }}>Experience: </span>
                        <strong style={{ color: '#fff' }}>{pro.yearsOfExperience} Years</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)' }}>Rate Structure: </span>
                        <strong style={{ color: 'var(--gold-light)' }}>
                          {pro.feeStructure} ({pro.hourlyRateAud > 0 ? `$${pro.hourlyRateAud}/hr AUD` : 'Fixed Quote'})
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)' }}>Reg/Bar ID: </span>
                        <code style={{ color: '#fff', fontSize: '0.78rem' }}>{pro.barOrRegistrationNumber}</code>
                      </div>
                    </div>
                  </div>

                  {/* Connect Button */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      🔒 Direct Firebase Chat Interaction • Protected under Legal Professional Privilege
                    </div>
                    
                    <button
                      onClick={() => onOpenChat(pro)}
                      className="btn-gold"
                      style={{ padding: '0.65rem 1.35rem' }}
                    >
                      <MessageSquare size={16} />
                      <span>Connect & Chat with {pro.fullName.split(' ')[0]}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
