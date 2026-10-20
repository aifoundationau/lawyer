# Data Contracts & System Integrity Specification
**Project**: Lawyer Select (`#lawyerselect`)  
**Specification Version**: `1.0.0-IMMUTABLE`  
**Classification**: Single Source of Truth (SSOT) & Permanent Data Boundary  
**Effective Date**: October 2026  
**Auditor**: Data Architect & System Integrity Engineer  
**Mandatory Retention Period**: **7 Years** (Australian Corporations Act 2001 s 286, ATO Tax Compliance, Australian Privacy Principle APP 11)

---

## 1. Architectural Foundations & System Invariants

### 1.1 Multi-Tenant Shared Database Boundary
The application operates within Google Cloud Firestore (`ai-foundation-firebase`) shared among distinct platforms.
- **Invariant Rule 1 (Tenant Partitioning)**: Every single database record, audit entry, and transaction created by this application **MUST** include the immutable partition key:
  ```json
  {
    "tag": "lawyerselect",
    "source": "lawyerselect"
  }
  ```
- **Invariant Rule 2 (Query Scoping)**: All database queries executing on shared collections (e.g., `transactions`, `activity_logs`, `chat_interactions`) **MUST** include an explicit equality predicate on `tag == 'lawyerselect'` to guarantee absolute data isolation.

### 1.2 Two-Sided Legal Services Architecture & Privacy Guardrails
1. **Service 1: AI Legal Professional Onboarding & Client AI Match**:
   - Legal professionals input their details into the AI conversational engine without rigid forms. AI structures and verifies credentials.
   - Prospective clients describe their legal issue, location, urgency, and budget to the AI agent.
   - The AI agent matches and returns the **top 3 legal practitioners** suited to the client's needs.
   - **Restricted Initial Contact**: Initial contact is facilitated strictly through Firebase `chat_interactions`. A chat channel is created **ONLY** when a client explicitly selects to connect with that specific practitioner.
2. **Service 2: Marketplace Legal Case Pool & $20 Flat-Fee Unlock**:
   - Clients place legal matters into the database via AI intake.
   - All legal practitioners can search and filter available matters.
   - **Mandatory APP 11 / Legal Privacy Redaction**: Public marketplace case cards display an anonymous, factual summary **WITHOUT PII** (no client names, email addresses, phone numbers, exact residential street addresses, or opposing party identities).
   - **$20 Flat-Fee Monetization**: Legal professionals can acquire/unlock a case for a flat fee of **$20.00 AUD**. Upon verified Stripe payment, the client's direct contact info and confidential case dossier are unlocked exclusively for the purchaser.

### 1.3 PCI DSS Scope Minimization (SAQ A)
- Raw cardholder data (PAN, CVV, Expiration) never touches the application servers.
- Payments are processed via Stripe Checkout or Stripe Payment Element.
- Lead purchases are verified via cryptographic Stripe Webhook signatures (`STRIPE_WEBHOOK_SECRET`).

---

## 2. Ingestion Interface Audit & Entity Contracts

### Domain 1: Legal Professional Onboarding & Directory Profile (`legal_professionals`)
*Ingestion Channels*: AI Conversational Intake Slot (`/api/ai/onboarding`), Profile Edit UI Form (`/api/legal-professionals/profile`).

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Target Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | String | Server / Auth UID | Internal Identifier | Format: `lp_[a-zA-Z0-9_-]+` or Firebase Auth UID. Unique index. | Firestore Document ID. |
| `tag` | String Enum | Server Injection | Partition Key | **Constant**: `'lawyerselect'`. Immutable. | Root field, Indexed. |
| `fullName` | String | AI Slot / UI Form | PII | Length: `2..100` chars. Sanitized, trimmed. HTML escaped. | Firestore document field. |
| `title` | String Enum | AI Slot / UI Form | Public Profile | Allowed: `['Solicitor', 'Barrister', 'Conveyancer', 'Paralegal', 'Mediator', 'Patent Attorney', 'Notary Public', 'Migration Agent', 'Arbitrator', 'Legal Consultant']`. | Root field, Indexed. |
| `firmName` | String | AI Slot / UI Form | Public Profile | Length: `2..150` chars. Sanitized, trimmed. | Root field. |
| `email` | String | AI Slot / UI Form | PII / Contact | RFC 5322 regex. Normalized lowercase, trimmed. | Root field. Encrypted at rest. |
| `phone` | String | AI Slot / UI Form | PII / Contact | E.164 phone format or AU domestic `^(\+?61\|0)[2-478]([0-9]{8})$`. | Root field. Encrypted at rest. |
| `jurisdictions` | Array<Enum> | AI Slot / UI Selector | Public Profile | Array of: `['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Federal']`. Min 1 item. | Root array, Array-contains indexed. |
| `practiceAreas` | Array<Enum> | AI Slot / UI Selector | Public Profile | Array of legal practice categories. Min 1 item. | Root array, Array-contains indexed. |
| `yearsOfExperience` | Integer | AI Slot / UI Form | Professional Credential | Range: `0 <= years <= 70`. Integer only. | Root numeric field. |
| `barOrRegistrationNumber` | String | AI Slot / UI Form | Sensitive Regulatory | Length: `3..50` chars. Normalized uppercase. | Root field. |
| `bio` | String | AI Slot / UI Textarea | Public Profile | Length: `20..3000` chars. HTML sanitization applied. | Root field. |
| `feeStructure` | String Enum | AI Slot / UI Selector | Financial Rate | Enum: `['Fixed Fee', 'Hourly Rate', 'No Win No Fee', 'Retainer', 'Conditional', 'Free Consultation']`. | Root field. |
| `hourlyRateAud` | Number | AI Slot / UI Form | Financial Rate | Range: `0 <= rate <= 5000`. Currency AUD. | Root numeric field. |
| `locationCity` | String | AI Slot / UI Form | Public Profile | Length: `2..100` chars. Trimmed. | Root field, Indexed. |
| `locationPostcode` | String | AI Slot / UI Form | Public Profile | Australian 4-digit postcode regex: `^[0-9]{4}$`. | Root field. |
| `isVerified` | Boolean | Server Lifecycle | Integrity State | Default: `true` (demo/licensed verification). | Root field. |
| `status` | String Enum | Server Lifecycle | State Machine | Enum: `['active', 'pending_review', 'suspended']`. Default: `'active'`. | Root field, Indexed. |
| `createdAt` | Timestamp | Server | Audit Timestamp | ISO 8601 UTC. Immutable. | Root field. Retained 7 years. |
| `updatedAt` | Timestamp | Server | Audit Timestamp | ISO 8601 UTC. Updated on every modification. | Root field. |

---

### Domain 2: Client Legal Inquiry & AI Matching (`client_matches`)
*Ingestion Channels*: AI Legal Assistant Slot (`/api/ai/match-inquiry`), UI Inquiry Form.

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Target Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `matchRequestId` | String | Server Generator | Internal Identifier | Format: `mrq_[a-zA-Z0-9]+`. Unique. | Firestore Document ID. |
| `tag` | String Enum | Server Injection | Partition Key | **Constant**: `'lawyerselect'`. Immutable. | Root field. |
| `clientName` | String | AI Slot / UI Form | PII | Length: `2..100` chars. Trimmed, HTML escaped. | Root field. |
| `clientEmail` | String | AI Slot / UI Form | PII | Valid email regex. Normalized lowercase. | Root field. Encrypted at rest. |
| `clientPhone` | String | AI Slot / UI Form | PII | E.164 phone regex. Trimmed. | Root field. Encrypted at rest. |
| `legalIssueDescription` | String | AI Slot / Textarea | Confidential Legal | Length: `10..5000` chars. Sanitized. | Root field. APP 11 guarded. |
| `category` | String Enum | AI Extraction | Public Taxonomy | Valid practice area enum. | Root field, Indexed. |
| `locationState` | String Enum | AI Extraction | Public Taxonomy | Enum: `['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Federal']`. | Root field, Indexed. |
| `locationSuburb` | String | AI Extraction | Public Taxonomy | Length: `2..100` chars. | Root field. |
| `urgency` | String Enum | AI Extraction | Priority Meta | Enum: `['Immediate (24h)', 'Urgent (2-3 Days)', 'Standard (1-2 Weeks)', 'Exploratory']`. | Root field. |
| `preferredProfession` | String Enum | AI Extraction | Preference | Enum: `['Any', 'Solicitor', 'Barrister', 'Conveyancer', 'Mediator', etc.]`. | Root field. |
| `budgetExpectation` | String Enum | AI Extraction | Financial Expectation | Enum: `['Flexible', 'Under $1,000', '$1,000 - $3,000', '$3,000 - $10,000', 'Enterprise']`. | Root field. |
| `matchedProfessionals` | Array<Object> | AI Match Engine | System Output | Exactly 3 objects containing `[professionalId, professionalName, matchScore, matchRationale]`. | Nested Array in document. |
| `selectedProfessionalId` | String | UI Action | Workflow Pointer | Target legal professional ID selected by client to initiate chat. Nullable initially. | Root field. |
| `createdAt` | Timestamp | Server | Audit Timestamp | ISO 8601 UTC. Immutable. | Root field. Retained 7 years. |

---

### Domain 3: Direct Chat Interactions (`chat_interactions`)
*Ingestion Channels*: UI Chat Interface, Firebase Real-time Firestore SDK, API Route (`/api/chat/send-message`).

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Target Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `interactionId` | String | Server Generator | Internal Identifier | Format: `chat_[a-zA-Z0-9]+`. Unique. | Firestore Document ID. |
| `tag` | String Enum | Server Injection | Partition Key | **Constant**: `'lawyerselect'`. Immutable. | Root field, Indexed. |
| `clientId` | String | Server / Session | Authorization Principal | Required. Client UID / Session token. | Root field, Security rule key. |
| `lawyerId` | String | Server / Selection | Authorization Principal | Required. Matched/Selected Legal Pro UID. | Root field, Security rule key. |
| `matchRequestId` | String | Server Injection | Foreign Key | Optional reference to originating match. | Root field. |
| `caseId` | String | Server Injection | Foreign Key | Optional reference if originating from $20 marketplace lead purchase. | Root field. |
| `status` | String Enum | Lifecycle Trigger | Workflow State | Enum: `['active', 'closed', 'archived']`. Default: `'active'`. | Root field. |
| `lastMessageSnippet` | String | Message Trigger | Audit Summary | Max 150 chars preview. | Root field. |
| `lastMessageAt` | Timestamp | Message Trigger | Audit Timestamp | ISO 8601 UTC. | Root field, Indexed. |
| `messages` (Subcoll.) | Collection | UI Chat Input | Confidential Communication | Subcollection `messages/{messageId}`. | Firestore Subcollection. |
| `messages.senderId` | String | Session | Principal Check | Must equal `clientId` OR `lawyerId`. Unauthorized writes rejected. | Message doc field. |
| `messages.senderRole` | String Enum | Session | Role Check | Enum: `['client', 'legal_professional']`. | Message doc field. |
| `messages.content` | String | UI Textarea | Privileged Legal Communication | Length: `1..4000` chars. HTML sanitized, script tags rejected. | Message doc field. |
| `messages.sentAt` | Timestamp | Server | Timestamp | ISO 8601 UTC. Server-side timestamp. | Message doc field. |
| `messages.read` | Boolean | Client Receiver | Read Receipt | Default: `false`. Toggled to `true` on recipient view. | Message doc field. |

---

### Domain 4: Marketplace Legal Case Pool (`marketplace_cases`)
*Ingestion Channels*: Client Case Intake AI Slot (`/api/ai/submit-case`), UI Public Lead Board.

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Target Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseId` | String | Server Generator | Internal Identifier | Format: `case_[a-zA-Z0-9]+`. Unique index. | Firestore Document ID. |
| `tag` | String Enum | Server Injection | Partition Key | **Constant**: `'lawyerselect'`. Immutable. | Root field, Indexed. |
| **PUBLIC SECTION** | | | **APP 11 Compliant** | **Strictly Redacted - Zero Direct PII** | |
| `title` | String | AI Slot / UI Form | Public Lead Summary | Length: `5..150` chars. e.g. "Commercial Lease Forfeiture Dispute in Parramatta". | Root field. |
| `category` | String Enum | AI Slot / UI Selector | Public Lead Summary | Valid practice area enum. | Root field, Indexed. |
| `jurisdiction` | String Enum | AI Slot / UI Selector | Public Lead Summary | Enum: `['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Federal']`. | Root field, Indexed. |
| `urgency` | String Enum | AI Slot / UI Selector | Public Lead Summary | Enum: `['Immediate (24h)', 'Urgent (2-3 Days)', 'Standard', 'Exploratory']`. | Root field. |
| `anonymousSummary` | String | AI Sanitizer Slot | Public Lead Summary | Length: `30..2000` chars. PII scrubbing verified: names, phone numbers, emails, and counterparties stripped. | Root field. |
| `keyAssistanceRequired` | String | AI Slot / UI Form | Public Lead Summary | Length: `10..500` chars. e.g. "Review lease clauses and draft notice of dispute". | Root field. |
| `estimatedBudget` | String | AI Slot / UI Form | Public Lead Summary | Length: `3..50` chars. e.g. "$1,500 - $3,000 AUD". | Root field. |
| `status` | String Enum | System State | Lead State Machine | Enum: `['open', 'claimed', 'closed']`. Default: `'open'`. | Root field, Indexed. |
| `postedAt` | Timestamp | Server | Audit Timestamp | ISO 8601 UTC. Immutable. | Root field, Indexed. |
| **RESTRICTED DOSSIER** | | | **Sensitive Legal / PII** | **LOCKED: Released only to verified purchaser** | |
| `clientFullName` | String | Intake Slot | PII | Hidden until $20 purchase transaction verified. | Root field. Encrypted at rest. |
| `clientEmail` | String | Intake Slot | PII | Hidden until $20 purchase transaction verified. | Root field. Encrypted at rest. |
| `clientPhone` | String | Intake Slot | PII | Hidden until $20 purchase transaction verified. | Root field. Encrypted at rest. |
| `fullFactualDetails` | String | Intake Slot | Confidential Legal | Complete unredacted statement of facts. | Root field. Encrypted at rest. |
| `claimedBy` | String | Server Transaction | Foreign Key | Legal Professional ID of purchaser. Nullable when open. | Root field. Indexed. |
| `claimedAt` | Timestamp | Server Transaction | Audit Timestamp | Nullable when open. | Root field. |

---

### Domain 5: Financial Transactions & Lead Purchases (`case_purchases`)
*Ingestion Channels*: Stripe Checkout API (`/api/cases/purchase-lead`), Cryptographic Stripe Webhook (`/api/webhooks/stripe`).

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Target Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `purchaseId` | String | Server Generator | Internal Identifier | Format: `pur_[a-zA-Z0-9]+`. Unique. | Firestore Document ID. |
| `tag` | String Enum | Server Injection | Partition Key | **Constant**: `'lawyerselect'`. Immutable. | Root field, Indexed. |
| `caseId` | String | API Body | Foreign Key | Required. Must exist in `marketplace_cases`. | Root field, Indexed. |
| `legalProfessionalId` | String | Session / Body | Foreign Key | Required. Purchasing legal professional ID. | Root field, Indexed. |
| `amount` | Integer | System Constant | Financial | **Constant**: `2000` (in cents = $20.00 AUD). Tamper-proof server enforcement. | Root numeric integer. |
| `currency` | String Enum | System Constant | Financial | **Constant**: `'aud'`. Immutable. | Root field. |
| `stripeSessionId` | String | Stripe API Response | External Audit | Pattern: `^cs_(test\|live)_[a-zA-Z0-9]+$`. Unique index. | Root field, Indexed. |
| `stripePaymentIntentId` | String | Stripe Webhook | External Audit | Pattern: `^pi_[a-zA-Z0-9]+$`. Unique. | Root field. |
| `status` | String Enum | Webhook Transition | Audit State Machine | Enum: `['initiated', 'completed', 'failed', 'refunded']`. | Root field, Indexed. |
| `clientNotificationSent` | Boolean | Post-Purchase Action | Operational State | Default: `false`. Toggled to `true` when intro email dispatched. | Root field. |
| `createdAt` | Timestamp | Server | Audit Timestamp | ISO 8601 UTC. Retained 7 years. | Root field. |
| `completedAt` | Timestamp | Webhook | Audit Timestamp | Timestamp of confirmed Stripe charge. | Root field. |

---

## 3. Regulatory Compliance & Data Retention Protocol

1. **Australian Privacy Act 1988 & Australian Privacy Principles (APPs)**:
   - **APP 1 (Open and transparent management of personal information)**: Clear notice provided to clients on how inquiries are processed and matched.
   - **APP 3 & APP 5 (Collection and notification of personal information)**: Only information strictly necessary for legal assessment is ingested.
   - **APP 6 (Use or disclosure of personal information)**: Marketplace case board strictly redacts direct identifiers. Disclosure occurs only to the single legal professional who purchases the lead for $20.
   - **APP 11 (Security of personal information)**: Encryption in-transit (TLS 1.3) and at-rest (Firestore AES-256). All records retained for exactly **7 years** in accordance with the Corporations Act 2001 and ATO guidelines.
2. **Legal Professional Privilege (LPP) Protective Separation**:
   - Inquiry notes and case details submitted by consumers are tagged as confidential legal materials.
   - No data is shared with unauthenticated third parties or used for external model training.
3. **PCI DSS Compliance (SAQ A)**:
   - Hosted Stripe Checkout sessions minimize PCI scope. No cardholder PAN or CVV is transmitted through Lawyer Select servers.
