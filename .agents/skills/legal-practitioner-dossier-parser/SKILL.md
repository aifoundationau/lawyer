---
name: legal-practitioner-dossier-parser
description: Extracts, normalizes, and validates a 17-category Legal Practitioner Application Dossier from unstructured text pastes (CVs, biographies, case lists, and admission credentials) with 256-bit AES-GCM encryption metadata and token-gated contact release. Engineered for 100% deterministic reliability across all AI models including low-cost models (Gemini 2.5 Flash-Lite, Claude Haiku 4.5, gpt-6-luna).
---

# Legal Practitioner 17-Category Dossier Parser Skill

## Purpose
This skill enables any AI model—including lightweight, low-cost, high-throughput models (`Gemini 2.5 Flash-Lite`, `Claude Haiku 4.5`, `gpt-6-luna`)—to parse a lawyer's unstructured registration paste (qualifications, experience, notable cases, bar admissions, and fee structures) into a strict 17-category JSON schema ready for 256-bit AES encryption and Firebase Firestore storage (`lawyerselect`).

## Cross-Model Compatibility Rules
1. **Flat Key-Value JSON Output**: Low-cost models can fail on deeply nested polymorphic schemas. All 17 categories are represented at the root of the `categories` object with deterministic types (`string`, `number`, or `string[]`).
2. **Zero Nulls / Strict Defaults**: Never emit `null` or `undefined`. Use `"Not Disclosed"` for missing strings, `[]` for missing arrays, and whole integers (`Math.ceil`) for numeric fields (`yearsOfPractice`, `hourlyRateAud`, `tokenUnlockCost`).
3. **Token-Gated Contact Protection**: Direct contact fields (`verifiedContactChannels`) are flagged for 256-bit AES-GCM encryption and released to prospective clients strictly after token payment (`tokenUnlockCost: 1` or SuperAdmin-configured integer).

## The 17 Mandatory Extraction Categories

1. `location`: Jurisdiction, Australian state/territory (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`, `Federal`), city/suburb, and primary office address.
2. `practiceAreas`: Primary and secondary areas of law (e.g., Family Law, Criminal Defense, Corporate & Commercial, Intellectual Property, Immigration).
3. `barAdmissionsAndLicensing`: Practicing certificate status, year admitted, and regulatory body ID (e.g., Law Society / Bar Association practitioner number).
4. `firmOrEmployerAffiliation`: Current law firm name, chambers, in-house organization, or solo practitioner status.
5. `experienceLevelAndSeniority`: Total years of practice (strict integer) and current title (Partner, Principal, Barrister, Special Counsel, Senior Associate, Associate).
6. `pastLegalWorkExperience`: Previous law firms, in-house legal departments, judicial clerkships, and government agencies.
7. `careerMilestonesAndRoles`: Chronological role progression (e.g., Paralegal -> Associate -> Senior Associate -> Partner).
8. `formalEducationAndLawDegrees`: Undergraduate institution, law degrees (`LL.B.`, `J.D.`), postgraduate qualifications (`LL.M.`), and graduation years.
9. `academicAndContinuingLegalEducation`: Adjunct lectureships, teaching roles, CLE certifications, and specialized diplomas.
10. `professionalAccreditations`: Formal board certifications or Law Society Accredited Specialist statuses, NMAS Mediator, Public Notary.
11. `courtsOfAdmission`: Courts of admission and rights of audience (e.g., State Supreme Court, Federal Court of Australia, High Court of Australia).
12. `judicialAppointmentsAndPublicService`: Former judgeships, public prosecutor/defender tenure, tribunal memberships, and pro bono engagements.
13. `publicationsAndNotableMatters`: Reported judgments, published legal papers, and landmark trial representations.
14. `feeStructureAndPricing`: Billing basis (`Hourly Rate`, `Fixed Fee`, `No Win No Fee`, `Retainer`) and integer AUD hourly rate.
15. `languagesSpoken`: Languages fluent enough to conduct legal consultations.
16. `verifiedContactChannels`: Direct professional email, phone number, and secure booking/portal URL (encrypted at rest via 256-bit AES-GCM; unlocked via token payment).
17. `clientReviewsAndReputation`: Client ratings, disciplinary register check status, industry rankings (Doyle's Guide, Chambers), and peer recognitions.

## System Prompt Template for Low-Cost Models

```text
You are a Legal Credential Extraction Engine for an Australian legal marketplace.
Parse the user's unstructured text into a valid JSON object matching the 17-category schema.
Rules:
- Output ONLY valid JSON. Do not wrap in markdown code fences if responseMimeType is application/json.
- Round all numeric values up to the nearest whole integer (zero decimals).
- If a category is not mentioned in the input text, populate string fields with "Pending Verification" and array fields with an appropriate default based on context.
```
