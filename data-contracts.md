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

---

## 4. Multi-Currency, Geolocation & Token Economy Contracts

### Domain 6: System Configuration, Currency & Geolocation (`system_settings`)
*Ingestion Channel*: SuperAdmin Control Panel (`/api/admin/settings`).  
*Partition Key*: `tag: 'lawyerselect'`. Document ID: `system_settings/global_config`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SystemSettingsSchema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "tag",
    "source",
    "defaultCurrency",
    "defaultTokenPriceAud",
    "roundingPolicy",
    "audToUsdExchangeRate",
    "isTokenSystemEnabled",
    "isAudEnabled",
    "isUsdEnabled",
    "geoDetectionEnabled",
    "auNzRegionCodes",
    "invoiceDisclaimer",
    "updatedAt",
    "updatedByUid"
  ],
  "properties": {
    "id": { "type": "string", "enum": ["global_config"] },
    "tag": { "type": "string", "enum": ["lawyerselect"] },
    "source": { "type": "string", "enum": ["lawyerselect"] },
    "defaultCurrency": { "type": "string", "enum": ["AUD"] },
    "defaultTokenPriceAud": { 
      "type": "integer", 
      "minimum": 1, 
      "maximum": 1,
      "description": "Default price for 1 token is fixed strictly at AUD $1. Whole number only." 
    },
    "roundingPolicy": { 
      "type": "string", 
      "enum": ["CEIL_WHOLE_NUMBERS"], 
      "description": "Strict whole numbers only. Math.ceil is applied to round up all calculations. Zero decimals permitted for token balances or final charges." 
    },
    "audToUsdExchangeRate": { 
      "type": "number", 
      "minimum": 0.001, 
      "maximum": 10.0,
      "description": "Conversion rate from AUD to USD. Display formatting restricted to a maximum of 3 decimal places (e.g. 0.655)." 
    },
    "isTokenSystemEnabled": { "type": "boolean" },
    "isAudEnabled": { "type": "boolean" },
    "isUsdEnabled": { "type": "boolean" },
    "geoDetectionEnabled": { "type": "boolean" },
    "auNzRegionCodes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of country codes designating Australia and New Zealand (e.g. ['AU', 'NZ', 'AUS', 'NZL'])."
    },
    "invoiceDisclaimer": {
      "type": "string",
      "enum": ["All invoices and receipts are issued strictly in Australian Dollars (AUD)."]
    },
    "updatedAt": { "type": "string", "format": "date-time" },
    "updatedByUid": { "type": "string" }
  }
}
```

---

### Domain 7: Products & Services Catalog (`products_and_services`)
*Ingestion Channels*: SuperAdmin Item CRUD (`/api/admin/products`).  
*Description*: All items, lead types, and platform features sold on Lawyer Select. SuperAdmin sets the token amount for every product/service.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProductAndServiceItemSchema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "tag",
    "source",
    "name",
    "description",
    "category",
    "tokenAmount",
    "priceAud",
    "priceUsdEstimated",
    "isActive",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^prod_[a-zA-Z0-9_-]+$" },
    "tag": { "type": "string", "enum": ["lawyerselect"] },
    "source": { "type": "string", "enum": ["lawyerselect"] },
    "name": { "type": "string", "minLength": 3, "maxLength": 120 },
    "description": { "type": "string", "minLength": 5, "maxLength": 1000 },
    "category": { 
      "type": "string", 
      "enum": [
        "lead_unlock",
        "practitioner_subscription",
        "intake_triage",
        "document_summary",
        "consultation_deposit",
        "custom"
      ] 
    },
    "tokenAmount": { 
      "type": "integer", 
      "minimum": 1,
      "description": "Strict whole integer token cost. Set by SuperAdmin. Decimals strictly forbidden." 
    },
    "priceAud": { 
      "type": "integer", 
      "minimum": 1,
      "description": "Strict whole integer in AUD ($1 AUD per 1 token). Decimals strictly forbidden." 
    },
    "priceUsdEstimated": { 
      "type": "number", 
      "minimum": 0.001,
      "description": "Calculated as priceAud * audToUsdExchangeRate. Displayed strictly on hover or outside AU/NZ with max 3 decimal places." 
    },
    "isActive": { "type": "boolean" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 12: SuperAdmin Authentication & Google Identity Provider
*Authentication Mechanism*: Google OAuth 2.0 via Firebase Client SDK / Firebase Auth (`signInWithPopup(auth, provider)`).

| Identity Class | Authority Criterion | Role Claim | Capabilities |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | Firebase Admin service email (`firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com`), verified bootstrap admin emails (`admin@lawyerselect.com.au`, `superadmin@lawyerselect.com.au`, `support@aifoundation.net.au`), or verified token custom claims (`superadmin: true`). | `superadmin` | Catalog item CRUD, token price setting, platform settings override, manual approval of law firms & individual practitioners, dispute & refund processing. |
| **Standard User / Client** | Any standard Google account authenticated via popup. | `client` | Inquiries, AI matching, case posting, chat, and review. |
| **Guest / Anonymous** | Unauthenticated visitor. Clean UI with zero mock badges. Google login icon displayed in far right header. | `guest` | Read-only directory and legal corpus explorer access. |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SuperAdminIdentityContract",
  "type": "object",
  "additionalProperties": false,
  "required": ["uid", "email", "role", "isSuperAdmin"],
  "properties": {
    "uid": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "displayName": { "type": "string" },
    "role": { "type": "string", "enum": ["superadmin", "lawyer", "client", "guest"] },
    "photoURL": { "type": "string" },
    "isSuperAdmin": { "type": "boolean" }
  }
}
```

---

### Domain 13: Geolocation, Localization & Daily AUD/USD Currency Converter (`lawyerselect_geo_settings_v1`)
*Mechanism*: Browser `navigator.geolocation` + Reverse Geocoding (`api.bigdatacloud.net`), Weather API (`api.open-meteo.com`), and Free Daily Exchange Rate API (`open.er-api.com` / `api.frankfurter.app`).

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `suburb` | String | Browser Auto-detect / User Select | Regional Localization | Australian Suburb / Locality name. Default: `'Sydney CBD'`. | Client LocalStorage (`lawyerselect_geo_settings_v1`) |
| `state` | String Enum | Browser Auto-detect / User Select | Regional Localization | Enum: `['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'NZ', 'OTHER']`. Default: `'NSW'`. | Client LocalStorage |
| `country` | String | Browser Auto-detect | Regional Localization | Default: `'Australia'`. | Client LocalStorage |
| `latitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 latitude (`-90.0 .. 90.0`). Default: `-33.8688`. | Client LocalStorage |
| `longitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 longitude (`-180.0 .. 180.0`). Default: `151.2093`. | Client LocalStorage |
| `timezone` | String | `Intl.DateTimeFormat` / User Select | Time Localization | Valid IANA Timezone string (e.g. `'Australia/Sydney'`). | Client LocalStorage |
| `dateFormat` | String Enum | User Select | Display Preference | Enum: `['DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY', 'MM/DD/YYYY']`. Default: `'DD/MM/YYYY'`. | Client LocalStorage |
| `timeFormat` | String Enum | User Select | Display Preference | Enum: `['12h', '24h']`. Default: `'12h'`. | Client LocalStorage |
| `isAutoDetected` | Boolean | Browser Geolocation API | Operational State | `true` if coordinates resolved via GPS/browser; `false` if manual. | Client LocalStorage |
| `weatherTempC` | Integer | Open-Meteo API | Environmental Telemetry | Round integer degrees Celsius (`Math.round`). Free Open API. | Ephemeral / In-Memory |
| `weatherCondition` | String | Open-Meteo WMO Code Mapping | Environmental Telemetry | Human-readable condition (e.g. `'Clear Sky'`, `'Partly Cloudy'`). | Ephemeral / In-Memory |
| `audToUsdRate` | Number | Open ER / Frankfurter API | Financial Rate | Strictly formatted to **max 3 decimal places** (`Math.round(rate * 1000) / 1000`). | Client LocalStorage & Memory |
| `rateLastUpdated` | Timestamp | Free Exchange API Ingestion | Financial Audit | ISO 8601 UTC timestamp. | Client LocalStorage |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GeoLocationSettingsContract",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "suburb",
    "state",
    "country",
    "latitude",
    "longitude",
    "timezone",
    "dateFormat",
    "timeFormat",
    "isAutoDetected",
    "audToUsdRate"
  ],
  "properties": {
    "suburb": { "type": "string" },
    "state": { "type": "string", "enum": ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "NZ", "OTHER"] },
    "country": { "type": "string" },
    "postcode": { "type": "string" },
    "latitude": { "type": "number", "minimum": -90, "maximum": 90 },
    "longitude": { "type": "number", "minimum": -180, "maximum": 180 },
    "timezone": { "type": "string" },
    "dateFormat": { "type": "string", "enum": ["DD/MM/YYYY", "YYYY-MM-DD", "DD MMM YYYY", "MM/DD/YYYY"] },
    "timeFormat": { "type": "string", "enum": ["12h", "24h"] },
    "isAutoDetected": { "type": "boolean" },
    "weatherTempC": { "type": "integer" },
    "weatherCondition": { "type": "string" },
    "weatherCode": { "type": "integer" },
    "audToUsdRate": { "type": "number" },
    "rateLastUpdated": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 14: 17-Category Lawyer Application Dossier (`lawyer_applications`)
*Ingestion Channels*: `Register` Portal (Google Supporter Gate -> Single AI Paste Box -> 256-Bit AES-GCM Encryption -> Firestore `lawyer_applications/{id}`).
*AI Agent Skill*: `.agents/skills/legal-practitioner-dossier-parser/SKILL.md` (compatible with `Gemini 2.5 Flash-Lite`, `Claude Haiku 4.5`, `gpt-6-luna`).

| Category # | Category Name | Schema Field(s) | Invariants & Security |
| :--- | :--- | :--- | :--- |
| **1** | Location | `locationJurisdiction`, `locationCitySuburb`, `primaryOfficeAddress` | Valid AU Jurisdiction (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`, `Federal`). |
| **2** | Practice Areas | `practiceAreas` | Non-empty array of `PracticeArea` enums. |
| **3** | Bar Admissions & Licensing | `barAdmissionStatus`, `yearAdmitted`, `regulatoryBodyId` | `yearAdmitted` strict whole integer. |
| **4** | Firm or Employer Affiliation | `firmOrEmployerAffiliation`, `affiliationType` | Firm, Chambers, Solo, or In-House. |
| **5** | Experience Level & Seniority | `yearsOfPractice`, `seniorityTitle` | `yearsOfPractice` strict whole integer (`Math.ceil`). |
| **6** | Past Legal Work Experience | `pastLegalWorkExperience` | Array of previous firms, clerkships, and government roles. |
| **7** | Career Milestones & Roles | `careerMilestonesAndRoles` | Chronological career progression array. |
| **8** | Formal Education & Law Degrees | `formalEducationAndLawDegrees` | Undergraduate, `LL.B.`, `J.D.`, `LL.M.`, graduation years. |
| **9** | Academic & Continuing Legal Education | `academicAndCleQualifications` | Lectureships, teaching roles, CLE compliance. |
| **10** | Professional Accreditations | `professionalAccreditations` | Law Society Specialist Accreditations, NMAS Mediator, Notary. |
| **11** | Courts of Admission | `courtsOfAdmission` | State Supreme Court, Federal Court, High Court of Australia. |
| **12** | Judicial Appointments & Public Service | `judicialAndPublicService` | Judgeships, tribunal memberships, pro bono panels. |
| **13** | Publications, Case Studies & Notable Matters | `publicationsAndNotableMatters` | Reported judgments, published legal papers, landmark trials. |
| **14** | Fee Structure & Pricing | `feeStructure`, `hourlyRateAud`, `feeSummaryNotes` | `hourlyRateAud` strict whole integer in AUD. |
| **15** | Languages Spoken | `languagesSpoken` | Array of consultation languages. |
| **16** | Verified Contact Channels | `contactEmail`, `contactPhone`, `secureBookingOrPortalUrl` | **256-Bit AES-GCM Encrypted & Token-Gated** (released after token payment). |
| **17** | Client Reviews & Reputation Metrics | `reputationAndDisciplinaryStanding`, `peerRecognitionsAndRankings` | Verified standing and peer rankings. |


---

### Domain 8: SuperAdmin Direct Inquiries & Refund Requests (`superadmin_messages`)
*Ingestion Channel*: Direct Help & Support Channel (`/api/messages/superadmin`).  
*Financial Invariant*: **Messages to SuperAdmin are ALWAYS FREE (Cost: 0 Tokens / $0.00 AUD).**  
*Regulatory & Policy Rule*: Refund requests must be made in writing by sending a message directly to the SuperAdmin.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SuperAdminMessageSchema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "tag",
    "source",
    "senderId",
    "senderEmail",
    "senderName",
    "senderRole",
    "recipientRole",
    "messageType",
    "subject",
    "body",
    "costTokens",
    "costAud",
    "status",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^sam_[a-zA-Z0-9_-]+$" },
    "tag": { "type": "string", "enum": ["lawyerselect"] },
    "source": { "type": "string", "enum": ["lawyerselect"] },
    "senderId": { "type": "string" },
    "senderEmail": { "type": "string", "format": "email" },
    "senderName": { "type": "string", "minLength": 2, "maxLength": 100 },
    "senderRole": { "type": "string", "enum": ["client", "lawyer", "guest"] },
    "recipientRole": { "type": "string", "enum": ["superadmin"] },
    "messageType": { 
      "type": "string", 
      "enum": ["refund_request", "general_inquiry", "support", "dispute"] 
    },
    "subject": { "type": "string", "minLength": 3, "maxLength": 200 },
    "body": { "type": "string", "minLength": 10, "maxLength": 5000 },
    "costTokens": { 
      "type": "integer", 
      "enum": [0],
      "description": "Messages to superadmin are strictly free of charge." 
    },
    "costAud": { 
      "type": "integer", 
      "enum": [0],
      "description": "Strictly 0 AUD." 
    },
    "status": { 
      "type": "string", 
      "enum": ["pending", "under_review", "approved", "rejected", "closed"] 
    },
    "adminResponse": { "type": "string" },
    "adminRespondedAt": { "type": "string", "format": "date-time" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 12: SuperAdmin Authentication & Google Identity Provider
*Authentication Mechanism*: Google OAuth 2.0 via Firebase Client SDK / Firebase Auth (`signInWithPopup(auth, provider)`).

| Identity Class | Authority Criterion | Role Claim | Capabilities |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | Firebase Admin service email (`firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com`), verified bootstrap admin emails (`admin@lawyerselect.com.au`, `superadmin@lawyerselect.com.au`, `support@aifoundation.net.au`), or verified token custom claims (`superadmin: true`). | `superadmin` | Catalog item CRUD, token price setting, platform settings override, manual approval of law firms & individual practitioners, dispute & refund processing. |
| **Standard User / Client** | Any standard Google account authenticated via popup. | `client` | Inquiries, AI matching, case posting, chat, and review. |
| **Guest / Anonymous** | Unauthenticated visitor. Clean UI with zero mock badges. Google login icon displayed in far right header. | `guest` | Read-only directory and legal corpus explorer access. |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SuperAdminIdentityContract",
  "type": "object",
  "additionalProperties": false,
  "required": ["uid", "email", "role", "isSuperAdmin"],
  "properties": {
    "uid": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "displayName": { "type": "string" },
    "role": { "type": "string", "enum": ["superadmin", "lawyer", "client", "guest"] },
    "photoURL": { "type": "string" },
    "isSuperAdmin": { "type": "boolean" }
  }
}
```

---

### Domain 13: Geolocation, Localization & Daily AUD/USD Currency Converter (`lawyerselect_geo_settings_v1`)
*Mechanism*: Browser `navigator.geolocation` + Reverse Geocoding (`api.bigdatacloud.net`), Weather API (`api.open-meteo.com`), and Free Daily Exchange Rate API (`open.er-api.com` / `api.frankfurter.app`).

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `suburb` | String | Browser Auto-detect / User Select | Regional Localization | Australian Suburb / Locality name. Default: `'Sydney CBD'`. | Client LocalStorage (`lawyerselect_geo_settings_v1`) |
| `state` | String Enum | Browser Auto-detect / User Select | Regional Localization | Enum: `['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'NZ', 'OTHER']`. Default: `'NSW'`. | Client LocalStorage |
| `country` | String | Browser Auto-detect | Regional Localization | Default: `'Australia'`. | Client LocalStorage |
| `latitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 latitude (`-90.0 .. 90.0`). Default: `-33.8688`. | Client LocalStorage |
| `longitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 longitude (`-180.0 .. 180.0`). Default: `151.2093`. | Client LocalStorage |
| `timezone` | String | `Intl.DateTimeFormat` / User Select | Time Localization | Valid IANA Timezone string (e.g. `'Australia/Sydney'`). | Client LocalStorage |
| `dateFormat` | String Enum | User Select | Display Preference | Enum: `['DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY', 'MM/DD/YYYY']`. Default: `'DD/MM/YYYY'`. | Client LocalStorage |
| `timeFormat` | String Enum | User Select | Display Preference | Enum: `['12h', '24h']`. Default: `'12h'`. | Client LocalStorage |
| `isAutoDetected` | Boolean | Browser Geolocation API | Operational State | `true` if coordinates resolved via GPS/browser; `false` if manual. | Client LocalStorage |
| `weatherTempC` | Integer | Open-Meteo API | Environmental Telemetry | Round integer degrees Celsius (`Math.round`). Free Open API. | Ephemeral / In-Memory |
| `weatherCondition` | String | Open-Meteo WMO Code Mapping | Environmental Telemetry | Human-readable condition (e.g. `'Clear Sky'`, `'Partly Cloudy'`). | Ephemeral / In-Memory |
| `audToUsdRate` | Number | Open ER / Frankfurter API | Financial Rate | Strictly formatted to **max 3 decimal places** (`Math.round(rate * 1000) / 1000`). | Client LocalStorage & Memory |
| `rateLastUpdated` | Timestamp | Free Exchange API Ingestion | Financial Audit | ISO 8601 UTC timestamp. | Client LocalStorage |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GeoLocationSettingsContract",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "suburb",
    "state",
    "country",
    "latitude",
    "longitude",
    "timezone",
    "dateFormat",
    "timeFormat",
    "isAutoDetected",
    "audToUsdRate"
  ],
  "properties": {
    "suburb": { "type": "string" },
    "state": { "type": "string", "enum": ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "NZ", "OTHER"] },
    "country": { "type": "string" },
    "postcode": { "type": "string" },
    "latitude": { "type": "number", "minimum": -90, "maximum": 90 },
    "longitude": { "type": "number", "minimum": -180, "maximum": 180 },
    "timezone": { "type": "string" },
    "dateFormat": { "type": "string", "enum": ["DD/MM/YYYY", "YYYY-MM-DD", "DD MMM YYYY", "MM/DD/YYYY"] },
    "timeFormat": { "type": "string", "enum": ["12h", "24h"] },
    "isAutoDetected": { "type": "boolean" },
    "weatherTempC": { "type": "integer" },
    "weatherCondition": { "type": "string" },
    "weatherCode": { "type": "integer" },
    "audToUsdRate": { "type": "number" },
    "rateLastUpdated": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 14: 17-Category Lawyer Application Dossier (`lawyer_applications`)
*Ingestion Channels*: `Register` Portal (Google Supporter Gate -> Single AI Paste Box -> 256-Bit AES-GCM Encryption -> Firestore `lawyer_applications/{id}`).
*AI Agent Skill*: `.agents/skills/legal-practitioner-dossier-parser/SKILL.md` (compatible with `Gemini 2.5 Flash-Lite`, `Claude Haiku 4.5`, `gpt-6-luna`).

| Category # | Category Name | Schema Field(s) | Invariants & Security |
| :--- | :--- | :--- | :--- |
| **1** | Location | `locationJurisdiction`, `locationCitySuburb`, `primaryOfficeAddress` | Valid AU Jurisdiction (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`, `Federal`). |
| **2** | Practice Areas | `practiceAreas` | Non-empty array of `PracticeArea` enums. |
| **3** | Bar Admissions & Licensing | `barAdmissionStatus`, `yearAdmitted`, `regulatoryBodyId` | `yearAdmitted` strict whole integer. |
| **4** | Firm or Employer Affiliation | `firmOrEmployerAffiliation`, `affiliationType` | Firm, Chambers, Solo, or In-House. |
| **5** | Experience Level & Seniority | `yearsOfPractice`, `seniorityTitle` | `yearsOfPractice` strict whole integer (`Math.ceil`). |
| **6** | Past Legal Work Experience | `pastLegalWorkExperience` | Array of previous firms, clerkships, and government roles. |
| **7** | Career Milestones & Roles | `careerMilestonesAndRoles` | Chronological career progression array. |
| **8** | Formal Education & Law Degrees | `formalEducationAndLawDegrees` | Undergraduate, `LL.B.`, `J.D.`, `LL.M.`, graduation years. |
| **9** | Academic & Continuing Legal Education | `academicAndCleQualifications` | Lectureships, teaching roles, CLE compliance. |
| **10** | Professional Accreditations | `professionalAccreditations` | Law Society Specialist Accreditations, NMAS Mediator, Notary. |
| **11** | Courts of Admission | `courtsOfAdmission` | State Supreme Court, Federal Court, High Court of Australia. |
| **12** | Judicial Appointments & Public Service | `judicialAndPublicService` | Judgeships, tribunal memberships, pro bono panels. |
| **13** | Publications, Case Studies & Notable Matters | `publicationsAndNotableMatters` | Reported judgments, published legal papers, landmark trials. |
| **14** | Fee Structure & Pricing | `feeStructure`, `hourlyRateAud`, `feeSummaryNotes` | `hourlyRateAud` strict whole integer in AUD. |
| **15** | Languages Spoken | `languagesSpoken` | Array of consultation languages. |
| **16** | Verified Contact Channels | `contactEmail`, `contactPhone`, `secureBookingOrPortalUrl` | **256-Bit AES-GCM Encrypted & Token-Gated** (released after token payment). |
| **17** | Client Reviews & Reputation Metrics | `reputationAndDisciplinaryStanding`, `peerRecognitionsAndRankings` | Verified standing and peer rankings. |


---

### Domain 9: Terms of Service & Token Economy Disclaimers Contract
1. **Token Invariant & Mechanics Definition**:
   - "You exchange money for a token. Tokens provide more flexible payment options across the platform, as a single payment or matter may be distributed to multiple legal service providers, barristers, conveyancers, and specialist consultants."
   - Default exchange valuation: **1 Token = AUD $1.00**.
2. **Whole Number & Rounding Policy**:
   - Zero decimal policy: All token amounts and platform transactions must be whole numbers.
   - Any fractional calculation is strictly rounded UP (`Math.ceil`) to the nearest integer.
3. **Multi-Currency & Geolocation Display**:
   - System defaults to **Australian Dollars (AUD)** for all users and transactions.
   - Geolocation automatically detects user's physical region.
   - Users within **Australia or New Zealand** see native AUD pricing and whole-number token values.
   - Users **outside Australia and New Zealand** see converted **USD** pricing alongside whole-number tokens.
   - AUD to USD conversion calculations display a maximum of **3 decimal places** (e.g. `US$ 0.655`).
4. **Mandatory Invoicing Disclaimer**:
   - "All tax invoices, billing summaries, and receipts are denominated strictly in Australian Dollars (AUD)."
5. **Refund Request Protocol**:
   - In accordance with Lawyer Select Terms of Service, all refund requests must be submitted in writing by sending a message directly to the SuperAdmin via the platform support desk.
   - Messages to the SuperAdmin are **always free** and incur zero tokens.

---

## 5. Dual Registration Architecture & AI Approved Information Sheet Contracts

### Domain 10: Law Firm & Legal Entity Registration (`law_firms`)
*Ingestion Channels*: AI One-Blob Intake Engine (`/api/ai` -> `extractFirmInformationSheet`), Law Firm Registration Form UI.  
*Partition Key*: `tag: 'lawyerselect'`, `source: 'lawyerselect'`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LawFirmRegistrationSchema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "tag",
    "source",
    "registrationType",
    "legalEntity",
    "complianceAndInsurance",
    "operationalCapabilities",
    "approvedSheetMeta",
    "status",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^firm_[a-zA-Z0-9_-]+$" },
    "tag": { "type": "string", "enum": ["lawyerselect"] },
    "source": { "type": "string", "enum": ["lawyerselect"] },
    "registrationType": { "type": "string", "enum": ["law_firm"] },
    "legalEntity": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "legalBusinessName",
        "tradingNames",
        "entityIdentifierType",
        "entityIdentifierNumber",
        "practiceType",
        "firmRegulatoryNumber",
        "principalAddress",
        "mailingAddress",
        "branchOfficeLocations",
        "dxBoxDetails",
        "firmEmail",
        "firmTelephone",
        "secureClientIntakeEndpoint",
        "officialWebsiteUrl"
      ],
      "properties": {
        "legalBusinessName": { "type": "string", "minLength": 2, "maxLength": 200 },
        "tradingNames": { "type": "array", "items": { "type": "string" } },
        "entityIdentifierType": {
          "type": "string",
          "enum": ["ABN/ACN (Australia)", "EIN (US)", "Companies House CRN (UK)", "NZBN (New Zealand)", "Other"]
        },
        "entityIdentifierNumber": { "type": "string", "minLength": 3, "maxLength": 60 },
        "practiceType": {
          "type": "string",
          "enum": [
            "Sole Practitioner",
            "Partnership",
            "Incorporated Legal Practice (ILP)",
            "Multi-Disciplinary Partnership (MDP)",
            "Barristers Chambers"
          ]
        },
        "firmRegulatoryNumber": { "type": "string", "minLength": 2, "maxLength": 80 },
        "principalAddress": { "type": "string", "minLength": 5, "maxLength": 300 },
        "mailingAddress": { "type": "string", "maxLength": 300 },
        "branchOfficeLocations": { "type": "array", "items": { "type": "string" } },
        "dxBoxDetails": { "type": "string", "maxLength": 100 },
        "firmEmail": { "type": "string", "format": "email" },
        "firmTelephone": { "type": "string", "minLength": 5, "maxLength": 40 },
        "secureClientIntakeEndpoint": { "type": "string", "maxLength": 250 },
        "officialWebsiteUrl": { "type": "string", "maxLength": 250 }
      }
    },
    "complianceAndInsurance": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "insurerOrSchemeName",
        "policyNumber",
        "currencyOfCoverCertificate",
        "policyExpirationDate",
        "isGoodStandingConfirmed",
        "regulatoryRegisterStatus",
        "disciplinaryDisclosureNotes"
      ],
      "properties": {
        "insurerOrSchemeName": { "type": "string", "minLength": 2, "maxLength": 150 },
        "policyNumber": { "type": "string", "minLength": 2, "maxLength": 80 },
        "currencyOfCoverCertificate": { "type": "string", "minLength": 2, "maxLength": 120 },
        "policyExpirationDate": { "type": "string" },
        "isGoodStandingConfirmed": { "type": "boolean" },
        "regulatoryRegisterStatus": {
          "type": "string",
          "enum": ["Clean & Active Standing", "Subject to Undertaking / Condition", "Pending Registry Check"]
        },
        "disciplinaryDisclosureNotes": { "type": "string", "maxLength": 1000 }
      }
    },
    "operationalCapabilities": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "primaryPracticeAreas",
        "secondaryPracticeAreas",
        "accreditationsAndSpecialisations",
        "jurisdictionsAdmitted",
        "courtAndRegistryIdentifiers",
        "languagesSpoken"
      ],
      "properties": {
        "primaryPracticeAreas": { "type": "array", "items": { "type": "string" } },
        "secondaryPracticeAreas": { "type": "array", "items": { "type": "string" } },
        "accreditationsAndSpecialisations": { "type": "array", "items": { "type": "string" } },
        "jurisdictionsAdmitted": { "type": "array", "items": { "type": "string" } },
        "courtAndRegistryIdentifiers": { "type": "array", "items": { "type": "string" } },
        "languagesSpoken": { "type": "array", "items": { "type": "string" } }
      }
    },
    "approvedSheetMeta": {
      "type": "object",
      "additionalProperties": false,
      "required": ["sheetId", "aiConfidenceScore", "executiveSummary", "generatedAt"],
      "properties": {
        "sheetId": { "type": "string" },
        "aiConfidenceScore": { "type": "integer", "minimum": 1, "maximum": 100 },
        "executiveSummary": { "type": "string" },
        "generatedAt": { "type": "string", "format": "date-time" }
      }
    },
    "status": { "type": "string", "enum": ["approved", "pending_review", "suspended"] },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 12: SuperAdmin Authentication & Google Identity Provider
*Authentication Mechanism*: Google OAuth 2.0 via Firebase Client SDK / Firebase Auth (`signInWithPopup(auth, provider)`).

| Identity Class | Authority Criterion | Role Claim | Capabilities |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | Firebase Admin service email (`firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com`), verified bootstrap admin emails (`admin@lawyerselect.com.au`, `superadmin@lawyerselect.com.au`, `support@aifoundation.net.au`), or verified token custom claims (`superadmin: true`). | `superadmin` | Catalog item CRUD, token price setting, platform settings override, manual approval of law firms & individual practitioners, dispute & refund processing. |
| **Standard User / Client** | Any standard Google account authenticated via popup. | `client` | Inquiries, AI matching, case posting, chat, and review. |
| **Guest / Anonymous** | Unauthenticated visitor. Clean UI with zero mock badges. Google login icon displayed in far right header. | `guest` | Read-only directory and legal corpus explorer access. |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SuperAdminIdentityContract",
  "type": "object",
  "additionalProperties": false,
  "required": ["uid", "email", "role", "isSuperAdmin"],
  "properties": {
    "uid": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "displayName": { "type": "string" },
    "role": { "type": "string", "enum": ["superadmin", "lawyer", "client", "guest"] },
    "photoURL": { "type": "string" },
    "isSuperAdmin": { "type": "boolean" }
  }
}
```

---

### Domain 13: Geolocation, Localization & Daily AUD/USD Currency Converter (`lawyerselect_geo_settings_v1`)
*Mechanism*: Browser `navigator.geolocation` + Reverse Geocoding (`api.bigdatacloud.net`), Weather API (`api.open-meteo.com`), and Free Daily Exchange Rate API (`open.er-api.com` / `api.frankfurter.app`).

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `suburb` | String | Browser Auto-detect / User Select | Regional Localization | Australian Suburb / Locality name. Default: `'Sydney CBD'`. | Client LocalStorage (`lawyerselect_geo_settings_v1`) |
| `state` | String Enum | Browser Auto-detect / User Select | Regional Localization | Enum: `['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'NZ', 'OTHER']`. Default: `'NSW'`. | Client LocalStorage |
| `country` | String | Browser Auto-detect | Regional Localization | Default: `'Australia'`. | Client LocalStorage |
| `latitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 latitude (`-90.0 .. 90.0`). Default: `-33.8688`. | Client LocalStorage |
| `longitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 longitude (`-180.0 .. 180.0`). Default: `151.2093`. | Client LocalStorage |
| `timezone` | String | `Intl.DateTimeFormat` / User Select | Time Localization | Valid IANA Timezone string (e.g. `'Australia/Sydney'`). | Client LocalStorage |
| `dateFormat` | String Enum | User Select | Display Preference | Enum: `['DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY', 'MM/DD/YYYY']`. Default: `'DD/MM/YYYY'`. | Client LocalStorage |
| `timeFormat` | String Enum | User Select | Display Preference | Enum: `['12h', '24h']`. Default: `'12h'`. | Client LocalStorage |
| `isAutoDetected` | Boolean | Browser Geolocation API | Operational State | `true` if coordinates resolved via GPS/browser; `false` if manual. | Client LocalStorage |
| `weatherTempC` | Integer | Open-Meteo API | Environmental Telemetry | Round integer degrees Celsius (`Math.round`). Free Open API. | Ephemeral / In-Memory |
| `weatherCondition` | String | Open-Meteo WMO Code Mapping | Environmental Telemetry | Human-readable condition (e.g. `'Clear Sky'`, `'Partly Cloudy'`). | Ephemeral / In-Memory |
| `audToUsdRate` | Number | Open ER / Frankfurter API | Financial Rate | Strictly formatted to **max 3 decimal places** (`Math.round(rate * 1000) / 1000`). | Client LocalStorage & Memory |
| `rateLastUpdated` | Timestamp | Free Exchange API Ingestion | Financial Audit | ISO 8601 UTC timestamp. | Client LocalStorage |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GeoLocationSettingsContract",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "suburb",
    "state",
    "country",
    "latitude",
    "longitude",
    "timezone",
    "dateFormat",
    "timeFormat",
    "isAutoDetected",
    "audToUsdRate"
  ],
  "properties": {
    "suburb": { "type": "string" },
    "state": { "type": "string", "enum": ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "NZ", "OTHER"] },
    "country": { "type": "string" },
    "postcode": { "type": "string" },
    "latitude": { "type": "number", "minimum": -90, "maximum": 90 },
    "longitude": { "type": "number", "minimum": -180, "maximum": 180 },
    "timezone": { "type": "string" },
    "dateFormat": { "type": "string", "enum": ["DD/MM/YYYY", "YYYY-MM-DD", "DD MMM YYYY", "MM/DD/YYYY"] },
    "timeFormat": { "type": "string", "enum": ["12h", "24h"] },
    "isAutoDetected": { "type": "boolean" },
    "weatherTempC": { "type": "integer" },
    "weatherCondition": { "type": "string" },
    "weatherCode": { "type": "integer" },
    "audToUsdRate": { "type": "number" },
    "rateLastUpdated": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 14: 17-Category Lawyer Application Dossier (`lawyer_applications`)
*Ingestion Channels*: `Register` Portal (Google Supporter Gate -> Single AI Paste Box -> 256-Bit AES-GCM Encryption -> Firestore `lawyer_applications/{id}`).
*AI Agent Skill*: `.agents/skills/legal-practitioner-dossier-parser/SKILL.md` (compatible with `Gemini 2.5 Flash-Lite`, `Claude Haiku 4.5`, `gpt-6-luna`).

| Category # | Category Name | Schema Field(s) | Invariants & Security |
| :--- | :--- | :--- | :--- |
| **1** | Location | `locationJurisdiction`, `locationCitySuburb`, `primaryOfficeAddress` | Valid AU Jurisdiction (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`, `Federal`). |
| **2** | Practice Areas | `practiceAreas` | Non-empty array of `PracticeArea` enums. |
| **3** | Bar Admissions & Licensing | `barAdmissionStatus`, `yearAdmitted`, `regulatoryBodyId` | `yearAdmitted` strict whole integer. |
| **4** | Firm or Employer Affiliation | `firmOrEmployerAffiliation`, `affiliationType` | Firm, Chambers, Solo, or In-House. |
| **5** | Experience Level & Seniority | `yearsOfPractice`, `seniorityTitle` | `yearsOfPractice` strict whole integer (`Math.ceil`). |
| **6** | Past Legal Work Experience | `pastLegalWorkExperience` | Array of previous firms, clerkships, and government roles. |
| **7** | Career Milestones & Roles | `careerMilestonesAndRoles` | Chronological career progression array. |
| **8** | Formal Education & Law Degrees | `formalEducationAndLawDegrees` | Undergraduate, `LL.B.`, `J.D.`, `LL.M.`, graduation years. |
| **9** | Academic & Continuing Legal Education | `academicAndCleQualifications` | Lectureships, teaching roles, CLE compliance. |
| **10** | Professional Accreditations | `professionalAccreditations` | Law Society Specialist Accreditations, NMAS Mediator, Notary. |
| **11** | Courts of Admission | `courtsOfAdmission` | State Supreme Court, Federal Court, High Court of Australia. |
| **12** | Judicial Appointments & Public Service | `judicialAndPublicService` | Judgeships, tribunal memberships, pro bono panels. |
| **13** | Publications, Case Studies & Notable Matters | `publicationsAndNotableMatters` | Reported judgments, published legal papers, landmark trials. |
| **14** | Fee Structure & Pricing | `feeStructure`, `hourlyRateAud`, `feeSummaryNotes` | `hourlyRateAud` strict whole integer in AUD. |
| **15** | Languages Spoken | `languagesSpoken` | Array of consultation languages. |
| **16** | Verified Contact Channels | `contactEmail`, `contactPhone`, `secureBookingOrPortalUrl` | **256-Bit AES-GCM Encrypted & Token-Gated** (released after token payment). |
| **17** | Client Reviews & Reputation Metrics | `reputationAndDisciplinaryStanding`, `peerRecognitionsAndRankings` | Verified standing and peer rankings. |


---

### Domain 11: Individual Practitioner Registration & KYC Profile (`practitioner_registrations`)
*Ingestion Channels*: AI One-Blob Intake Engine (`/api/ai` -> `extractPractitionerInformationSheet`), Individual Lawyer Registration Form UI.  
*Partition Key*: `tag: 'lawyerselect'`, `source: 'lawyerselect'`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PractitionerRegistrationSchema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "tag",
    "source",
    "registrationType",
    "practitionerProfile",
    "complianceAndInsurance",
    "operationalCapabilities",
    "approvedSheetMeta",
    "status",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^preg_[a-zA-Z0-9_-]+$" },
    "tag": { "type": "string", "enum": ["lawyerselect"] },
    "source": { "type": "string", "enum": ["lawyerselect"] },
    "registrationType": { "type": "string", "enum": ["individual_practitioner"] },
    "practitionerProfile": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "prefix",
        "fullLegalName",
        "preferredName",
        "postNominals",
        "title",
        "roleOrPosition",
        "affiliatedFirmName",
        "email",
        "phone",
        "locationCity",
        "locationPostcode",
        "yearsOfExperience",
        "feeStructure",
        "hourlyRateAud",
        "practisingCertificate",
        "identityVerificationKyc"
      ],
      "properties": {
        "prefix": { "type": "string" },
        "fullLegalName": { "type": "string", "minLength": 2, "maxLength": 120 },
        "preferredName": { "type": "string", "maxLength": 80 },
        "postNominals": { "type": "string", "maxLength": 100 },
        "title": { "type": "string" },
        "roleOrPosition": {
          "type": "string",
          "enum": [
            "Partner",
            "Principal",
            "Senior Associate",
            "Associate",
            "Special Counsel",
            "Consultant",
            "Barrister",
            "Sole Practitioner"
          ]
        },
        "affiliatedFirmName": { "type": "string", "maxLength": 200 },
        "affiliatedFirmId": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "locationCity": { "type": "string" },
        "locationPostcode": { "type": "string" },
        "yearsOfExperience": { "type": "integer", "minimum": 0, "maximum": 75 },
        "feeStructure": { "type": "string" },
        "hourlyRateAud": { "type": "integer", "minimum": 0 },
        "practisingCertificate": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "pcNumber",
            "licensingAuthority",
            "certificateCategory",
            "admissionDate",
            "admissionJurisdiction",
            "pcExpirationDate"
          ],
          "properties": {
            "pcNumber": { "type": "string", "minLength": 2, "maxLength": 80 },
            "licensingAuthority": { "type": "string", "minLength": 2, "maxLength": 150 },
            "certificateCategory": {
              "type": "string",
              "enum": [
                "Principal (Unrestricted)",
                "Employee Solicitor",
                "Corporate Practising Certificate",
                "Barrister Practising Certificate",
                "Unrestricted Practising Certificate",
                "Restricted (Supervised)",
                "Registered Migration Agent (MARA)",
                "Licensed Conveyancer"
              ]
            },
            "admissionDate": { "type": "string" },
            "admissionJurisdiction": { "type": "string" },
            "pcExpirationDate": { "type": "string" }
          }
        },
        "identityVerificationKyc": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "documentType",
            "issuingAuthority",
            "documentReference",
            "expirationDate",
            "forensicBriefDescription",
            "verificationStatus"
          ],
          "properties": {
            "documentType": {
              "type": "string",
              "enum": ["Australian Passport", "International Passport", "State Driver Licence", "Government Photo ID"]
            },
            "issuingAuthority": { "type": "string" },
            "documentReference": { "type": "string" },
            "expirationDate": { "type": "string" },
            "forensicBriefDescription": {
              "type": "string",
              "description": "Follows personal-id-inspection skill standard: [Document Class & Series] belonging to [Identified Full Name], issued by [Issuing Authority] ([Country]). [Validity status / Expiration date] with [Security feature confirmation]."
            },
            "verificationStatus": {
              "type": "string",
              "enum": ["Verified Authentic", "Pending Manual Review", "Flagged"]
            }
          }
        }
      }
    },
    "complianceAndInsurance": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "insurerOrSchemeName",
        "policyNumber",
        "currencyOfCoverCertificate",
        "policyExpirationDate",
        "isGoodStandingConfirmed",
        "regulatoryRegisterStatus",
        "disciplinaryDisclosureNotes"
      ],
      "properties": {
        "insurerOrSchemeName": { "type": "string" },
        "policyNumber": { "type": "string" },
        "currencyOfCoverCertificate": { "type": "string" },
        "policyExpirationDate": { "type": "string" },
        "isGoodStandingConfirmed": { "type": "boolean" },
        "regulatoryRegisterStatus": {
          "type": "string",
          "enum": ["Clean & Active Standing", "Subject to Undertaking / Condition", "Pending Registry Check"]
        },
        "disciplinaryDisclosureNotes": { "type": "string" }
      }
    },
    "operationalCapabilities": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "primaryPracticeAreas",
        "secondaryPracticeAreas",
        "accreditationsAndSpecialisations",
        "jurisdictionsAdmitted",
        "courtAndRegistryIdentifiers",
        "languagesSpoken"
      ],
      "properties": {
        "primaryPracticeAreas": { "type": "array", "items": { "type": "string" } },
        "secondaryPracticeAreas": { "type": "array", "items": { "type": "string" } },
        "accreditationsAndSpecialisations": { "type": "array", "items": { "type": "string" } },
        "jurisdictionsAdmitted": { "type": "array", "items": { "type": "string" } },
        "courtAndRegistryIdentifiers": { "type": "array", "items": { "type": "string" } },
        "languagesSpoken": { "type": "array", "items": { "type": "string" } }
      }
    },
    "approvedSheetMeta": {
      "type": "object",
      "additionalProperties": false,
      "required": ["sheetId", "aiConfidenceScore", "executiveSummary", "generatedAt"],
      "properties": {
        "sheetId": { "type": "string" },
        "aiConfidenceScore": { "type": "integer", "minimum": 1, "maximum": 100 },
        "executiveSummary": { "type": "string" },
        "generatedAt": { "type": "string", "format": "date-time" }
      }
    },
    "status": { "type": "string", "enum": ["approved", "pending_review", "suspended"] },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 12: SuperAdmin Authentication & Google Identity Provider
*Authentication Mechanism*: Google OAuth 2.0 via Firebase Client SDK / Firebase Auth (`signInWithPopup(auth, provider)`).

| Identity Class | Authority Criterion | Role Claim | Capabilities |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | Firebase Admin service email (`firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com`), verified bootstrap admin emails (`admin@lawyerselect.com.au`, `superadmin@lawyerselect.com.au`, `support@aifoundation.net.au`), or verified token custom claims (`superadmin: true`). | `superadmin` | Catalog item CRUD, token price setting, platform settings override, manual approval of law firms & individual practitioners, dispute & refund processing. |
| **Standard User / Client** | Any standard Google account authenticated via popup. | `client` | Inquiries, AI matching, case posting, chat, and review. |
| **Guest / Anonymous** | Unauthenticated visitor. Clean UI with zero mock badges. Google login icon displayed in far right header. | `guest` | Read-only directory and legal corpus explorer access. |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SuperAdminIdentityContract",
  "type": "object",
  "additionalProperties": false,
  "required": ["uid", "email", "role", "isSuperAdmin"],
  "properties": {
    "uid": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "displayName": { "type": "string" },
    "role": { "type": "string", "enum": ["superadmin", "lawyer", "client", "guest"] },
    "photoURL": { "type": "string" },
    "isSuperAdmin": { "type": "boolean" }
  }
}
```

---

### Domain 13: Geolocation, Localization & Daily AUD/USD Currency Converter (`lawyerselect_geo_settings_v1`)
*Mechanism*: Browser `navigator.geolocation` + Reverse Geocoding (`api.bigdatacloud.net`), Weather API (`api.open-meteo.com`), and Free Daily Exchange Rate API (`open.er-api.com` / `api.frankfurter.app`).

| Field Name | Type | Ingestion Channel | Classification | Invariants & Constraints | Storage & Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `suburb` | String | Browser Auto-detect / User Select | Regional Localization | Australian Suburb / Locality name. Default: `'Sydney CBD'`. | Client LocalStorage (`lawyerselect_geo_settings_v1`) |
| `state` | String Enum | Browser Auto-detect / User Select | Regional Localization | Enum: `['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'NZ', 'OTHER']`. Default: `'NSW'`. | Client LocalStorage |
| `country` | String | Browser Auto-detect | Regional Localization | Default: `'Australia'`. | Client LocalStorage |
| `latitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 latitude (`-90.0 .. 90.0`). Default: `-33.8688`. | Client LocalStorage |
| `longitude` | Number | Geolocation / Coordinates | Coordinate Float | Valid WGS84 longitude (`-180.0 .. 180.0`). Default: `151.2093`. | Client LocalStorage |
| `timezone` | String | `Intl.DateTimeFormat` / User Select | Time Localization | Valid IANA Timezone string (e.g. `'Australia/Sydney'`). | Client LocalStorage |
| `dateFormat` | String Enum | User Select | Display Preference | Enum: `['DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY', 'MM/DD/YYYY']`. Default: `'DD/MM/YYYY'`. | Client LocalStorage |
| `timeFormat` | String Enum | User Select | Display Preference | Enum: `['12h', '24h']`. Default: `'12h'`. | Client LocalStorage |
| `isAutoDetected` | Boolean | Browser Geolocation API | Operational State | `true` if coordinates resolved via GPS/browser; `false` if manual. | Client LocalStorage |
| `weatherTempC` | Integer | Open-Meteo API | Environmental Telemetry | Round integer degrees Celsius (`Math.round`). Free Open API. | Ephemeral / In-Memory |
| `weatherCondition` | String | Open-Meteo WMO Code Mapping | Environmental Telemetry | Human-readable condition (e.g. `'Clear Sky'`, `'Partly Cloudy'`). | Ephemeral / In-Memory |
| `audToUsdRate` | Number | Open ER / Frankfurter API | Financial Rate | Strictly formatted to **max 3 decimal places** (`Math.round(rate * 1000) / 1000`). | Client LocalStorage & Memory |
| `rateLastUpdated` | Timestamp | Free Exchange API Ingestion | Financial Audit | ISO 8601 UTC timestamp. | Client LocalStorage |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GeoLocationSettingsContract",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "suburb",
    "state",
    "country",
    "latitude",
    "longitude",
    "timezone",
    "dateFormat",
    "timeFormat",
    "isAutoDetected",
    "audToUsdRate"
  ],
  "properties": {
    "suburb": { "type": "string" },
    "state": { "type": "string", "enum": ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "NZ", "OTHER"] },
    "country": { "type": "string" },
    "postcode": { "type": "string" },
    "latitude": { "type": "number", "minimum": -90, "maximum": 90 },
    "longitude": { "type": "number", "minimum": -180, "maximum": 180 },
    "timezone": { "type": "string" },
    "dateFormat": { "type": "string", "enum": ["DD/MM/YYYY", "YYYY-MM-DD", "DD MMM YYYY", "MM/DD/YYYY"] },
    "timeFormat": { "type": "string", "enum": ["12h", "24h"] },
    "isAutoDetected": { "type": "boolean" },
    "weatherTempC": { "type": "integer" },
    "weatherCondition": { "type": "string" },
    "weatherCode": { "type": "integer" },
    "audToUsdRate": { "type": "number" },
    "rateLastUpdated": { "type": "string", "format": "date-time" }
  }
}
```

---

### Domain 14: 17-Category Lawyer Application Dossier (`lawyer_applications`)
*Ingestion Channels*: `Register` Portal (Google Supporter Gate -> Single AI Paste Box -> 256-Bit AES-GCM Encryption -> Firestore `lawyer_applications/{id}`).
*AI Agent Skill*: `.agents/skills/legal-practitioner-dossier-parser/SKILL.md` (compatible with `Gemini 2.5 Flash-Lite`, `Claude Haiku 4.5`, `gpt-6-luna`).

| Category # | Category Name | Schema Field(s) | Invariants & Security |
| :--- | :--- | :--- | :--- |
| **1** | Location | `locationJurisdiction`, `locationCitySuburb`, `primaryOfficeAddress` | Valid AU Jurisdiction (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`, `Federal`). |
| **2** | Practice Areas | `practiceAreas` | Non-empty array of `PracticeArea` enums. |
| **3** | Bar Admissions & Licensing | `barAdmissionStatus`, `yearAdmitted`, `regulatoryBodyId` | `yearAdmitted` strict whole integer. |
| **4** | Firm or Employer Affiliation | `firmOrEmployerAffiliation`, `affiliationType` | Firm, Chambers, Solo, or In-House. |
| **5** | Experience Level & Seniority | `yearsOfPractice`, `seniorityTitle` | `yearsOfPractice` strict whole integer (`Math.ceil`). |
| **6** | Past Legal Work Experience | `pastLegalWorkExperience` | Array of previous firms, clerkships, and government roles. |
| **7** | Career Milestones & Roles | `careerMilestonesAndRoles` | Chronological career progression array. |
| **8** | Formal Education & Law Degrees | `formalEducationAndLawDegrees` | Undergraduate, `LL.B.`, `J.D.`, `LL.M.`, graduation years. |
| **9** | Academic & Continuing Legal Education | `academicAndCleQualifications` | Lectureships, teaching roles, CLE compliance. |
| **10** | Professional Accreditations | `professionalAccreditations` | Law Society Specialist Accreditations, NMAS Mediator, Notary. |
| **11** | Courts of Admission | `courtsOfAdmission` | State Supreme Court, Federal Court, High Court of Australia. |
| **12** | Judicial Appointments & Public Service | `judicialAndPublicService` | Judgeships, tribunal memberships, pro bono panels. |
| **13** | Publications, Case Studies & Notable Matters | `publicationsAndNotableMatters` | Reported judgments, published legal papers, landmark trials. |
| **14** | Fee Structure & Pricing | `feeStructure`, `hourlyRateAud`, `feeSummaryNotes` | `hourlyRateAud` strict whole integer in AUD. |
| **15** | Languages Spoken | `languagesSpoken` | Array of consultation languages. |
| **16** | Verified Contact Channels | `contactEmail`, `contactPhone`, `secureBookingOrPortalUrl` | **256-Bit AES-GCM Encrypted & Token-Gated** (released after token payment). |
| **17** | Client Reviews & Reputation Metrics | `reputationAndDisciplinaryStanding`, `peerRecognitionsAndRankings` | Verified standing and peer rankings. |



