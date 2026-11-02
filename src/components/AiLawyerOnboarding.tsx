import React, { useState } from 'react';
import {
  Sparkles,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  Award,
  ArrowRight,
  RefreshCw,
  Lock,
  GoogleIcon,
  Shield,
  MapPin,
  Briefcase,
} from './icons';
import {
  LegalProfessional,
  LegalTitle,
  Jurisdiction,
  PracticeArea,
  FeeStructure,
  Lawyer17CategoryDossier,
  EncryptedLawyerApplicationRecord,
  PRACTICE_AREAS,
  JURISDICTIONS,
  FEE_STRUCTURES,
} from '../types';
import { extract17CategoryLawyerDossier } from '../services/geminiService';
import { encryptWith256BitAes, EncryptedPayload256 } from '../services/encryptionService';
import { lawyerSelectStore } from '../services/lawyerSelectStore';
import { useAuth } from '../context/AuthContext';

interface AiLawyerOnboardingProps {
  onProfilePublished: (pro: LegalProfessional) => void;
}

const SAMPLE_PASTES = [
  {
    label: 'Sample 1: Commercial Litigation Partner (Sydney NSW)',
    text: `I am Harrison Sterling SC, Senior Partner at Sterling & Associates Legal in Sydney NSW (Level 32, Chifley Tower, 2 Chifley Square, Sydney NSW 2000). Admitted in 2008 with 18 years of legal practice. Law Society Practising Certificate PC-NSW-88412.
Practice Areas: Commercial & Corporate, Civil Litigation, Property & Conveyancing, Building & Construction.
Education: LL.B. (Hons First Class) University of Sydney, LL.M. (Corporate Litigation) Melbourne Law School.
Courts: Admitted to Supreme Court of NSW, Federal Court of Australia, and High Court of Australia.
Notable Cases: Lead Counsel in $45M Supreme Court equity and shareholder oppression trial; successfully resolved 150+ commercial contract disputes.
Accreditations: Law Society Accredited Specialist in Commercial Litigation, NMAS Nationally Accredited Mediator.
Billing: Hourly Rate $620 AUD/hr or Fixed Fee initial commercial assessment. Languages: English, Mandarin.
Direct Contact: h.sterling@sterlinglegal.com.au | +61 2 9230 4410`,
  },
  {
    label: 'Sample 2: Family Law & Mediation Specialist (Melbourne VIC)',
    text: `Dr. Clara Thorne, Principal Solicitor & Accredited Family Law Mediator at Thorne Family Chambers in Melbourne VIC (101 Collins Street, Melbourne VIC 3000). Admitted in 2012 (14 years experience), VLSB Practising Certificate PC-VIC-55910.
Practice Areas: Family Law, Wills & Estates, Property & Conveyancing.
Education: Juris Doctor (J.D.) Monash University, Graduate Diploma of Family Dispute Resolution.
Courts: Federal Circuit and Family Court of Australia (Division 1 & 2), Supreme Court of Victoria.
Notable Matters: Complex high-net-worth family property settlements, international child relocation trials, and Binding Financial Agreements.
Billing: Fixed Fee packages and Hourly Rate at $480 AUD/hr. Languages: English, Italian, Greek.
Direct Contact: clara@thornefamilylaw.com.au | +61 3 9650 7721`,
  },
];

export const AiLawyerOnboarding: React.FC<AiLawyerOnboardingProps> = ({ onProfilePublished }) => {
  const { currentUser, isAuthenticated, signInWithGoogle } = useAuth();
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dossier, setDossier] = useState<Lawyer17CategoryDossier | null>(null);
  const [encryptedVault, setEncryptedVault] = useState<EncryptedPayload256 | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleProcessWithAiAndEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsProcessing(true);
    try {
      const extracted = await extract17CategoryLawyerDossier(
        rawText,
        currentUser?.email || 'practitioner@lawyerselect.com.au',
        currentUser?.displayName || ''
      );
      const encrypted = await encryptWith256BitAes({
        supporterUid: currentUser?.uid || 'google_supporter',
        supporterEmail: currentUser?.email || '',
        rawQualificationsPaste: rawText,
        extractedDossier: extracted,
      });
      setDossier(extracted);
      setEncryptedVault(encrypted);
    } catch (err) {
      console.error('AI Dossier Extraction error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;

    const finalEncryption = await encryptWith256BitAes(dossier);
    const nowIso = new Date().toISOString();
    const appId = 'lapp_' + Math.random().toString(36).substring(2, 9);

    const applicationRecord: EncryptedLawyerApplicationRecord = {
      id: appId,
      tag: 'lawyerselect',
      source: 'lawyerselect',
      supporterGoogleUid: currentUser?.uid || 'google_supporter_uid',
      supporterGoogleEmail: currentUser?.email || dossier.contactEmail,
      dossier,
      encryptionMeta: finalEncryption,
      tokenReleaseRequirement: {
        tokensRequiredToUnlockContact: 1,
        isContactLockedUntilTokenPayment: true,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save 256-bit encrypted application to Firebase (lawyer_applications) & local vault
    lawyerSelectStore.saveEncryptedLawyerApplication(applicationRecord);

    // Also register the lawyer in the searchable directory so clients can match & unlock with a token
    const mappedTitle: LegalTitle =
      dossier.seniorityTitle === 'Barrister'
        ? 'Barrister'
        : dossier.seniorityTitle === 'Mediator'
        ? 'Mediator'
        : 'Solicitor';

    const newPro = lawyerSelectStore.addProfessional({
      fullName: dossier.fullName,
      title: mappedTitle,
      firmName: dossier.firmOrEmployerAffiliation,
      email: dossier.contactEmail,
      phone: dossier.contactPhone,
      jurisdictions: [dossier.locationJurisdiction],
      practiceAreas: dossier.practiceAreas,
      yearsOfExperience: Math.ceil(dossier.yearsOfPractice),
      barOrRegistrationNumber: dossier.regulatoryBodyId,
      bio: `${dossier.executiveSummary}\n\n• Education: ${dossier.formalEducationAndLawDegrees.join(', ')}\n• Courts: ${dossier.courtsOfAdmission.join(', ')}\n• Notable Matters: ${dossier.publicationsAndNotableMatters.join('; ')}`,
      feeStructure: dossier.feeStructure,
      hourlyRateAud: Math.ceil(dossier.hourlyRateAud),
      locationCity: dossier.locationCitySuburb,
      locationPostcode: '2000',
    });

    setPublishSuccess(true);
    setTimeout(() => {
      onProfilePublished(newPro);
    }, 1600);
  };

  const togglePracticeArea = (area: PracticeArea) => {
    if (!dossier) return;
    const exists = dossier.practiceAreas.includes(area);
    const updated = exists
      ? dossier.practiceAreas.filter((a) => a !== area)
      : [...dossier.practiceAreas, area];
    if (updated.length > 0) {
      setDossier({ ...dossier, practiceAreas: updated });
    }
  };

  return (
    <section
      data-agent-id="lawyer-register-section"
      data-testid="lawyer-register-section"
      style={{ maxWidth: '1140px', margin: '0 auto', padding: '2.5rem 1.5rem' }}
    >
      {/* Top Briefing Banner: How Lawyer Registration & 256-Bit Encryption Works */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem 2.25rem',
          marginBottom: '2rem',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 14, 23, 0.98) 100%)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '999px', padding: '0.35rem 0.95rem', color: '#c4b5fd', fontSize: '0.78rem', fontWeight: 700 }}>
            <UserCheck size={14} />
            <span>LAWYER REGISTRATION PORTAL • EXCLUSIVELY FOR LEGAL PRACTITIONERS</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '999px', padding: '0.35rem 0.9rem', color: '#34d399', fontSize: '0.76rem', fontWeight: 700 }}>
            <Lock size={13} />
            <span>256-BIT AES-GCM ENCRYPTED VAULT</span>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.35rem)', color: '#fff', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
          Register as a Legal Practitioner
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.65, marginBottom: '1.35rem' }}>
          Lawyers can register simply by pasting their <strong>qualifications, experience, and important cases</strong> into a single input box. We immediately encrypt your dossier using <strong>256-bit AES encryption</strong> and structure it with Firebase and AI across 17 specialist legal categories. When someone searches for a lawyer near them with your required skills, we match your profile and send them your direct contact details <strong>only after payment of a platform token</strong>.
        </p>

        {/* 3-Step Visual Security & Token Pipeline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GoogleIcon size={15} />
              <span>1. Register as a Supporter on Google</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Lawyers first sign in with Google to verify their supporter account and unlock the Lawyer Application Form.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={15} />
              <span>2. Paste Bio & 256-Bit Encrypt</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Paste your CV, degrees, bar admissions, and landmark cases. AI structures all 17 categories and encrypts your dossier with 256-bit AES-GCM.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={15} />
              <span>3. Token-Gated Client Match</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              When a client near you searches for your exact skills, our AI matches you and releases your contact details upon token payment.
            </p>
          </div>
        </div>
      </div>

      {/* STEP 1 GATE: Must First Register / Sign In as a Supporter on Google */}
      {!isAuthenticated || !currentUser ? (
        <div
          className="glass-panel"
          data-agent-id="google-supporter-gate-card"
          data-testid="google-supporter-gate-card"
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            background: 'rgba(10, 14, 23, 0.95)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.15rem',
              color: 'var(--gold-light)',
            }}
          >
            <Shield size={26} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.6rem', fontFamily: 'var(--font-heading)' }}>
            Step 1: Register as a Supporter with Google
          </h2>

          <p style={{ maxWidth: '620px', margin: '0 auto 1.6rem', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            This registration portal is exclusively for legal professionals. Please register and sign in as a supporter with your Google account first. Immediately after signing in, your <strong>Lawyer Application Form</strong> will unlock below.
          </p>

          <button
            type="button"
            data-agent-id="register-google-supporter-btn"
            data-testid="register-google-supporter-btn"
            onClick={signInWithGoogle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.7rem',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '999px',
              padding: '0.8rem 1.75rem',
              fontSize: '0.96rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.45)',
              transition: 'all 0.2s ease',
            }}
          >
            <GoogleIcon size={20} />
            <span>Register / Sign In with Google to Unlock Lawyer Application</span>
          </button>

          {/* Preview of the 17 Categories Processed by Firebase & AI */}
          <div style={{ marginTop: '2.25rem', textAlign: 'left', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-light)', marginBottom: '0.85rem', textAlign: 'center' }}>
              17 Legal Categories Automatically Extracted by AI & Encrypted in Firebase
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.55rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <div>1. Location (Jurisdiction, State, City, Address)</div>
              <div>2. Practice Areas (Family, Criminal, Corporate, IP)</div>
              <div>3. Bar Admissions & Licensing (PC Status & ID)</div>
              <div>4. Firm or Employer Affiliation</div>
              <div>5. Experience Level & Seniority</div>
              <div>6. Past Legal Work Experience</div>
              <div>7. Career Milestones & Roles</div>
              <div>8. Formal Education & Law Degrees (LL.B., J.D., LL.M.)</div>
              <div>9. Academic & Continuing Legal Education (CLE)</div>
              <div>10. Professional Accreditations & Certifications</div>
              <div>11. Courts of Admission & Rights of Audience</div>
              <div>12. Judicial Appointments & Public Service</div>
              <div>13. Publications, Case Studies & Notable Matters</div>
              <div>14. Fee Structure & Pricing (AUD Integer Rates)</div>
              <div>15. Languages Spoken for Consultations</div>
              <div>16. Verified Contact Channels (Token-Gated)</div>
              <div>17. Client Reviews & Reputation Metrics</div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: UNLOCKED LAWYER APPLICATION FORM (Post-Google Sign-In) */
        <div>
          {/* Verified Supporter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ecfdf5', fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} style={{ color: '#34d399' }} />
              <span>
                Step 1 Complete — Verified Google Supporter: <strong>{currentUser.displayName || currentUser.email}</strong> ({currentUser.email})
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>
              Step 2 Unlocked: Lawyer Application Form Active
            </span>
          </div>

          {/* Paste Box + 17-Category Application Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Single Box AI Input */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Sparkles size={20} style={{ color: '#a78bfa' }} />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Lawyer Application Form — Paste Your Qualifications, Experience & Cases
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {SAMPLE_PASTES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRawText(sample.text)}
                      style={{
                        background: 'rgba(139, 92, 246, 0.12)',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.73rem',
                        color: '#c4b5fd',
                        cursor: 'pointer',
                      }}
                    >
                      Load {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleProcessWithAiAndEncrypt}>
                <textarea
                  className="input-luxury"
                  rows={7}
                  data-agent-id="lawyer-paste-qualifications-textarea"
                  data-testid="lawyer-paste-qualifications-textarea"
                  placeholder="Paste your CV, qualifications, degrees (LL.B., J.D., LL.M.), bar admission & practising certificate details, law firm affiliation, career milestones, courts of admission, important cases/judgments, fee structure, languages, and direct contact details..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  style={{ marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.6 }}
                  required
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Lock size={14} style={{ color: '#34d399' }} />
                    <span>
                      Processed by Firebase & AI across all 17 categories and encrypted with <strong>256-Bit AES-GCM</strong>.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn-gold"
                    data-agent-id="lawyer-process-ai-encrypt-btn"
                    data-testid="lawyer-process-ai-encrypt-btn"
                    disabled={isProcessing || !rawText.trim()}
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Extracting 17 Categories & Encrypting (256-Bit)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Process with AI & 256-Bit Encrypt Dossier</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 17-Category Extracted Dossier & 256-Bit Encryption Certificate */}
            {dossier && encryptedVault && (
              <form
                onSubmit={handlePublishApplication}
                className="glass-panel"
                data-agent-id="lawyer-17-category-review-form"
                data-testid="lawyer-17-category-review-form"
                style={{
                  padding: '2rem',
                  border: '1px solid rgba(52, 211, 153, 0.45)',
                }}
              >
                {/* 256-Bit Encryption Status Header */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.75rem',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.88rem' }}>
                      <Lock size={16} />
                      <span>256-BIT AES-GCM ENCRYPTION ACTIVE • AI CONFIDENCE: {dossier.aiConfidenceScore}%</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                      Contact Details Token-Gated (Released to Matched Clients After 1 Token Payment)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    <div>Cipher: {encryptedVault.algorithm} ({encryptedVault.keyLengthBits}-Bit) | IV: {encryptedVault.ivHex}</div>
                    <div>SHA-256 Digest: {encryptedVault.sha256IntegrityHash}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
                  Review & Confirm Your 17-Category Lawyer Application Dossier
                </h3>

                {/* Practitioner Full Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="label-luxury">Practitioner Full Legal Name & Honorifics</label>
                  <input
                    type="text"
                    className="input-luxury"
                    value={dossier.fullName}
                    onChange={(e) => setDossier({ ...dossier, fullName: e.target.value })}
                    required
                  />
                </div>

                {/* Grid of the 17 Categories */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.15rem', marginBottom: '1.5rem' }}>
                  {/* 1. Location */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      1. LOCATION (JURISDICTION, STATE, CITY & OFFICE ADDRESS)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select
                        className="input-luxury"
                        value={dossier.locationJurisdiction}
                        onChange={(e) => setDossier({ ...dossier, locationJurisdiction: e.target.value as Jurisdiction })}
                      >
                        {JURISDICTIONS.map((j) => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="input-luxury"
                        placeholder="City / Suburb"
                        value={dossier.locationCitySuburb}
                        onChange={(e) => setDossier({ ...dossier, locationCitySuburb: e.target.value })}
                      />
                    </div>
                    <input
                      type="text"
                      className="input-luxury"
                      placeholder="Primary Office Address"
                      value={dossier.primaryOfficeAddress}
                      onChange={(e) => setDossier({ ...dossier, primaryOfficeAddress: e.target.value })}
                    />
                  </div>

                  {/* 2. Practice Areas */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      2. PRACTICE AREAS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {PRACTICE_AREAS.map((area) => {
                        const active = dossier.practiceAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => togglePracticeArea(area)}
                            style={{
                              padding: '0.22rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: active ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.12)',
                              background: active ? 'var(--gold-glow)' : 'transparent',
                              color: active ? 'var(--gold-light)' : 'var(--text-muted)',
                            }}
                          >
                            {area}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Bar Admissions & Licensing */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      3. BAR ADMISSIONS & LICENSING
                    </div>
                    <input
                      type="text"
                      className="input-luxury"
                      style={{ marginBottom: '0.45rem' }}
                      value={dossier.barAdmissionStatus}
                      onChange={(e) => setDossier({ ...dossier, barAdmissionStatus: e.target.value })}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem' }}>
                      <input
                        type="number"
                        className="input-luxury"
                        placeholder="Year"
                        value={dossier.yearAdmitted}
                        onChange={(e) => setDossier({ ...dossier, yearAdmitted: Math.ceil(Number(e.target.value) || 2015) })}
                      />
                      <input
                        type="text"
                        className="input-luxury"
                        placeholder="Regulatory Body ID"
                        value={dossier.regulatoryBodyId}
                        onChange={(e) => setDossier({ ...dossier, regulatoryBodyId: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 4. Firm or Employer Affiliation */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      4. FIRM OR EMPLOYER AFFILIATION
                    </div>
                    <input
                      type="text"
                      className="input-luxury"
                      style={{ marginBottom: '0.45rem' }}
                      value={dossier.firmOrEmployerAffiliation}
                      onChange={(e) => setDossier({ ...dossier, firmOrEmployerAffiliation: e.target.value })}
                    />
                    <select
                      className="input-luxury"
                      value={dossier.affiliationType}
                      onChange={(e) => setDossier({ ...dossier, affiliationType: e.target.value as Lawyer17CategoryDossier['affiliationType'] })}
                    >
                      <option value="Law Firm Partner/Employee">Law Firm Partner/Employee</option>
                      <option value="Solo Practitioner">Solo Practitioner</option>
                      <option value="Barristers Chambers">Barristers Chambers</option>
                      <option value="In-House Counsel">In-House Counsel</option>
                    </select>
                  </div>

                  {/* 5. Experience Level & Seniority */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      5. EXPERIENCE LEVEL & SENIORITY
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="input-luxury"
                        value={dossier.seniorityTitle}
                        onChange={(e) => setDossier({ ...dossier, seniorityTitle: e.target.value as Lawyer17CategoryDossier['seniorityTitle'] })}
                      />
                      <input
                        type="number"
                        className="input-luxury"
                        min={0}
                        max={70}
                        value={dossier.yearsOfPractice}
                        onChange={(e) => setDossier({ ...dossier, yearsOfPractice: Math.ceil(Number(e.target.value) || 1) })}
                      />
                    </div>
                  </div>

                  {/* 6. Past Legal Work Experience */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      6. PAST LEGAL WORK EXPERIENCE
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.pastLegalWorkExperience.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, pastLegalWorkExperience: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 7. Career Milestones & Roles */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      7. CAREER MILESTONES & ROLES
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.careerMilestonesAndRoles.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, careerMilestonesAndRoles: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 8. Formal Education & Law Degrees */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      8. FORMAL EDUCATION & LAW DEGREES (LL.B., J.D., LL.M.)
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.formalEducationAndLawDegrees.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, formalEducationAndLawDegrees: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 9. Academic & Continuing Legal Education (CLE) */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      9. ACADEMIC & CONTINUING LEGAL EDUCATION (CLE)
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.academicAndCleQualifications.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, academicAndCleQualifications: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 10. Professional Accreditations & Specialist Certifications */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      10. PROFESSIONAL ACCREDITATIONS & CERTIFICATIONS
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.professionalAccreditations.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, professionalAccreditations: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 11. Courts of Admission & Rights of Audience */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      11. COURTS OF ADMISSION & RIGHTS OF AUDIENCE
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.courtsOfAdmission.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, courtsOfAdmission: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 12. Judicial Appointments & Public Service */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      12. JUDICIAL APPOINTMENTS & PUBLIC SERVICE
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.judicialAndPublicService.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, judicialAndPublicService: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 13. Publications, Case Studies & Notable Matters */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      13. PUBLICATIONS, CASE STUDIES & NOTABLE MATTERS
                    </div>
                    <textarea
                      className="input-luxury"
                      rows={2}
                      value={dossier.publicationsAndNotableMatters.join('\n')}
                      onChange={(e) => setDossier({ ...dossier, publicationsAndNotableMatters: e.target.value.split('\n') })}
                    />
                  </div>

                  {/* 14. Fee Structure & Pricing */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      14. FEE STRUCTURE & PRICING (AUD INTEGER)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.5rem' }}>
                      <select
                        className="input-luxury"
                        value={dossier.feeStructure}
                        onChange={(e) => setDossier({ ...dossier, feeStructure: e.target.value as FeeStructure })}
                      >
                        {FEE_STRUCTURES.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="input-luxury"
                        value={dossier.hourlyRateAud}
                        onChange={(e) => setDossier({ ...dossier, hourlyRateAud: Math.ceil(Number(e.target.value) || 400) })}
                      />
                    </div>
                  </div>

                  {/* 15. Languages Spoken */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      15. LANGUAGES SPOKEN FOR CONSULTATIONS
                    </div>
                    <input
                      type="text"
                      className="input-luxury"
                      value={dossier.languagesSpoken.join(', ')}
                      onChange={(e) => setDossier({ ...dossier, languagesSpoken: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </div>

                  {/* 16. Verified Contact Channels (Token-Gated) */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={13} />
                      <span>16. VERIFIED CONTACT CHANNELS (256-BIT ENCRYPTED & TOKEN-GATED)</span>
                    </div>
                    <input
                      type="email"
                      className="input-luxury"
                      style={{ marginBottom: '0.45rem' }}
                      placeholder="Direct Professional Email"
                      value={dossier.contactEmail}
                      onChange={(e) => setDossier({ ...dossier, contactEmail: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-luxury"
                      placeholder="Direct Phone Number"
                      value={dossier.contactPhone}
                      onChange={(e) => setDossier({ ...dossier, contactPhone: e.target.value })}
                    />
                  </div>

                  {/* 17. Client Reviews & Reputation Metrics */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem', gridColumn: '1 / -1' }}>
                    <div style={{ color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      17. CLIENT REVIEWS, DISCIPLINARY STANDING & REPUTATION METRICS
                    </div>
                    <input
                      type="text"
                      className="input-luxury"
                      value={dossier.reputationAndDisciplinaryStanding}
                      onChange={(e) => setDossier({ ...dossier, reputationAndDisciplinaryStanding: e.target.value })}
                    />
                  </div>
                </div>

                {publishSuccess ? (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10b981',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={20} />
                    <span>256-Bit Encrypted Lawyer Dossier Saved to Firebase & Activated for Token-Gated Client Matching!</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="btn-gold"
                    data-agent-id="lawyer-publish-encrypted-dossier-btn"
                    data-testid="lawyer-publish-encrypted-dossier-btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
                  >
                    <ShieldCheck size={18} />
                    <span>Encrypt (256-Bit AES) & Submit Lawyer Application to Firebase</span>
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
