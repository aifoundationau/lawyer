import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
  Award,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Lock,
  Unlock,
  Mail,
  Phone,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
} from './icons';
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
  const [clientTokens, setClientTokens] = useState<number>(lawyerSelectStore.getClientTokens());
  const [unlockStatusMsg, setUnlockStatusMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to store updates (token balance & unlocked profiles)
  useEffect(() => {
    const handleUpdate = () => {
      setClientTokens(lawyerSelectStore.getClientTokens());
    };
    const unsubscribe = lawyerSelectStore.subscribe(handleUpdate);
    return () => unsubscribe();
  }, []);

  const sampleScenarios = [
    {
      label: 'Commercial Lease Lockout',
      text: 'My business landlord locked me out of our logistics warehouse in Parramatta yesterday without notice. Daily trade loss is over $9,000. Need immediate emergency injunction in the Supreme Court.',
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
      // Synchronize unlock status with lawyerSelectStore
      const synched = results.map((r) => ({
        ...r,
        isContactUnlocked: lawyerSelectStore.isProfessionalContactUnlocked(r.professional.id),
      }));
      setMatchResults(synched);
    } catch (err: any) {
      setErrorMsg(err.message || 'Matching failed. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectScenario = (sc: (typeof sampleScenarios)[0]) => {
    setEnquiry(sc.text);
    setLocation(sc.loc);
    setUrgency(sc.urg);
    handleRunMatch(sc.text, sc.loc, sc.urg);
  };

  const handleUnlockContact = (proId: string) => {
    const res = lawyerSelectStore.unlockProfessionalContact(proId);
    setUnlockStatusMsg(res.message);
    setTimeout(() => setUnlockStatusMsg(null), 3500);

    if (matchResults) {
      setMatchResults(
        matchResults.map((r) =>
          r.professional.id === proId ? { ...r, isContactUnlocked: true } : r
        )
      );
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unlockCost = lawyerSelectStore.getProfileUnlockCost();

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge-gold">
            <Sparkles size={14} />
            <span>17-Category AI Matchmaker (Top 3)</span>
          </span>

          {/* Client Token Balance Pill */}
          <div
            data-testid="client-token-balance-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '999px',
              padding: '0.25rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--gold-light)',
            }}
          >
            <span>🪙 Token Balance:</span>
            <span>{clientTokens} Tokens</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '0.2rem' }}>
              ($1 AUD / token)
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', color: '#fff', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
          Describe Your Legal Matter. <br />
          AI Evaluates 17 Categories for Your <span style={{ color: 'var(--gold-light)' }}>Top 3 Matches</span>.
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.94rem', lineHeight: 1.6 }}>
          Our AI evaluates location, court admissions, landmark case precedents, accreditations, and fee structure to find the top 3 legal practitioners. Direct contact channels are token-gated and released after token payment.
        </p>
      </div>

      {/* Input Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        {/* Scenario Quick Picks */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-light)', marginBottom: '0.6rem', fontWeight: 700 }}>
            Quick Scenarios (Pre-Populate Test Cases)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sampleScenarios.map((sc, i) => (
              <button
                key={i}
                type="button"
                data-testid={`match-scenario-btn-${i}`}
                onClick={() => handleSelectScenario(sc)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gold-primary)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="client-enquiry-input" className="label-luxury">
            Describe Your Legal Dispute, Transaction, or Inquiry
          </label>
          <textarea
            id="client-enquiry-input"
            data-agent-id="client-enquiry-input"
            data-testid="client-enquiry-input"
            className="input-luxury"
            rows={4}
            placeholder="Explain the background facts, parties involved, contracts or court deadlines, and desired legal outcome..."
            value={enquiry}
            onChange={(e) => setEnquiry(e.target.value)}
          />
        </div>

        {/* Location & Urgency Dropdowns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="client-location-input" className="label-luxury">
              Your Location / Suburb
            </label>
            <input
              id="client-location-input"
              data-agent-id="client-location-input"
              data-testid="client-location-input"
              type="text"
              className="input-luxury"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sydney NSW, Parramatta, Melbourne VIC"
            />
          </div>

          <div>
            <label htmlFor="client-urgency-select" className="label-luxury">
              Matter Urgency & Timetable
            </label>
            <select
              id="client-urgency-select"
              data-agent-id="client-urgency-select"
              data-testid="client-urgency-select"
              className="input-luxury"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
            >
              <option value="Immediate (24h)">Immediate (within 24 hours)</option>
              <option value="Urgent (2-3 Days)">Urgent (2–3 days)</option>
              <option value="Standard (1-2 Weeks)">Standard (1–2 weeks)</option>
              <option value="Exploratory">Exploratory / Planning</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: '#fb7185', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Match Button */}
        <button
          type="button"
          data-agent-id="run-ai-match-btn"
          data-testid="run-ai-match-btn"
          onClick={() => handleRunMatch()}
          disabled={isMatching}
          className="btn-gold"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', justifyContent: 'center' }}
        >
          {isMatching ? (
            <>
              <Sparkles className="spin" size={18} />
              <span>AI Evaluating 17 Categories & Scoring Top 3 Matches...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Evaluate 17 Categories & Find Top 3 Legal Matches</span>
            </>
          )}
        </button>
      </div>

      {/* Unlock Status Toast */}
      {unlockStatusMsg && (
        <div
          data-testid="unlock-status-toast"
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: unlockStatusMsg.includes('Insufficient') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: unlockStatusMsg.includes('Insufficient') ? '1px solid #ef4444' : '1px solid #10b981',
            color: unlockStatusMsg.includes('Insufficient') ? '#f87171' : '#34d399',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{unlockStatusMsg}</span>
        </div>
      )}

      {/* Top 3 Matches Results */}
      {matchResults && matchResults.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span className="badge-emerald" style={{ marginBottom: '0.35rem' }}>
                <CheckCircle2 size={13} />
                <span>17-Category Evaluation Complete • 3 Optimal Matches</span>
              </span>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Your Recommended Legal Specialists
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Direct contact channels (Email, Phone, Booking URL) are token-gated (1 token = AUD $1).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {matchResults.map((result, idx) => {
              const { professional: pro, matchScore, matchRationale, pillarBreakdown, highlightedNotableMatter, isContactUnlocked } = result;
              return (
                <div
                  key={pro.id}
                  data-agent-id={`match-card-${pro.id}`}
                  data-testid={`match-card-${pro.id}`}
                  className="glass-panel glass-panel-gold"
                  style={{
                    padding: '1.75rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Match Rank Banner */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                    <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                      {pro.fullName}
                    </h3>

                    {/* Practice Area Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
                      {pro.practiceAreas.map((area, i) => (
                        <span
                          key={i}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {area}
                        </span>
                      ))}
                    </div>

                    {/* 4-Pillar Evaluation Scores (17 Categories Evaluated) */}
                    {pillarBreakdown && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '0.5rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Pillar A: Jurisdiction & Proximity</span>
                          <strong style={{ fontSize: '0.82rem', color: '#38bdf8' }}>{pillarBreakdown.jurisdictionAndProximity} / 25 pts</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Pillar B: Expertise & Precedents</span>
                          <strong style={{ fontSize: '0.82rem', color: '#34d399' }}>{pillarBreakdown.practiceExpertise} / 35 pts</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Pillar C: Seniority & Standing</span>
                          <strong style={{ fontSize: '0.82rem', color: 'var(--gold-light)' }}>{pillarBreakdown.seniorityAndStanding} / 20 pts</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Pillar D: Commercial & Engagement</span>
                          <strong style={{ fontSize: '0.82rem', color: '#c084fc' }}>{pillarBreakdown.commercialFit} / 20 pts</strong>
                        </div>
                      </div>
                    )}

                    {/* AI RATIONALE BOX */}
                    <div
                      style={{
                        background: 'rgba(229, 169, 60, 0.08)',
                        border: '1px solid rgba(229, 169, 60, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.9rem 1.15rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-light)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        <Sparkles size={13} />
                        <span>AI Match Intelligence Rationale:</span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                        {matchRationale}
                      </p>
                    </div>

                    {/* Notable Matters / Precedents */}
                    {highlightedNotableMatter && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--gold-primary)', flexShrink: 0 }}>⚖️ Precedent:</span>
                        <span>{highlightedNotableMatter}</span>
                      </div>
                    )}

                    {/* Meta Credentials & Fee */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
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

                  {/* Token-Gated Contact Details Section (Category 16) */}
                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '1rem',
                      marginBottom: '1.2rem',
                    }}
                  >
                    {isContactUnlocked ? (
                      /* UNLOCKED CONTACT DETAILS */
                      <div
                        data-testid={`unlocked-contact-${pro.id}`}
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          borderRadius: '8px',
                          padding: '0.85rem 1.15rem',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                            <Unlock size={14} />
                            <span>VERIFIED CONTACT DETAILS UNLOCKED</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', fontSize: '0.82rem', color: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Mail size={13} style={{ color: 'var(--gold-light)' }} />
                              <span>{pro.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(pro.email, `email_${pro.id}`)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px' }}
                                title="Copy Email"
                              >
                                {copiedId === `email_${pro.id}` ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                              </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Phone size={13} style={{ color: 'var(--gold-light)' }} />
                              <span>{pro.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(pro.phone, `phone_${pro.id}`)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px' }}
                                title="Copy Phone"
                              >
                                {copiedId === `phone_${pro.id}` ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`mailto:${pro.email}`}
                          className="btn-gold"
                          style={{ padding: '0.45rem 0.95rem', fontSize: '0.78rem' }}
                        >
                          <Mail size={13} />
                          <span>Send Email</span>
                        </a>
                      </div>
                    ) : (
                      /* LOCKED CONTACT DETAILS (TOKEN-GATED) */
                      <div
                        data-testid={`locked-contact-${pro.id}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px dashed rgba(212, 175, 55, 0.35)',
                          borderRadius: '8px',
                          padding: '0.75rem 1.15rem',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: 'rgba(212, 175, 55, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--gold-light)',
                            }}
                          >
                            <Lock size={15} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                              Direct Contact Channels (Email, Phone & Priority Booking URL)
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              Encrypted at rest (256-bit AES-GCM). Spend {unlockCost} platform token to unlock.
                            </span>
                          </div>
                        </div>

                        {/* Token Unlock Button with AUD/USD price strictly on hover */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            data-agent-id={`unlock-pro-${pro.id}-btn`}
                            data-testid={`unlock-pro-${pro.id}-btn`}
                            onClick={() => handleUnlockContact(pro.id)}
                            title={`AUD $${unlockCost}.00 / USD $${(unlockCost * 0.655).toFixed(3)} est`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              background: 'rgba(212, 175, 55, 0.18)',
                              border: '1px solid var(--gold-primary)',
                              borderRadius: '8px',
                              padding: '0.45rem 1rem',
                              color: 'var(--gold-light)',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
                            }}
                          >
                            <span>🪙</span>
                            <span>Unlock Direct Contact ({unlockCost} Token)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connect / Chat Button */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      🔒 Direct Firebase Chat Interaction • Protected under Legal Professional Privilege
                    </div>

                    <button
                      type="button"
                      data-agent-id={`connect-chat-${pro.id}-btn`}
                      data-testid={`connect-chat-${pro.id}-btn`}
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
