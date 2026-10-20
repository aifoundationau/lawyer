import React, { useState } from 'react';
import { Briefcase, Lock, Unlock, Mail, Phone, Clock, DollarSign, Filter, CheckCircle2, ShieldCheck, Sparkles, CreditCard, ArrowRight } from './icons';
import { MarketplaceCase, PracticeArea, Jurisdiction, LegalProfessional } from '../types';
import { lawyerSelectStore } from '../services/lawyerSelectStore';
import { initiateLeadPurchaseCheckout } from '../services/stripeClient';

interface MarketplaceCaseBoardProps {
  cases: MarketplaceCase[];
  currentLawyer: LegalProfessional;
  onOpenChatWithClient: (c: MarketplaceCase) => void;
}

export const MarketplaceCaseBoard: React.FC<MarketplaceCaseBoardProps> = ({
  cases,
  currentLawyer,
  onOpenChatWithClient,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('All');
  const [purchasingCaseId, setPurchasingCaseId] = useState<string | null>(null);
  const [checkoutModalCase, setCheckoutModalCase] = useState<MarketplaceCase | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string>('');

  const categories = [
    'All',
    'Commercial & Corporate',
    'Property & Conveyancing',
    'Employment & Workplace',
    'Immigration Law',
    'Defamation & Media',
    'Criminal Law',
    'Family Law',
    'Civil Litigation',
  ];

  const jurisdictions = ['All', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'Federal'];

  const filteredCases = cases.filter((c) => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (selectedJurisdiction !== 'All' && c.jurisdiction !== selectedJurisdiction) return false;
    return true;
  });

  const handleOpenStripeCheckout = (c: MarketplaceCase) => {
    setCheckoutModalCase(c);
  };

  const handleConfirmPurchase = async () => {
    if (!checkoutModalCase) return;

    setPurchasingCaseId(checkoutModalCase.id);
    try {
      // Execute Stripe Lead Checkout flow
      const checkoutRes = await initiateLeadPurchaseCheckout(
        checkoutModalCase.id,
        checkoutModalCase.title,
        currentLawyer.id,
        currentLawyer.fullName,
        currentLawyer.email
      );

      // Finalize store purchase
      const updatedCase = lawyerSelectStore.purchaseCaseLead(
        checkoutModalCase.id,
        currentLawyer.id,
        currentLawyer.fullName
      );

      if (updatedCase) {
        setPurchaseSuccessMessage(`Successfully purchased Case #${checkoutModalCase.id.slice(0, 8)}! Client contact details unlocked.`);
        setTimeout(() => setPurchaseSuccessMessage(''), 6000);
      }
    } catch (err: any) {
      alert('Purchase failed: ' + err.message);
    } finally {
      setPurchasingCaseId(null);
      setCheckoutModalCase(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge-blue">
            <Briefcase size={14} />
            <span>AI Legal Case Exchange</span>
          </span>
          <span className="badge-gold">
            <span>$20 Flat-Fee Lead Acquisition</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '0.75rem' }}>
          Client Legal Matters Seeking Representation
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto' }}>
          Browse anonymous summaries submitted by individuals and businesses across Australia. 
          When you identify a case you can accommodate, unlock the client’s direct contact info for a <strong>flat fee of $20.00 AUD</strong>.
        </p>
      </div>

      {/* Success Notification */}
      {purchaseSuccessMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 600 }}>{purchaseSuccessMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Practice Area:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-luxury"
            style={{ width: 'auto', minWidth: '180px', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Jurisdiction Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Jurisdiction:
          </span>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {jurisdictions.map((jur) => (
              <button
                key={jur}
                onClick={() => setSelectedJurisdiction(jur)}
                className={selectedJurisdiction === jur ? 'btn-gold' : 'btn-ghost'}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {jur}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredCases.length}</strong> available matters
        </div>
      </div>

      {/* Cases Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {filteredCases.map((caseItem) => {
          const isClaimed = caseItem.status === 'claimed';
          const isClaimedByMe = caseItem.claimedBy === currentLawyer.id;

          return (
            <div
              key={caseItem.id}
              className={`glass-panel ${isClaimed ? 'glass-panel-gold' : ''}`}
              style={{
                padding: '1.75rem',
                borderLeft: isClaimed ? '4px solid var(--accent-emerald)' : '4px solid var(--gold-primary)',
              }}
            >
              {/* Header Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge-blue">{caseItem.category}</span>
                  <span className="badge-gold">{caseItem.jurisdiction}</span>
                  <span className={caseItem.urgency.includes('Immediate') ? 'badge-rose' : 'badge-emerald'}>
                    <Clock size={12} />
                    <span>{caseItem.urgency}</span>
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Posted {new Date(caseItem.postedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div>
                  {isClaimed ? (
                    <span className="badge-emerald" style={{ padding: '0.35rem 0.8rem', fontWeight: 700 }}>
                      <CheckCircle2 size={14} />
                      <span>UNLOCKED & CLAIMED</span>
                    </span>
                  ) : (
                    <span className="badge-gold" style={{ padding: '0.35rem 0.8rem', fontWeight: 700 }}>
                      <Lock size={14} />
                      <span>$20 FLAT-FEE LEAD</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Case Title */}
              <h3 style={{ fontSize: '1.45rem', color: '#fff', marginBottom: '0.75rem' }}>
                {caseItem.title}
              </h3>

              {/* Anonymous Factual Summary */}
              <div style={{
                background: 'rgba(10, 14, 23, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gold-light)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={13} />
                  <span>Anonymized Factual Dispute Summary (APP 11 Scrubbed):</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {caseItem.anonymousSummary}
                </p>
              </div>

              {/* Case Details Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Key Assistance Required: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{caseItem.keyAssistanceRequired}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Estimated Client Budget: </span>
                  <strong style={{ color: 'var(--gold-light)' }}>{caseItem.estimatedBudget}</strong>
                </div>
              </div>

              {/* ========================================================= */}
              {/* RESTRICTED CONFIDENTIAL DOSSIER (Appears once purchased)  */}
              {/* ========================================================= */}
              {isClaimed && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 14, 23, 0.8) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginTop: '1.25rem',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    <Unlock size={16} />
                    <span>Confidential Client Dossier Unlocked (Claimed by {caseItem.claimedByName || 'You'})</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Client Name:</span>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{caseItem.clientFullName}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Client Email:</span>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#60a5fa' }}>{caseItem.clientEmail}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Client Phone:</span>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gold-light)' }}>{caseItem.clientPhone}</p>
                    </div>
                  </div>

                  {caseItem.fullFactualDetails && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Unredacted Client Statement of Facts:</span>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', marginTop: '0.25rem' }}>
                        {caseItem.fullFactualDetails}
                      </p>
                    </div>
                  )}

                  {/* Direct Contact Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                    <a
                      href={`mailto:${caseItem.clientEmail}?subject=Regarding Your Legal Dispute: ${encodeURIComponent(caseItem.title)}&body=Dear ${encodeURIComponent(caseItem.clientFullName || 'Client')},%0D%0A%0D%0AI have reviewed your legal matter on Lawyer Select and would be pleased to assist.`}
                      className="btn-gold"
                      style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
                    >
                      <Mail size={15} />
                      <span>Email Client Directly</span>
                    </a>

                    <a
                      href={`tel:${caseItem.clientPhone}`}
                      className="btn-ghost"
                      style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
                    >
                      <Phone size={15} />
                      <span>Call Client ({caseItem.clientPhone})</span>
                    </a>

                    <button
                      onClick={() => onOpenChatWithClient(caseItem)}
                      className="btn-ghost"
                      style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
                    >
                      <span>Open Direct Chat Interaction</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Footer if not yet claimed */}
              {!isClaimed && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    🔒 PII redacted. Acquiring this case transfers exclusive client contact rights.
                  </div>

                  <button
                    onClick={() => handleOpenStripeCheckout(caseItem)}
                    className="btn-gold"
                    style={{ padding: '0.65rem 1.4rem' }}
                  >
                    <CreditCard size={16} />
                    <span>Purchase Lead for $20 (Flat Fee)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Stripe Checkout Modal */}
      {checkoutModalCase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div className="glass-panel glass-panel-gold" style={{ maxWidth: '540px', width: '100%', padding: '2rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} style={{ color: 'var(--gold-primary)' }} />
                <h3 style={{ fontSize: '1.35rem', color: '#fff' }}>Stripe Lead Acquisition</h3>
              </div>
              <span className="badge-gold">AUD $20.00 Flat</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              You are purchasing the direct contact dossier and exclusive representation lead for:
            </p>

            <div style={{
              background: 'rgba(10, 14, 23, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                {checkoutModalCase.title}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--gold-light)' }}>
                {checkoutModalCase.category} • {checkoutModalCase.jurisdiction}
              </p>
            </div>

            {/* Price breakdown */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '0.85rem 0', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <span>Qualified Legal Lead Access</span>
                <span>$18.18 AUD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <span>Australian GST (10%)</span>
                <span>$1.82 AUD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 800, fontSize: '1.05rem', paddingTop: '0.4rem' }}>
                <span>Total Charge</span>
                <span style={{ color: 'var(--gold-light)' }}>$20.00 AUD</span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              🔒 Secured via Stripe (PCI DSS Level 1). The client's full name, phone number, email, and unredacted statement of facts will be released instantly into your legal dashboard.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCheckoutModalCase(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={purchasingCaseId !== null}
                className="btn-gold"
                style={{ padding: '0.7rem 1.5rem' }}
              >
                {purchasingCaseId ? 'Processing $20 Payment...' : 'Pay $20 & Unlock Lead'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
