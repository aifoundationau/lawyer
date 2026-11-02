---
name: legal-matcher-17-pillar
description: Evaluates and ranks legal practitioners across all 17 statutory categories to recommend the Top 3 optimal matches for a client's legal inquiry. Engineered for 100% deterministic reliability across all AI models including low-cost models (Gemini 2.5 Flash-Lite, Claude Haiku 4.5, gpt-6-luna) with token-gated contact release.
---

# Legal Practitioner 17-Pillar Matcher Skill

## Purpose
This skill equips any AI model—including low-cost, high-throughput models (`Gemini 2.5 Flash-Lite`, `Claude Haiku 4.5`, `gpt-6-luna`)—to evaluate prospective clients' legal inquiries against registered legal practitioners across all 17 specialist legal categories, producing a validated Top 3 ranking with deterministic rationales and token-gated contact unlock parameters.

## Cross-Model Scoring Principles
1. **Deterministic 4-Pillar Evaluation Matrix**:
   - **Pillar A: Jurisdiction & Proximity (25 pts)**:
     - Cat 1 (Location: State/Territory & Suburb match: up to 15 pts)
     - Cat 11 (Courts of Admission: Supreme Court, Federal Court, High Court of Australia: up to 10 pts)
   - **Pillar B: Practice Expertise & Precedents (35 pts)**:
     - Cat 2 (Practice Areas alignment: up to 20 pts)
     - Cat 13 (Publications, Case Studies & Notable Matters: up to 10 pts)
     - Cat 10 (Specialist Accreditations & Certifications: up to 5 pts)
   - **Pillar C: Seniority, Standing & Trust (20 pts)**:
     - Cat 3 (Bar Admissions & Active Unrestricted PC: up to 5 pts)
     - Cat 5 (Years of Practice matched to complexity: up to 8 pts)
     - Cat 8 (Formal Law Degrees & Postgraduate LL.M.: up to 3 pts)
     - Cat 17 (Client Reviews & Clean Regulatory Standing: up to 4 pts)
   - **Pillar D: Commercial & Engagement Fit (20 pts)**:
     - Cat 14 (Fee Structure alignment - Fixed Fee, Hourly, No Win No Fee: up to 10 pts)
     - Cat 15 (Languages Spoken matching client needs: up to 5 pts)
     - Cat 4 & 12 (Firm Structure & Public Service/Pro Bono: up to 5 pts)

2. **Strict Integer Match Scoring**:
   - Composite scores are strictly integers between 70 and 99 (`Math.round`).
   - The Top 3 highest scoring practitioners are selected.

3. **Token-Gated Contact Protection**:
   - Cat 16 (Verified Contact Channels: Email, Phone, Booking URL) is flagged as encrypted (`isContactEncrypted: true`).
   - Unlocked exclusively when the client spends platform tokens (controlled by SuperAdmin, default: 1 token = $1 AUD).

## Universal Output Schema

```json
{
  "topMatches": [
    {
      "rank": 1,
      "practitionerId": "lp_...",
      "fullName": "...",
      "matchScore": 96,
      "matchRationale": "...",
      "pillarBreakdown": {
        "jurisdictionAndProximity": 24,
        "practiceExpertise": 34,
        "seniorityAndStanding": 19,
        "commercialFit": 19
      },
      "highlightedNotableMatter": "...",
      "feeStructure": "Hourly Rate",
      "hourlyRateAud": 550,
      "tokenUnlockCost": 1,
      "isContactLocked": true
    }
  ]
}
```

