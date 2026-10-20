import React, { useState } from 'react';
import { FileText, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from './icons';
import { UrgencyLevel, MarketplaceCase } from '../types';
import { sanitizeAndPlaceCaseWithAI } from '../services/geminiService';
import { lawyerSelectStore } from '../services/lawyerSelectStore';

interface PostCaseIntakeProps {
  onCasePosted: (newCase: MarketplaceCase) => void;
}

export const PostCaseIntake: React.FC<PostCaseIntakeProps> = ({ onCasePosted }) => {
  const [issueText, setIssueText] = useState('');
  const [clientName, setClientName] = useState('David K.');
  const [clientEmail, setClientEmail] = useState('david.k@enterprise-nsw.com.au');
  const [clientPhone, setClientPhone] = useState('+61 412 990 123');
  const [location, setLocation] = useState('Sydney, NSW');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Urgent (2-3 Days)');
  const [budget, setBudget] = useState('$2,000 - $5,000 AUD');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postedCase, setPostedCase] = useState<MarketplaceCase | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleCaseIdeas = [
    {
      title: 'Commercial Tenancy Dispute',
      desc: 'Our restaurant lease on George Street Sydney has an disputed 30% rent increase clause. The landlord sent a notice to remedy breach within 7 days. We have paid all base rent and need a commercial lawyer or barrister to review and challenge the market rent review.',
      loc: 'Sydney, NSW',
      urg: 'Urgent (2-3 Days)' as UrgencyLevel,
      b: '$2,500 - $4,500 AUD',
    },
    {
      title: 'Shareholder Partnership Deadlock',
      desc: 'I am a 50% co-founder of a logistics software business. My co-director has blocked company bank accounts and attempted to divert client contracts to a separate entity. Seeking emergency oppression remedy or mediator to break deadlock.',
      loc: 'Melbourne, VIC',
      urg: 'Immediate (24h)' as UrgencyLevel,
      b: '$5,000 - $10,000 AUD',
    },
    {
      title: 'Estate Grant of Probate Caveat',
      desc: 'My late father’s will was altered 2 weeks before his passing in palliative care leaving the estate to an unrelated caretaker. Need an estate litigation specialist to lodge a caveat against probate in the Supreme Court.',
      loc: 'Brisbane, QLD',
      urg: 'Standard (1-2 Weeks)' as UrgencyLevel,
      b: '$3,000 - $6,000 AUD',
    },
  ];

  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim() || !clientName.trim() || !clientEmail.trim()) {
      setErrorMsg('Please provide your legal issue details, name, and contact email.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const sanitizedCase = await sanitizeAndPlaceCaseWithAI(
        issueText,
        clientName,
        clientEmail,
        clientPhone,
        location,
        urgency,
        budget
      );

      // Save to store
      lawyerSelectStore.addMarketplaceCase(sanitizedCase);
      setPostedCase(sanitizedCase);
      onCasePosted(sanitizedCase);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge-emerald">
            <FileText size={14} />
            <span>Client AI Case Intake</span>
          </span>
          <span className="badge-gold">
            <ShieldCheck size={14} />
            <span>Automatic PII Redaction</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '0.75rem' }}>
          Place Your Legal Issue in Our Database
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Describe your legal matter in plain English. Our AI will automatically extract key facts, 
          <strong> scrub all personal details for privacy</strong>, and publish an anonymous summary for qualified legal professionals to review and accommodate.
        </p>
      </div>

      {!postedCase ? (
        <form onSubmit={handleSubmitCase} className="glass-panel" style={{ padding: '2.25rem' }}>
          
          {/* Preset Prompts */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              Quick Templates:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {sampleCaseIdeas.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIssueText(item.desc);
                    setLocation(item.loc);
                    setUrgency(item.urg);
                    setBudget(item.b);
                  }}
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {/* Legal Dispute Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
              Describe What Happened (Plain English):
            </label>
            <textarea
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="e.g. I entered into a commercial agreement with a supplier. They delivered damaged stock and refuse to refund $35,000. Now they are threatening to cancel our distribution rights..."
              className="input-luxury"
              rows={5}
              required
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
              🔒 Under Australian Privacy Principle APP 11, your direct identity will be redacted from the public board.
            </p>
          </div>

          {/* Contact Details Grid (Used only after $20 purchase) */}
          <div style={{
            background: 'rgba(10, 14, 23, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.75rem',
          }}>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--gold-light)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Your Confidential Contact Information:</span>
              <span className="badge-gold" style={{ fontSize: '0.65rem' }}>Locked from Public</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Your Full Name:
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="input-luxury"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Email Address:
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="input-luxury"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Phone Number:
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="input-luxury"
                  required
                />
              </div>
            </div>
          </div>

          {/* Metadata Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Dispute Location:
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-luxury"
                placeholder="e.g. Sydney, NSW"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Urgency Level:
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

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Budget Allocation:
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input-luxury"
                placeholder="e.g. $1,500 - $3,000 AUD"
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: '#fb7185', background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold"
            style={{ width: '100%', padding: '0.95rem', fontSize: '1.05rem' }}
          >
            {isSubmitting ? (
              <>
                <Sparkles className="animate-spin" size={18} />
                <span>AI Scrubbing PII & Publishing Case to Exchange...</span>
              </>
            ) : (
              <>
                <FileText size={18} />
                <span>Place Legal Issue in Database via AI</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Confirmation Screen */
        <div className="glass-panel glass-panel-gold" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem' }}>
            Case Successfully Placed in Legal Database!
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1.75rem' }}>
            Case <strong>#{postedCase.id.slice(0, 8)}</strong> is now published on the Lawyer Select legal board. 
            Legal professionals can review your anonymous summary and acquire your lead for $20 to contact you directly.
          </p>

          <div style={{ background: 'rgba(10, 14, 23, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge-blue">{postedCase.category}</span>
              <span className="badge-gold">{postedCase.jurisdiction}</span>
              <span className="badge-emerald">{postedCase.urgency}</span>
            </div>
            <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{postedCase.title}</h4>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6 }}>{postedCase.anonymousSummary}</p>
          </div>

          <button
            onClick={() => setPostedCase(null)}
            className="btn-gold"
            style={{ padding: '0.75rem 1.6rem' }}
          >
            <span>Submit Another Legal Issue</span>
          </button>
        </div>
      )}

    </div>
  );
};
