import { GoogleGenAI } from '@google/genai';

async function runGeminiStructuredJson(aiClient: any, prompt: string, temperature = 0.2): Promise<any> {
  let responseText = '{}';
  try {
    if (aiClient.interactions && typeof aiClient.interactions.create === 'function') {
      const interaction = await aiClient.interactions.create({
        model: 'gemini-3.8-flash',
        input: prompt,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
        },
      });
      responseText = interaction.output_text || '{}';
    } else {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature,
        },
      });
      responseText = response.text?.trim() || '{}';
    }
  } catch (err) {
    // Fallback if model alias requires standard call
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature,
      },
    });
    responseText = response.text?.trim() || '{}';
  }

  const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }

  let aiClient: GoogleGenAI;
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to initialize AI client: ' + (err.message || '') });
  }

  const { action, payload } = req.body || {};

  try {
    if (action === 'onboard') {
      const { freeTextInput } = payload || {};
      if (!freeTextInput || typeof freeTextInput !== 'string' || !freeTextInput.trim()) {
        return res.status(400).json({ error: 'Missing freeTextInput parameter' });
      }

      const prompt = `You are the Lawyer Select (#lawyerselect) Onboarding AI Engine.
Analyze the following unstructured description or bio provided by a legal professional.
Extract and structure their profile into valid JSON with this exact schema:
{
  "fullName": "Full legal name with any postnominals (e.g., Sarah Jenkins SC)",
  "title": "One of: Solicitor, Barrister, Conveyancer, Paralegal, Mediator, Patent Attorney, Notary Public, Migration Agent, Arbitrator, Legal Consultant",
  "firmName": "Law firm, chambers, or practice name",
  "email": "Contact email address",
  "phone": "Phone number formatted",
  "jurisdictions": ["Array of: NSW, VIC, QLD, WA, SA, TAS, ACT, NT, Federal"],
  "practiceAreas": ["Array of: Family Law, Criminal Law, Commercial & Corporate, Property & Conveyancing, Immigration Law, Employment & Workplace, Wills & Estates, Intellectual Property, Personal Injury, Civil Litigation, Tax Law, Defamation & Media, Building & Construction, Administrative Law"],
  "yearsOfExperience": number of years as a whole integer,
  "barOrRegistrationNumber": "Practicing certificate number, Bar number, MARA number, or NMAS mediator ID if mentioned, or generate a realistic registration code",
  "bio": "Refined executive professional summary of their experience and core focus (2-4 paragraphs)",
  "feeStructure": "One of: Fixed Fee, Hourly Rate, No Win No Fee, Retainer, Conditional, Free Consultation",
  "hourlyRateAud": estimated or specified hourly rate in AUD as a whole integer (round up, no decimals),
  "locationCity": "City name (e.g., Sydney, Melbourne, Brisbane, Perth)",
  "locationPostcode": "4-digit Australian postcode"
}

Ensure strictly valid JSON output only without markdown code blocks.

Legal Professional Input:
"""
${freeTextInput}
"""`;

      const parsed = await runGeminiStructuredJson(aiClient, prompt, 0.2);
      return res.status(200).json(parsed);
    }

    if (action === 'extractFirmInformationSheet') {
      const { rawBlob } = payload || {};
      if (!rawBlob || typeof rawBlob !== 'string' || !rawBlob.trim()) {
        return res.status(400).json({ error: 'Missing rawBlob parameter' });
      }

      const prompt = `You are the Lawyer Select (#lawyerselect) Regulatory Compliance & Legal Entity AI Engine.
Convert the following unstructured one-blob registration text into a complete, verified Law Firm / Legal Entity "Approved Information Sheet" JSON object.
All numeric amounts or scores must be strict whole integers (rounded up, no decimals).

Output strictly valid JSON matching this exact structure:
{
  "legalEntity": {
    "legalBusinessName": "Registered corporate entity name",
    "tradingNames": ["Array of trading as (t/a) names"],
    "entityIdentifierType": "One of: ABN/ACN (Australia), EIN (US), Companies House CRN (UK), NZBN (New Zealand), Other",
    "entityIdentifierNumber": "ABN / ACN / CRN / EIN number",
    "practiceType": "One of: Sole Practitioner, Partnership, Incorporated Legal Practice (ILP), Multi-Disciplinary Partnership (MDP), Barristers Chambers",
    "firmRegulatoryNumber": "Law Society or Statutory Governing Body Entity ID",
    "principalAddress": "Principal place of practice street address",
    "mailingAddress": "Postal or mailing address",
    "branchOfficeLocations": ["Array of branch office locations"],
    "dxBoxDetails": "Document Exchange (DX) box details or 'N/A'",
    "firmEmail": "General firm email",
    "firmTelephone": "General firm telephone",
    "secureClientIntakeEndpoint": "Secure intake URL or email endpoint",
    "officialWebsiteUrl": "Official website URL"
  },
  "complianceAndInsurance": {
    "insurerOrSchemeName": "PII Insurer or statutory scheme (e.g., Lawcover Insurance NSW, Lexon Insurance QLD, LPLC VIC, SRA Qualifying Insurer)",
    "policyNumber": "PII Policy number",
    "currencyOfCoverCertificate": "Certificate of currency reference and coverage limit in AUD",
    "policyExpirationDate": "YYYY-MM-DD",
    "isGoodStandingConfirmed": true,
    "regulatoryRegisterStatus": "One of: Clean & Active Standing, Subject to Undertaking / Condition, Pending Registry Check",
    "disciplinaryDisclosureNotes": "Formal standing declaration regarding disciplinary proceedings, suspensions, or undertakings"
  },
  "operationalCapabilities": {
    "primaryPracticeAreas": ["Array from: Family Law, Criminal Law, Commercial & Corporate, Property & Conveyancing, Immigration Law, Employment & Workplace, Wills & Estates, Intellectual Property, Personal Injury, Civil Litigation, Tax Law, Defamation & Media, Building & Construction, Administrative Law"],
    "secondaryPracticeAreas": ["Array from same practice area list"],
    "accreditationsAndSpecialisations": ["Array of specialist accreditations, panels, notary or mediator credentials"],
    "jurisdictionsAdmitted": ["Array of State, Federal, High Court, or Foreign Cross-Border jurisdictions"],
    "courtAndRegistryIdentifiers": ["Array of High Court / Federal Court bulk filing IDs or registry codes"],
    "languagesSpoken": ["Array of languages spoken across the practice"]
  },
  "approvedSheetMeta": {
    "aiConfidenceScore": 98,
    "executiveSummary": "2-3 sentence formal regulatory summary confirming corporate structure, PII indemnity coverage, and practice capabilities."
  }
}

Raw Unstructured Registration Blob:
"""
${rawBlob}
"""`;

      const parsed = await runGeminiStructuredJson(aiClient, prompt, 0.1);
      return res.status(200).json(parsed);
    }

    if (action === 'extractPractitionerInformationSheet') {
      const { rawBlob } = payload || {};
      if (!rawBlob || typeof rawBlob !== 'string' || !rawBlob.trim()) {
        return res.status(400).json({ error: 'Missing rawBlob parameter' });
      }

      const prompt = `You are the Lawyer Select (#lawyerselect) Legal Practitioner Admissions & Forensic KYC AI Engine.
Convert the following unstructured one-blob registration text into a complete Individual Practitioner / Lawyer "Approved Information Sheet" JSON object.
All numeric amounts (experience, hourlyRateAud, aiConfidenceScore) must be strict whole integers (rounded up, no decimals).
For identityVerificationKyc.forensicBriefDescription, strictly follow the forensic brief description standard:
"[Document Class & Series] belonging to [Identified Full Name], issued by [Issuing Authority] ([Country]). [Validity status / Expiration date] with [Security feature confirmation]."

Output strictly valid JSON matching this exact structure:
{
  "practitionerProfile": {
    "prefix": "Mr, Ms, Dr, Hon, etc.",
    "fullLegalName": "Full legal name",
    "preferredName": "Preferred working name",
    "postNominals": "e.g., LLB (Hons), JD, LLM, GDLP, SC",
    "title": "One of: Solicitor, Barrister, Conveyancer, Paralegal, Mediator, Patent Attorney, Notary Public, Migration Agent, Arbitrator, Legal Consultant",
    "roleOrPosition": "One of: Partner, Principal, Senior Associate, Associate, Special Counsel, Consultant, Barrister, Sole Practitioner",
    "affiliatedFirmName": "Affiliated Law Firm or Barristers Chambers",
    "email": "Direct practitioner email",
    "phone": "Direct practitioner phone",
    "locationCity": "City (e.g., Sydney, Melbourne, Brisbane, Perth)",
    "locationPostcode": "4-digit postcode",
    "yearsOfExperience": 12,
    "feeStructure": "One of: Hourly Rate, Fixed Fee, No Win No Fee, Retainer, Conditional, Free Consultation",
    "hourlyRateAud": 550,
    "practisingCertificate": {
      "pcNumber": "PC number or Bar Association license number",
      "licensingAuthority": "Issuing authority (e.g., Law Society of NSW, QLS, VLSB+C, SRA)",
      "certificateCategory": "One of: Principal (Unrestricted), Employee Solicitor, Corporate Practising Certificate, Barrister Practising Certificate, Unrestricted Practising Certificate, Restricted (Supervised), Registered Migration Agent (MARA), Licensed Conveyancer",
      "admissionDate": "YYYY-MM-DD",
      "admissionJurisdiction": "Supreme Court / Jurisdiction of first admission",
      "pcExpirationDate": "YYYY-MM-DD"
    },
    "identityVerificationKyc": {
      "documentType": "One of: Australian Passport, International Passport, State Driver Licence, Government Photo ID",
      "issuingAuthority": "e.g., Australian Passport Office (DFAT) or Transport for NSW",
      "documentReference": "Masked document reference",
      "expirationDate": "YYYY-MM-DD",
      "forensicBriefDescription": "Standardized 1-2 sentence forensic verification summary confirming MRZ/holographic or OVI laminate authenticity",
      "verificationStatus": "Verified Authentic"
    }
  },
  "complianceAndInsurance": {
    "insurerOrSchemeName": "PII Insurer / Scheme (e.g., Lawcover NSW, Lexon QLD, LPLC VIC, BarCover)",
    "policyNumber": "PII Policy number",
    "currencyOfCoverCertificate": "Certificate of currency status & limit in AUD",
    "policyExpirationDate": "YYYY-MM-DD",
    "isGoodStandingConfirmed": true,
    "regulatoryRegisterStatus": "One of: Clean & Active Standing, Subject to Undertaking / Condition, Pending Registry Check",
    "disciplinaryDisclosureNotes": "Good standing declaration regarding active disciplinary proceedings, suspensions, or undertakings"
  },
  "operationalCapabilities": {
    "primaryPracticeAreas": ["Array from: Family Law, Criminal Law, Commercial & Corporate, Property & Conveyancing, Immigration Law, Employment & Workplace, Wills & Estates, Intellectual Property, Personal Injury, Civil Litigation, Tax Law, Defamation & Media, Building & Construction, Administrative Law"],
    "secondaryPracticeAreas": ["Array from same practice area list"],
    "accreditationsAndSpecialisations": ["Array of Law Society Accredited Specialist, Mediator, or Notary credentials"],
    "jurisdictionsAdmitted": ["Array of State, Federal, High Court, or Foreign Cross-Border admissions"],
    "courtAndRegistryIdentifiers": ["Array of High Court / Federal Court bulk filing IDs or registry codes"],
    "languagesSpoken": ["Array of languages spoken"]
  },
  "approvedSheetMeta": {
    "aiConfidenceScore": 99,
    "executiveSummary": "2-3 sentence formal admissions summary verifying practising certificate, PII cover, KYC identity inspection, and specialist capabilities."
  }
}

Raw Unstructured Registration Blob:
"""
${rawBlob}
"""`;

      const parsed = await runGeminiStructuredJson(aiClient, prompt, 0.1);
      return res.status(200).json(parsed);
    }

    if (action === 'matchmaker') {
      const { enquiryText, userLocation, urgency, professionals } = payload || {};
      if (!enquiryText || typeof enquiryText !== 'string' || !enquiryText.trim()) {
        return res.status(400).json({ error: 'Missing enquiryText parameter' });
      }

      const prompt = `You are Lawyer Select (#lawyerselect) Senior Legal Matching AI.
A client needs legal assistance. You must evaluate the client's inquiry and score the legal professionals in our database to return the TOP 3 BEST MATCHED legal professionals.

Client Enquiry:
"""
${enquiryText}
Location: ${userLocation || 'Australia'}
Urgency: ${urgency || 'Standard (7-14 Days)'}
"""

Available Legal Professionals:
${JSON.stringify(
  (professionals || []).map((p: any) => ({
    id: p.id,
    fullName: p.fullName,
    title: p.title,
    firmName: p.firmName,
    jurisdictions: p.jurisdictions,
    practiceAreas: p.practiceAreas,
    yearsOfExperience: p.yearsOfExperience,
    feeStructure: p.feeStructure,
    hourlyRateAud: p.hourlyRateAud,
    locationCity: p.locationCity,
    bio: p.bio,
  })),
  null,
  2
)}

Task:
Return a JSON array of EXACTLY 3 objects for the top 3 best matching professionals, sorted by highest matchScore first:
[
  {
    "professionalId": "id matching the professional",
    "matchScore": number between 75 and 99 (whole integer only),
    "matchRationale": "2-3 sentences explaining precisely why this professional is ideal for this client's specific dispute, urgency, jurisdiction, and legal area."
  }
]
`;

      const parsed = await runGeminiStructuredJson(aiClient, prompt, 0.2);
      return res.status(200).json(parsed);
    }

    if (action === 'sanitizeCase') {
      const { rawIssue, userLocation, urgency, budget } = payload || {};
      if (!rawIssue || typeof rawIssue !== 'string' || !rawIssue.trim()) {
        return res.status(400).json({ error: 'Missing rawIssue parameter' });
      }

      const prompt = `You are Lawyer Select (#lawyerselect) Privacy & Case Extraction AI.
In compliance with Australian Privacy Principle APP 11 and Legal Professional Privilege:
Sanitize and redact the following consumer legal submission for our anonymous legal marketplace case board.

Rules:
1. The anonymousSummary MUST STRIP ALL personal identifiers: client full name, opposing party personal names, direct phone numbers, personal emails, and specific street addresses.
2. Keep the factual legal conflict intact (e.g. "Commercial lease lockout in Parramatta", "Unfair dismissal from finance role", "Property settlement contract dispute").
3. Create a concise, professional legal title.
4. Identify the primary Australian Practice Area and State/Federal Jurisdiction.
5. Provide a 1-sentence description of key legal assistance required.

Client Submission:
"""
Issue: ${rawIssue}
Location: ${userLocation || 'NSW'}
Urgency: ${urgency || 'Standard (7-14 Days)'}
Budget: ${budget || 'Market Rate'}
"""

Output JSON Schema:
{
  "title": "Concise professional title (max 12 words)",
  "category": "One of: Family Law, Criminal Law, Commercial & Corporate, Property & Conveyancing, Immigration Law, Employment & Workplace, Wills & Estates, Intellectual Property, Personal Injury, Civil Litigation, Tax Law, Defamation & Media, Building & Construction, Administrative Law",
  "jurisdiction": "One of: NSW, VIC, QLD, WA, SA, TAS, ACT, NT, Federal",
  "anonymousSummary": "Professional sanitized summary with zero direct PII (2-3 paragraphs)",
  "keyAssistanceRequired": "Specific legal tasks needed (e.g., Injunction drafting, Contract rescission, Fair Work representation)",
  "estimatedBudget": "Formatted budget string in whole AUD (e.g. '$2,000 - $4,000 AUD')"
}`;

      const parsed = await runGeminiStructuredJson(aiClient, prompt, 0.1);
      return res.status(200).json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    console.error('Server AI generation error:', err);
    return res.status(500).json({ error: err.message || 'AI generation failed on server' });
  }
}
