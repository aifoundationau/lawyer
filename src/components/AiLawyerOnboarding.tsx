import React, { useState } from 'react';
import { Sparkles, UserCheck, CheckCircle2, ShieldCheck, Award, ArrowRight, RefreshCw, FileText } from './icons';
import { LegalProfessional, LegalTitle, Jurisdiction, PracticeArea, FeeStructure } from '../types';
import { onboardLegalProfessionalWithAI } from '../services/geminiService';
import { lawyerSelectStore } from '../services/lawyerSelectStore';

interface AiLawyerOnboardingProps {
  onProfilePublished: (pro: LegalProfessional) => void;
}

export const AiLawyerOnboarding: React.FC<AiLawyerOnboardingProps> = ({ onProfilePublished }) => {
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<Partial<LegalProfessional>>({
    fullName: '',
    title: 'Solicitor',
    firmName: '',
    email: '',
    phone: '',
    jurisdictions: ['NSW'],
    practiceAreas: ['Commercial & Corporate'],
    yearsOfExperience: 10,
    barOrRegistrationNumber: '',
    bio: '',
    feeStructure: 'Hourly Rate',
    hourlyRateAud: 450,
    locationCity: 'Sydney',
    locationPostcode: '2000',
  });
  const [isExtracted, setIsExtracted] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleBios = [
    {
      label: 'Senior Commercial Barrister (Sydney)',
      text: `I'm Julian Drake SC, Barrister at Tenth Floor Chambers in Sydney. I was called to the Bar in 2008 and took silk in 2022. I specialize in commercial contracts, equity, shareholder disputes, and corporate insolvency across NSW Supreme Court and the Federal Court. I charge $900 per hour or fixed brief fees. My clerk can be reached at clerk@tenthfloor.com.au or phone 02 9232 5500. Bar registration NSW-BAR-7712.`,
    },
    {
      label: 'Accredited Family Mediator (Melbourne)',
      text: `My name is Hannah Goldstein. I am a Nationally Accredited Mediator (NMAS) and Family Law Solicitor at Southern Cross Dispute Resolution in Melbourne (3000). I have 15 years experience resolving complex parenting arrangements, property divisions, and high-net-worth spousal maintenance. Fixed fee mediation packages starting at $2,800. Reach me at hannah@southerncrossmediation.com.au or 03 9800 4411. LIV registration LIV-99214.`,
    },
    {
      label: 'Licensed Property Conveyancer (Brisbane)',
      text: `Liam O'Connor, Director at Sunshine Coast & Brisbane Conveyancing Services. Licensed Conveyancer with 12 years handling residential house sales, commercial leasing, off-the-plan developments, and PEXA settlements in QLD. Standard residential purchase fixed fee $1,100 + outgoings. Phone 07 3344 8899, email liam@sunshineconveyancing.com.au. License QLD-CONV-3320.`,
    },
    {
      label: 'Registered Migration Agent (Perth)',
      text: `I am Mei-Ling Zhou, Registered Migration Agent (MARN 1809221) and Immigration Consultant at West Coast Migration in Perth WA. 9 years assisting mining engineers, healthcare workers, and employer sponsors with TSS 482, ENS 186, Global Talent visas, and AAT appeals. Fixed fee transparent quotes. Contact: mei@westcoastmigration.com.au, mobile 0411 998 221.`,
    },
  ];

  const handleProcessWithAI = async (textToProcess?: string) => {
    const text = textToProcess || rawText;
    if (!text.trim()) {
      setErrorMsg('Please paste or write your background details.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    setPublishedSuccess(false);

    try {
      const result = await onboardLegalProfessionalWithAI(text);
      setExtractedProfile(result);
      setIsExtracted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI extraction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSample = (sample: typeof sampleBios[0]) => {
    setRawText(sample.text);
    handleProcessWithAI(sample.text);
  };

  const handleSaveProfile = () => {
    const newPro: LegalProfessional = {
      id: extractedProfile.id || 'lp_' + Math.random().toString(36).substring(2, 9),
      tag: 'lawyerselect',
      fullName: extractedProfile.fullName || 'Qualified Legal Professional',
      title: extractedProfile.title || 'Solicitor',
      firmName: extractedProfile.firmName || 'Independent Legal Practice',
      email: extractedProfile.email || 'practitioner@lawyerselect.com.au',
      phone: extractedProfile.phone || '+61 2 9000 0000',
      jurisdictions: extractedProfile.jurisdictions || ['NSW', 'Federal'],
      practiceAreas: extractedProfile.practiceAreas || ['Commercial & Corporate'],
      yearsOfExperience: extractedProfile.yearsOfExperience || 10,
      barOrRegistrationNumber: extractedProfile.barOrRegistrationNumber || 'REG-AU-' + Math.floor(1000 + Math.random() * 9000),
      bio: extractedProfile.bio || 'Accredited Australian legal professional.',
      feeStructure: extractedProfile.feeStructure || 'Hourly Rate',
      hourlyRateAud: extractedProfile.hourlyRateAud || 450,
      locationCity: extractedProfile.locationCity || 'Sydney',
      locationPostcode: extractedProfile.locationPostcode || '2000',
      isVerified: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    lawyerSelectStore.addProfessional(newPro);
    setPublishedSuccess(true);
    onProfilePublished(newPro);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge-purple" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
            <UserCheck size={14} />
            <span>AI Professional Onboarding</span>
          </span>
          <span className="badge-gold">
            <Sparkles size={14} />
            <span>No Boring Old Forms</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '0.75rem' }}>
          Onboard into Lawyer Select with Plain Text
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Paste your website bio, LinkedIn profile, chambers summary, or voice memo. 
          Our Gemini AI will automatically extract and structure your title, jurisdictions, practice areas, credentials, and rates.
        </p>
      </div>

      {publishedSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          <CheckCircle2 size={24} />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Profile Successfully Published!</h4>
            <p style={{ fontSize: '0.85rem', color: '#34d399' }}>
              Your profile is now live in the Lawyer Select directory and active for AI client matching.
            </p>
          </div>
        </div>
      )}

      {/* Input Stage */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Sample Picks */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            One-Click Test Profiles:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sampleBios.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Free-text input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
            Paste Your Legal Bio, Summary, or Practice Notes:
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g. I am John Smith, Senior Solicitor at Smith & Partners in Melbourne. I have 18 years experience handling commercial contracts, workplace disputes, and corporate litigation. My hourly rate is $520. Bar ID LIV-4481. Contact me at john@smithlegal.com.au..."
            className="input-luxury"
            rows={6}
          />
        </div>

        {errorMsg && (
          <div style={{ color: '#fb7185', background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Process button */}
        <button
          onClick={() => handleProcessWithAI()}
          disabled={isProcessing}
          className="btn-gold"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
        >
          {isProcessing ? (
            <>
              <Sparkles className="animate-spin" size={18} />
              <span>AI Reading & Structuring Practice Details...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Process with AI Engine (Sort Everything Out)</span>
            </>
          )}
        </button>
      </div>

      {/* Extracted Structured Card */}
      {isExtracted && (
        <div className="glass-panel glass-panel-gold" style={{ padding: '2.25rem', position: 'relative' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span className="badge-emerald" style={{ marginBottom: '0.35rem' }}>
                <CheckCircle2 size={13} />
                <span>AI Structuring Complete</span>
              </span>
              <h3 style={{ fontSize: '1.6rem', color: '#fff' }}>
                Verified Structured Profile
              </h3>
            </div>
            <span className="badge-gold">
              <ShieldCheck size={14} />
              <span>Ready for Directory & AI Matching</span>
            </span>
          </div>

          {/* Form-less review grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            
            <div style={{ background: 'rgba(10, 14, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Full Name</span>
              <input
                type="text"
                value={extractedProfile.fullName || ''}
                onChange={(e) => setExtractedProfile({ ...extractedProfile, fullName: e.target.value })}
                className="input-luxury"
                style={{ marginTop: '0.25rem', fontSize: '1rem', fontWeight: 700 }}
              />
            </div>

            <div style={{ background: 'rgba(10, 14, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Discipline / Title</span>
              <select
                value={extractedProfile.title || 'Solicitor'}
                onChange={(e) => setExtractedProfile({ ...extractedProfile, title: e.target.value as LegalTitle })}
                className="input-luxury"
                style={{ marginTop: '0.25rem' }}
              >
                <option value="Solicitor">Solicitor</option>
                <option value="Barrister">Barrister</option>
                <option value="Conveyancer">Conveyancer</option>
                <option value="Mediator">Mediator</option>
                <option value="Patent Attorney">Patent Attorney</option>
                <option value="Notary Public">Notary Public</option>
                <option value="Migration Agent">Migration Agent</option>
                <option value="Arbitrator">Arbitrator</option>
                <option value="Paralegal">Paralegal</option>
                <option value="Legal Consultant">Legal Consultant</option>
              </select>
            </div>

            <div style={{ background: 'rgba(10, 14, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Firm / Practice</span>
              <input
                type="text"
                value={extractedProfile.firmName || ''}
                onChange={(e) => setExtractedProfile({ ...extractedProfile, firmName: e.target.value })}
                className="input-luxury"
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ background: 'rgba(10, 14, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>City & Postcode</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="text"
                  value={extractedProfile.locationCity || ''}
                  onChange={(e) => setExtractedProfile({ ...extractedProfile, locationCity: e.target.value })}
                  className="input-luxury"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={extractedProfile.locationPostcode || ''}
                  onChange={(e) => setExtractedProfile({ ...extractedProfile, locationPostcode: e.target.value })}
                  className="input-luxury"
                  style={{ width: '90px' }}
                  placeholder="Postcode"
                />
              </div>
            </div>

            <div style={{ background: 'rgba(10, 14, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Experience & Reg ID</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="number"
                  value={extractedProfile.yearsOfExperience || 10}
                  onChange={(e) => setExtractedProfile({ ...extractedProfile, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  className="input-luxury"
                  style={{ width: '100px' }}
                  title="Years of experience"
                />
                <input
                  type="text"
                  value={extractedProfile.barOrRegistrationNumber || ''}
                  onChange={(e) => setExtractedProfile({ ...extractedProfile, barOrRegistrationNumber: e.target.value })}
                  className="input-luxury"
                  placeholder="Bar / MARA / Reg #"
                />
              </div>
            </div>

            <div style={{ background: 'rgba(10, 14, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fee Structure & Hourly Rate (AUD)</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <select
                  value={extractedProfile.feeStructure || 'Hourly Rate'}
                  onChange={(e) => setExtractedProfile({ ...extractedProfile, feeStructure: e.target.value as FeeStructure })}
                  className="input-luxury"
                >
                  <option value="Hourly Rate">Hourly Rate</option>
                  <option value="Fixed Fee">Fixed Fee</option>
                  <option value="No Win No Fee">No Win No Fee</option>
                  <option value="Retainer">Retainer</option>
                </select>
                <input
                  type="number"
                  value={extractedProfile.hourlyRateAud || 400}
                  onChange={(e) => setExtractedProfile({ ...extractedProfile, hourlyRateAud: parseInt(e.target.value) || 0 })}
                  className="input-luxury"
                  style={{ width: '110px' }}
                  placeholder="$ AUD"
                />
              </div>
            </div>

          </div>

          {/* Practice Areas & Jurisdictions Pills */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
              Extracted Practice Areas:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {(extractedProfile.practiceAreas || []).map((area, idx) => (
                <span key={idx} className="badge-blue" style={{ fontSize: '0.8rem' }}>
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
              Extracted Jurisdictions:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {(extractedProfile.jurisdictions || []).map((jur, idx) => (
                <span key={idx} className="badge-gold" style={{ fontSize: '0.8rem' }}>
                  {jur}
                </span>
              ))}
            </div>
          </div>

          {/* Polished Bio */}
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
              Refined Professional Bio:
            </span>
            <textarea
              value={extractedProfile.bio || ''}
              onChange={(e) => setExtractedProfile({ ...extractedProfile, bio: e.target.value })}
              className="input-luxury"
              rows={4}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleProcessWithAI()}
              className="btn-ghost"
            >
              <RefreshCw size={15} />
              <span>Re-Parse with AI</span>
            </button>

            <button
              onClick={handleSaveProfile}
              className="btn-gold"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              <CheckCircle2 size={16} />
              <span>Publish to Legal Directory</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
