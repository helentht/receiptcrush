# Product Requirements Document: ReceiptCrush Web App

**Document Version:** 1.0  
**Last Updated:** March 11, 2026  
**Author:** Product Development Team  
**Status:** Draft for MVP Development

## Executive Summary

ReceiptCrush is a web-based application designed to streamline expense splitting among groups of friends during travel. The application leverages AI-powered optical character recognition (OCR) to automatically parse receipt images, presents an intuitive multiple-choice interface for expense assignment, and calculates final settlement amounts among participants.

The core innovation lies in its "upload and claim" interaction model: users upload receipt photos in bulk, the system extracts line items with visual context, and group members interactively assign expenses to themselves through a gamified selection interface.

## Product Vision

### Problem Statement

When traveling in groups, managing shared expenses becomes cumbersome due to:

- Accumulation of numerous physical receipts from various purchases
- Difficulty remembering who purchased what items days after the trip
- Manual data entry required by existing expense-splitting applications
- Friction in coordinating expense assignment across different messaging platforms (WhatsApp, iMessage, Telegram)
- Time-consuming settlement calculation processes

### Solution Overview

ReceiptCrush addresses these pain points through:

- Batch receipt image upload capability for processing multiple receipts simultaneously
- AI-powered receipt parsing that extracts item names, prices, and quantities
- Online image fetching to display product photos alongside item names for easy recognition
- Visual context preservation by displaying cropped receipt sections alongside parsed text
- Interactive multiple-choice interface for expense assignment
- Automatic payer inference (uploader is assumed to be the payer)
- Real-time collaborative expense assignment across all participants\* Seamless multi-currency conversion to handle receipts from foreign travel- Automated settlement calculation with debt simplification

## Target Users

### Primary Persona: The Travel Organizer

- **Age:** 25-35
- **Technical proficiency:** Moderate to high
- **Behavior:** Frequently organizes group trips with 2-8 friends
- **Pain point:** Spends hours after trips manually reconciling expenses
- **Usage pattern:** Processes receipts in batch after returning from trip

### Secondary Persona: The Group Participant

- **Age:** 25-35
- **Technical proficiency:** Basic to moderate
- **Behavior:** Participates in group activities but prefers minimal effort for administrative tasks
- **Pain point:** Forgets what they purchased and dislikes complex expense apps
- **Usage pattern:** Responds to prompts to claim their expenses when convenient

## User Stories

### Epic 1: Session Creation and Participant Management

- **US-101:** As an organizer, I want to create a new expense-splitting session with a unique shareable link, so that I can easily invite participants without requiring them to create accounts.
  - **Acceptance Criteria:**
    - System generates a unique 4-6 character alphanumeric room code
    - Shareable URL format: `[domain]/[room-code]`
    - Room remains active for 30 days or until manually closed
    - No authentication required for room creation
- **US-102:** As a participant, I want to join a session by clicking a link and entering my name, so that I can participate without friction.
  - **Acceptance Criteria:**
    - Clicking room link navigates to join screen
    - Single input field requesting display name (3-20 characters)
    - System automatically assigns (or lets the user pick) a unique avatar icon and distinctive color
    - Upon submission, user is added to participant list visible to all members
    - Name and icon persistence using browser local storage for convenience
- **US-103:** As an organizer, I want to see all participants who have joined the session in real-time, so that I can confirm everyone is ready before starting.
  - **Acceptance Criteria:**
    - Participant list displays all joined members with their display names
    - List updates in real-time as new participants join
    - Visual indicator shows number of participants (e.g., "4 people joined")

### Epic 2: Receipt Upload and Processing

- **US-201:** As a participant, I want to upload multiple receipt photos in a single action, so that I can quickly submit all my expenses at once.
  - **Acceptance Criteria:**
    - Upload button triggers native mobile photo picker
    - Multiple image selection supported (HTML5 `multiple` attribute)
    - Accepted formats: JPEG, PNG, HEIC
    - Client-side image compression to max 1920px width before upload
    - Progress indicator shows upload status for each image
- **US-202:** As the system, I want to automatically parse receipt images using AI vision models, so that users don't have to manually enter item details.
  - **Acceptance Criteria:**
    - Integration with API: Call a Qwen Vision model (e.g. `qwen/qwen-vl-plus`) via OpenRouter
    * Extraction of: item names (auto-translated to English/local language if foreign), original item names, individual prices, quantities, tax, total amount, and receipt currency
    - Response format: structured JSON with standardized schema
    - Fallback error handling for unparseable receipts
    - Processing time: under 10 seconds per receipt

* **US-203:** As a participant, I want the system to automatically associate my uploaded receipts with me as the payer, so that I don't have to manually specify who paid.
  - **Acceptance Criteria:**
    - Uploader's name is automatically set as the payer for all items in that receipt
    - Payer can be manually changed if needed via an inline dropdown selector (edge case: someone else paid)
    - Visual indicator shows "Paid by [Name]" on receipt card

* **US-204:** As a participant traveling internationally, I want the system to automatically convert foreign receipt currencies to my group's local currency at the time of upload, locking in the price so that settlements are predictably calculated in a single familiar currency.
  - **Acceptance Criteria:**
    - AI exclusively extracts the precise original price and currency from the receipt (e.g., JPY, EUR) _without_ performing mathematical conversions itself, and extracts the receipt date.
    - System uses a historical exchange rate API (e.g., Frankfurter) matching the receipt's date to fetch the conversion rate relative to the session's base currency.
    - The converted local amount is permanently saved into the `items` database table so debts do not fluctuate later due to exchange rate changes.
    - The `settlements` table acts strictly as a ledger for finalized transactions (e.g. "Mark as Paid"), while live calculations of optimal debts happen dynamically on the frontend.

* **US-205:** As a participant paying with a credit card, I want to add a custom transaction fee percentage, so that any credit card fees are fairly split among the group.
  - **Acceptance Criteria:**
    - Ability to input a credit card fee percentage directly on the receipt card UI.
    - System dynamically updates the total cost calculations in the settlements engine without mutating the base item price.
    - Settlement details explicitly indicate when a credit card fee has been applied to a split item.

### Epic 3: Expense Assignment Interface

- **US-301:** As a participant, I want to see receipt items displayed with visual context from the original image, so that I can easily recognize what I purchased.
  - **Acceptance Criteria:**
    - Each parsed item displays alongside a cropped section of the original receipt
    - If precise cropping is not feasible for MVP, display full receipt thumbnail on left, item list on right
    - Item text extracted by AI is shown clearly (item name, price)
    - Items are presented one at a time or in scrollable list format
- **US-302:** As a participant, I want to claim items I purchased through a multiple-choice selection interface, so that I can quickly assign expenses without typing.
  - **Acceptance Criteria:**
    - Each unassigned item presents a question: "Who purchased [item name]?"
    - Multiple-choice options display below the item as a grid of distinctive user icons with names
    - Single-tap/click selection assigns item to chosen participant
    - Interface supports multi-selection, allowing a user to tap multiple icons to evenly split the item among several people
    - Visual feedback confirms assignment (checkmark over icon, icon color highlighted)
- **US-303:** As a participant, I want to see real-time updates when other participants claim items, so that I can avoid duplicate assignments and see progress.
  - **Acceptance Criteria:**
    - Assigned items are immediately marked as claimed across all participants' screens
    - Claimed items show participant name/avatar
    - Progress indicator shows "X of Y items assigned"
    - Claimed items can be unassigned/reassigned if needed
- **US-304:** As a participant, I want to see an online reference image of the purchased item, so that I can easily recall what the item was even if the receipt name is obscure.
  - **Acceptance Criteria:**
    - System automatically searches for and retrieves a thumbnail image based on the parsed item name
    - Thumbnail is displayed alongside the line item in the assignment interface
    - Fallback to a generic category icon if no image is found

### Epic 4: Settlement Calculation

- **US-401:** As a participant, I want to see a summary of all my expenses across all receipts, so that I can verify what I've been assigned.
  - **Acceptance Criteria:**
    - Summary view lists all items assigned to the user
    - Total amount calculated automatically
    - Breakdown by receipt available
    - Edit capability to dispute/modify assignments
- **US-402:** As the system, I want to calculate optimal settlement amounts using debt simplification, so that participants make the minimum number of transactions.
  - **Acceptance Criteria:**
    - Algorithm calculates net balance for each participant (total paid - total owed)
    - Debt simplification minimizes number of transactions
    - Settlement plan presented clearly: "[Person A] pays [Person B] $X.XX"
    - Supports scenarios where some participants only paid, only owed, or both
- **US-403:** As a participant, I want to see a final settlement summary showing who owes whom and how much, so that I can easily complete payments.
  - **Acceptance Criteria:**
    - Clear visual hierarchy: creditors at top, debtors below, or transaction list
    - Amounts displayed with 2 decimal precision
    - Option to mark transactions as completed
    - Shareable summary (text format for copy-paste into messaging apps)

## Functional Requirements

**FR-1: Session Management**

| ID     | Description                                                                      |
| ------ | -------------------------------------------------------------------------------- |
| FR-1.1 | System shall generate unique room codes using alphanumeric characters (A-Z, 0-9) |
| FR-1.2 | Room codes shall be case-insensitive and 4-6 characters in length                |
| FR-1.3 | Sessions shall persist for 30 days from creation or until manually deleted       |
| FR-1.4 | System shall support up to 20 participants per session                           |
| FR-1.5 | Session state shall sync in real-time across all connected clients               |

_(Table 1: Session Management Requirements)_

**FR-2: Receipt Processing**

| ID     | Description                                                                        |
| ------ | ---------------------------------------------------------------------------------- |
| FR-2.1 | System shall accept JPEG, PNG, and HEIC image formats                              |
| FR-2.2 | Client shall compress images to maximum 1920px width before upload                 |
| FR-2.3 | System shall parse receipts using Qwen Vision API with JSON mode                   |
| FR-2.4 | Parsed data schema shall include: items\[\], itemName, price, quantity, tax, total |
| FR-2.5 | System shall handle parsing failures gracefully with manual entry fallback         |
| FR-2.6 | Processing status shall be visible to all participants in real-time                |

_(Table 2: Receipt Processing Requirements)_

**FR-3: Expense Assignment**

| ID     | Description                                                                |
| ------ | -------------------------------------------------------------------------- |
| FR-3.1 | Each item shall support assignment to one or more participants             |
| FR-3.2 | Assignment interface shall present participant names as selectable options |
| FR-3.3 | Items assigned to multiple participants shall split cost equally           |
| FR-3.4 | Assignment changes shall propagate to all clients within 500ms             |
| FR-3.5 | Participants shall be able to unassign and reassign items                  |
| FR-3.6 | System shall prevent assignment conflicts through optimistic locking       |

_(Table 3: Expense Assignment Requirements)_

**FR-4: Settlement Calculation**

| ID     | Description                                                |
| ------ | ---------------------------------------------------------- |
| FR-4.1 | System shall calculate net balance for each participant    |
| FR-4.2 | Settlement algorithm shall minimize number of transactions |
| FR-4.3 | Calculation shall account for partial item splits          |
| FR-4.4 | Currency amounts shall be rounded to 2 decimal places      |
| FR-4.5 | Settlement summary shall be exportable as text             |

_(Table 4: Settlement Calculation Requirements)_

## Non-Functional Requirements

### NFR-1: Performance

- Page load time: Under 2 seconds on 4G connection
- Receipt parsing: Under 10 seconds per image
- Real-time sync latency: Under 500ms for state updates
- Image upload: Support up to 20 images per batch
- Concurrent users: Support 50 active sessions simultaneously (MVP target)

### NFR-2: Usability

- Zero-login experience: No account creation required
- Mobile-first responsive design (iOS Safari, Android Chrome)
- Touch-friendly interface: Minimum 44x44px tap targets
- Accessibility: WCAG 2.1 Level AA compliance for color contrast
- Error messages: Clear, actionable, non-technical language

### NFR-3: Reliability

- Uptime: 99% availability during MVP testing phase
- Data persistence: Session data retained for 30 days minimum
- Graceful degradation: App functions without real-time sync if WebSocket fails
- Error recovery: Automatic retry for failed image uploads (3 attempts)

### NFR-4: Security

- HTTPS encryption for all data transmission
- Room codes generated using cryptographically secure random values
- No personally identifiable information (PII) collected beyond display names
- Image uploads scanned for malware/inappropriate content
- Rate limiting: Max 50 API requests per IP per minute

### NFR-5: Scalability

- Database: Support for 1,000 sessions with 100,000 total items (MVP target)
- File storage: Cloud storage for receipt images (S3, Cloudflare R2)
- API rate limits: Graceful handling of AI API quota limits
- Horizontal scaling: Stateless backend architecture for future scaling

## Technical Architecture

### Technology Stack

| Layer        | Technology                  | Justification                                                  |
| ------------ | --------------------------- | -------------------------------------------------------------- |
| Frontend     | Next.js 14 + React          | Server-side rendering, optimal performance, TypeScript support |
| Styling      | Tailwind CSS                | Rapid UI development, mobile-first utilities                   |
| Database     | Supabase (PostgreSQL)       | Real-time subscriptions, easy setup, generous free tier        |
| File Storage | Cloudflare R2 / Vercel Blob | Cost-effective image storage, fast CDN delivery                |
| AI Vision    | OpenRouter (Qwen Vision)    | High accuracy OCR, JSON mode support, multi-language           |
| Deployment   | Vercel                      | Seamless Next.js integration, edge functions, zero-config      |
| Real-time    | Supabase Realtime           | WebSocket-based sync, PostgreSQL integration                   |

_(Table 5: Recommended Technology Stack)_

### Database Schema

**Table: sessions**

- id (UUID, primary key)
- room_code (VARCHAR(6), unique, indexed)
- base_currency (VARCHAR(3), default: 'USD')
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- status (ENUM: active, completed, archived)

**Table: participants**

- id (UUID, primary key)
- session_id (UUID, foreign key to sessions)
- display_name (VARCHAR(50))
- avatar_icon (VARCHAR(50))
- avatar_color (VARCHAR(7))
- joined_at (TIMESTAMP)

**Table: receipts**

- id (UUID, primary key)
- session_id (UUID, foreign key to sessions)
- uploader_id (UUID, foreign key to participants)
- image_url (TEXT)
- currency (VARCHAR(3), default: 'USD')
- exchange_rate_to_base (DECIMAL(10,4), default: 1.0)
- cc_fee_percentage (DECIMAL(5,2), default: 0.00)
- parsed_data (JSONB)
- uploaded_at (TIMESTAMP)
- processing_status (ENUM: pending, processing, completed, failed)

**Table: items**

- id (UUID, primary key)
- receipt_id (UUID, foreign key to receipts)
- item_name (VARCHAR(255))
- original_item_name (VARCHAR(255), optional)
- item_image_url (TEXT, optional)
- price (DECIMAL(10,2))
- quantity (INTEGER)
- assigned_to (UUID[], array of participant IDs)
- created_at (TIMESTAMP)

**Table: settlements**

- id (UUID, primary key)
- session_id (UUID, foreign key to sessions)
- from_participant_id (UUID, foreign key to participants)
- to_participant_id (UUID, foreign key to participants)
- amount (DECIMAL(10,2))
- status (ENUM: pending, completed)

### API Endpoints

**Session Management**

- `POST /api/sessions` - Create new session, returns room_code
- `GET /api/sessions/[room_code]` - Retrieve session details
- `POST /api/sessions/[room_code]/join` - Add participant to session

**Receipt Processing**

- `POST /api/receipts/upload` - Upload receipt images, returns receipt IDs
- `POST /api/receipts/[id]/parse` - Trigger AI parsing (or automatic on upload)
- `GET /api/receipts/[id]` - Retrieve parsed receipt data

**Expense Assignment**

- `POST /api/items/[id]/assign` - Assign item to participant(s)
- `DELETE /api/items/[id]/assign` - Unassign item
- `GET /api/sessions/[room_code]/items` - List all items in session

**Settlement Calculation**

- `GET /api/sessions/[room_code]/settlements` - Calculate and return settlement plan
- `POST /api/settlements/[id]/mark-paid` - Mark transaction as completed

### AI Vision & External APIs Integration

**Qwen AI Vision Implementation:**

- **Model:** Qwen Vision (`qwen/qwen-vl-plus` or `qwen/qwen-2.5-vl` via OpenRouter)
- **Input:** Base64-encoded receipt image
- **Prompt template:** "Extract all items, prices, and quantities from this receipt. If the receipt is in a foreign language, translate the item names to English (or the user's local language) for the `itemName` field, but keep the original text in `originalItemName`. Return structured JSON with fields: items (array), itemName (string), originalItemName (string), price (number), quantity (number), tax (number), total (number), currency (string)."
- **Response format:** JSON
- **Error handling:** Retry logic for API failures, manual entry fallback
- **Cost optimization:** Image compression to reduce token usage
- **Implementation Options:**
  - Call Qwen Vision models directly via OpenRouter

**Online Image Search Integration:**

- **Purpose:** Fetch reference images for parsed item names to aid in recognition.
- **API Options:**
  - **Traditional APIs (Recommended for MVP):** Serper.dev. Provides 2,500 free searches on sign-up without a credit card, acting as a fast and cheap proxy for Google Images.
  - **AI-Enhanced Search (Future Consideration):** Use an LLM to refine the search query (e.g., converting cryptic receipt abbreviations like "APP PENC 2" to "Apple Pencil 2nd Gen") before hitting a traditional image API.
- **Behavior:** Asynchronous fetch triggered after receiving the parsed item list. The image search query must include BOTH the auto-translated English name (`item_name`) and the original language name (`original_item_name`) to ensure the most accurate regional image results (e.g. searching "Matcha Pocky 抹茶ポッキー").
- **Technical Constraint (CORS):** The frontend must fetch images either via the backend or a proxy to avoid Cross-Origin Resource Sharing (CORS) errors when rendering third-party image URLs on the canvas/UI.

**Alternative considerations:**

- OpenAI GPT-4o Vision API
- Google Cloud Vision API - lower cost but less flexible parsing
- Tesseract OCR + GPT-3.5 - budget option with two-step processing

## User Interface Design

### Key Screens

**Screen 1: Landing Page**

- Primary CTA: "Create New Split" button (prominent, centered)
- Secondary CTA: "Join Existing Split" with room code input
- Minimal explanatory text: "Split travel expenses with friends in 3 steps"
- Visual: Illustration or animation showing upload → assign → settle

**Screen 2: Session Lobby**

- Room code display (large, copyable)
- Shareable link with copy button
- Participant list (real-time updates, avatars with initials)
- Upload receipts CTA (always visible)
- Status: "X receipts uploaded, Y items assigned"

**Screen 3: Receipt Upload**

- Drag-and-drop zone (desktop) or tap to select (mobile)
- Preview thumbnails of selected images before upload
- Progress indicators for each uploading/processing image
- Success/error states with clear messaging

**Screen 4: Expense Assignment (Core Innovation)**

- Left panel: Receipt image (full or cropped section)
- Right panel: Parsed item details (name, original name, price) and fetched online reference image
- Question prompt: "Who purchased [item name]?"
- Participant selection: Grid of participant avatar icons with names displayed below each icon
- Multi-select functionality: Tap multiple icons to split the item among several people (equal split) without needing a separate toggle
- Progress: "5 of 23 items assigned" at top
- Skip button for uncertain items (assignable later)

**Screen 5: Settlement Summary**

- Header: "All expenses assigned!"
- Individual summaries: Each person's total paid vs. total owed
- Settlement transactions: "[Person A] → [Person B]: $XX.XX" list
- Export/Share button: Copy summary as text
- Mark as paid checkboxes (optional for tracking)

### Design Principles

- **Gamification:** Make expense assignment feel like a collaborative game, not a chore
- **Progressive disclosure:** Show complex features (splitting, editing) only when needed
- **Instant feedback:** Every action receives immediate visual confirmation
- **Mobile-first:** Optimize for thumb-reachable zones, large tap targets
- **Forgiving:** Easy undo/redo, no destructive actions without confirmation

## MVP Scope and Phasing

### MVP (Version 1.0) - 10 Days Development

**In Scope:**

- Core user flow: Create session → Join → Upload → Assign → Settle
- Multi-currency support and conversion (automatically converting foreign receipts to a local base currency)
- Basic receipt parsing (items, prices, quantities, currency) with auto-translation of foreign item names
- Online image search for parsed item thumbnails
- Equal split for shared items (no custom percentages)
- Manual assignment interface (full receipt thumbnail + item list)
- Debt simplification algorithm
- Mobile-responsive web interface
- 30-day session persistence

**Out of Scope (Future Iterations):**

- User accounts and authentication
- Receipt cropping/bounding box detection for individual items
- Custom split percentages (e.g., 60/40 split)
- Tax and tip allocation customization
- Payment integration (Venmo, PayPal, etc.)
- Receipt editing interface for AI errors
- Mobile native apps (iOS, Android)
- Export to CSV/PDF
- Analytics dashboard for organizers

### Post-MVP Enhancements (Future Versions)

**Version 1.1: Enhanced Parsing**

- Bounding box detection for item-level image cropping
- Receipt editing interface to correct AI mistakes
- Support for handwritten receipts

**Version 1.2: Advanced Features**

- Dynamic real-time exchange rate switching post-computation (i.e. changing the base currency after calculation)
- Custom split percentages and ratios
- Recurring expense templates (useful for regular group activities)
- Receipt category tagging (food, transport, accommodation)

**Version 2.0: Platform Expansion**

- User accounts with expense history
- Integration with messaging platforms (WhatsApp, Telegram bots)
- Payment integration for direct settlement
- Native mobile applications

## Success Metrics

### MVP Validation Metrics

**Primary KPIs:**

- Completion rate: % of sessions that reach settlement stage
- Time to settlement: Average time from session creation to final settlement
- Parsing accuracy: % of receipt items correctly extracted
- User satisfaction: Post-session survey rating (1-5 scale)

**Secondary KPIs:**

- Average items per session
- Average participants per session
- Error rate: % of receipts requiring manual intervention
- Mobile vs. desktop usage ratio
- Session abandonment rate

**Target Benchmarks (MVP):**

- Completion rate: 70%
- Time to settlement: 15 minutes for sessions with 10 receipts
- Parsing accuracy: 85% for printed receipts
- User satisfaction: 4.0/5.0 average rating
- Error rate: 20% requiring manual correction

## Risk Analysis

### Technical Risks

| Risk                                                | Impact | Mitigation                                                            |
| --------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| AI parsing inaccuracy on handwritten/faded receipts | High   | Provide manual entry fallback; focus MVP on printed receipts          |
| OpenRouter/Qwen API rate limits during high usage   | Medium | Implement queueing system; consider backup OCR provider               |
| Real-time sync failures on poor network             | Medium | Implement optimistic UI updates; retry logic with exponential backoff |
| Database scalability beyond MVP                     | Low    | Use cloud-native DB (Supabase) with auto-scaling                      |

_(Table 6: Technical Risk Assessment)_

### Product Risks

| Risk                                         | Impact | Mitigation                                                                                 |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Users prefer existing apps (Splitwise, Tab)  | High   | Differentiate with unique MC interface and visual context; target specific travel use case |
| Low adoption due to no native app            | Medium | Optimize PWA experience; consider "Add to Home Screen" prompts                             |
| Privacy concerns about receipt uploads       | Medium | Clear privacy policy; auto-delete sessions after 30 days; no account required              |
| Complex edge cases in settlement calculation | Medium | Thorough testing with real-world scenarios; allow manual overrides                         |

_(Table 7: Product Risk Assessment)_

## Development Timeline

**Phase 1: Foundation (Days 1-2) - Completed**

- Project setup: Next.js, Tailwind, Supabase initialization
- Database schema creation and migration scripts
- Session creation and join flow (frontend + backend)
- Basic responsive layout and navigation

**Phase 2: Core Processing & Integrations (Days 3-5) - Completed**

- Image upload interface with compression
- API integration for receipt parsing and currency conversion
- Integration of online image search API for product thumbnails
- Real-time state synchronization setup (Supabase Realtime)

**Phase 3: Interactive UI & Assignment (Days 6-8) - Completed**

- Expense assignment UI (multiple-choice interface)
- Item assignment logic and optimistic UI updates
- Database operations for assignment events
- Feature polish: Payer reassignment dropdown, receipt image preview popups, and credit card fee injection
- Edge case logic (handling conflicts, unassigning, reassigning payer)

**Phase 4: Settlement (Day 9) - Completed**

- Settlement calculation and debt simplification algorithm, taking dynamically applied CC fees into account
- Database write operations to finalize payments (inserting into `settlements` table)
- Interactive settlement UI (layered modal popups for individual settlement rows, "Mark as Paid" functionality)
- Real time visual updates on remaining user balances
- Settlement history log integration

**Phase 5: Polish & Launch (Day 10) - In Progress**

- UX polish: receipt image popups, expanded settlement details
- Error handling and loading states
- Mobile responsiveness refinement
- User testing with real receipts
- Bug fixes and performance optimization
- Deployment to production

## Assumptions and Dependencies

### Assumptions

- Users have smartphone cameras or access to receipt images
- Receipts are primarily printed (not handwritten) for MVP
- Internet connectivity available during session (offline mode not supported in MVP)
- Users trust temporary sessions without account security
- Group size typically 2-8 participants

### Dependencies

- AI Vision API access and sufficient quota/credits
- Image Search API access and sufficient quota/limits (e.g., Serper.dev)
- Supabase free tier limits (500MB database, 1GB file storage for MVP)
- Vercel deployment platform availability
- Third-party service uptime (AI, Image Search API, Supabase, Cloudflare)

## V2 Roadmap: User Authentication & Room Management

_Status: In Planning_

As the application moves past its MVP phase ("zero-login" approach), the following features will be introduced to enhance security, persistence, and user control.

### 1. User Authentication

- Support for persistent user accounts.
- Integration with Supabase Auth for **Google Login** and **Email Login**.
- Participants link their sessions/data to a unified user profile.

### 2. User Dashboard

- A dedicated `/dashboard` UI for authenticated users.
- Displays a consolidated view of:
  - **Rooms Hosted:** Sessions the user has created.
  - **Rooms Joined:** Sessions the user has participated in.
- Easy access to "Create New Room" directly from the dashboard.

### 3. Room Host Approval Workflow

- When a new user navigates to a room link, they must log in.
- Instead of auto-joining, the user is placed into a `pending` state.
- **Creator Controls:** The room creator has administrative rights.
- Creators receive a new UI to **Approve** or **Reject** pending users.
- Only approved users can view receipts, expenses, or the final settlement.

## Open Questions

- Should the system support tax and tip allocation separately, or include them in item prices?
- Should there be a "dispute" mechanism if someone disagrees with expense assignment?
- What happens if two people simultaneously assign the same item to different people?
- Should the app send reminders to participants who haven't assigned their items?
- Is there value in showing receipt metadata (merchant name, date, location)?
- Should the settlement algorithm prefer fewer transactions or balanced amounts?

## Appendix A: User Flow Diagrams

**Primary User Flow:**

Landing Page &rarr; Create Session &rarr; Share Link &rarr; Friends Join  
&rarr; Upload Receipts &rarr; AI Processing &rarr; Assign Items  
&rarr; Settlement Summary &rarr; Complete Payments

## Appendix B: Competitive Analysis

| Feature          | Splitwise | Tab | ReceiptCrush |
| ---------------- | --------- | --- | ------------ |
| Receipt scanning | Pro only  | Yes | Yes (core)   |
| Visual context   | No        | No  | Yes          |
| Account required | Yes       | No  | No           |
| Real-time collab | Limited   | Yes | Yes          |
| Item-level split | Pro only  | Yes | Yes          |
| Setup friction   | Medium    | Low | Low          |

_(Table 8: Competitive Feature Comparison)_

## Appendix C: Glossary

- **Session:** A temporary workspace for a single expense-splitting event
- **Room Code:** Unique alphanumeric identifier for session access
- **Payer:** Participant who initially paid for items (typically the uploader)
- **Assignment:** Process of attributing expense items to specific participants
- **Settlement:** Final calculation of who owes whom
- **Debt Simplification:** Algorithm to minimize number of payment transactions
- **MC Interface:** Multiple-choice interface for expense assignment
