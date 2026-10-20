import { GoogleGenAI } from '@google/genai';

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
  "yearsOfExperience": number of years as an integer,
  "barOrRegistrationNumber": "Practicing certificate number, Bar number, MARA number, or NMAS mediator ID if mentioned, or generate a realistic registration code",
  "bio": "Refined executive professional summary of their experience and core focus (2-4 paragraphs)",
  "feeStructure": "One of: Fixed Fee, Hourly Rate, No Win No Fee, Retainer, Conditional, Free Consultation",
  "hourlyRateAud": estimated or specified hourly rate in AUD as a number,
  "locationCity": "City name (e.g., Sydney, Melbourne, Brisbane, Perth)",
  "locationPostcode": "4-digit Australian postcode"
}

Ensure strictly valid JSON output only without markdown code blocks.

Legal Professional Input:
"""
${freeTextInput}
"""`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
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
    "matchScore": number between 75 and 99,
    "matchRationale": "2-3 sentences explaining precisely why this professional is ideal for this client's specific dispute, urgency, jurisdiction, and legal area."
  }
]
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '[]';
      const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
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
  "estimatedBudget": "Formatted budget string (e.g. '$2,000 - $4,000 AUD')"
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.status(200).json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    console.error('Server AI generation error:', err);
    return res.status(500).json({ error: err.message || 'AI generation failed on server' });
  }
}
