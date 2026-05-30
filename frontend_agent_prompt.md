# Frontend AI Agent Prompt — MediPass UI Implementation

You are an expert Next.js Frontend Developer. You are building the user interface for "MediPass" – a portable, verifiable, international medical record and prescription platform built on the Monad Blockchain. 

The backend bridge API is already implemented and running locally on `http://localhost:3001`. 

### 🛠️ Technology Stack
- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Vanilla CSS / TailwindCSS (Premium dark mode, high-quality medical UI)
- **Web3 Interaction**: ConnectKit or RainbowKit + wagmi/viem for wallet connection (so we know the patient's or doctor's wallet address). All contract writes are handled via standard HTTP POST calls to the backend API.

---

### 🔌 Backend API Endpoints (`http://localhost:3001`)

Your frontend will interact with these HTTP endpoints. The backend handles the blockchain writes using its own private key:

#### 1. System Health
- `GET /api/health`

#### 2. IPFS Storage & Encryption (Plain text to Encrypted IPFS)
- **Upload Prescription**: `POST /api/ipfs/upload-prescription`
  - Payload: `{ patientName, patientAddress, dob, medicationName, dosage, frequency, duration, refills, notes, prescribedBy }`
  - Returns: `{ status: 201, cid, ipfsUrl }` (Sensitive fields like name/dob are encrypted).
- **Upload Clinical Record**: `POST /api/ipfs/upload-record`
  - Payload: `{ data: { patientName, patientAddress, dob, diagnosis, treatment, allergies, notes, addedBy, recordType } }`
  - Returns: `{ status: 201, cid, ipfsUrl }`
- **Fetch & Decrypt**: `GET /api/ipfs/fetch/:cid`
  - Returns: `{ status: 200, cid, data: { ... } }` (decrypted plain JSON metadata).

#### 3. Role-Based Access Control (RBAC)
- **Check Roles**: `GET /api/roles/check/:address`
  - Returns: `{ status: 200, address, roles: { isAdmin, isDoctor, isPharmacist, isPatient } }`
- **Grant Roles** (Admin only):
  - `POST /api/roles/grant/doctor` (Payload: `{ account: "0x..." }`)
  - `POST /api/roles/grant/pharmacist` (Payload: `{ account: "0x..." }`)
  - `POST /api/roles/grant/patient` (Payload: `{ account: "0x..." }`)

#### 4. Clinical History API
- **Update Overall Profile**: `POST /api/history/update`
  - Payload: `{ ipfsCID: "..." }` (Sets the main clinical profile CID on-chain)
- **Get Overall Profile CID**: `GET /api/history/:address`
  - Returns: `{ status: 200, patientAddress, clinicalHistoryCID }`
- **Add Record to Timeline**: `POST /api/history/records/add`
  - Payload: `{ patient: "0x...", ipfsCID: "...", recordType: "Consultation" }` (Consultation, Lab Result, Vaccine, etc.)
- **Get Verifiable Timeline**: `GET /api/history/records/:address`
  - Returns: `{ status: 200, patientAddress, count, records: [{ addedBy, ipfsCID, timestamp, recordType }] }`

#### 5. Prescriptions API
- **Issue Prescription**: `POST /api/prescriptions/issue`
  - Payload: `{ patient, ipfsCID, medicationName, dosageMg, refillsAllowed, expiresAt }` (Note: expiresAt is a future Unix timestamp).
  - Returns: `{ status: 201, tokenId, txHash }`
- **Get Prescription Details**: `GET /api/prescriptions/:id`
  - Returns: `{ status: 200, prescription: { tokenId, patient, doctor, ipfsCID, medicationName, dosageMg, refillsAllowed, refillsUsed, isActive, isDispensed, issuedAt, expiresAt } }`
- **Get Patient's Prescriptions**: `GET /api/prescriptions/patient/:address`
  - Returns: `{ status: 200, patient, count, tokenIds: ["1", "2"] }`
- **Dispense Prescription** (Pharmacist only): `POST /api/prescriptions/:id/dispense`
  - Returns: `{ status: 200, message, txHash }`

---

### 🎨 Design & Aesthetic System
- **Theme**: Ultra-clean dark mode (slate/indigo background) with neon accents (emerald green for verified health/active status, cyan for doctors, amber for refills/actions).
- **Style**: Premium dashboard layout. Glassmorphism cards (`backdrop-blur`), smooth transitions, interactive state changes. Use modern fonts like 'Inter' or 'Outfit'. No placeholders.
- **Responsiveness**: Perfect grid/flexbox flow optimized for both mobile screens and tablet/desktop views.

---

### 🛠️ Core Dashboards to Build

#### 1. Home / Portal (Connect Wallet)
- A landing page to connect the Web3 wallet.
- Once connected, call `GET /api/roles/check/<address>` to dynamically redirect the user or show dashboards corresponding to their role(s) (Patient, Doctor, Pharmacist, Admin).

#### 2. Patient Dashboard (Personal Health Record)
- **Primary Overview**: Fetch `GET /api/history/:address` to get their clinical history CID. Fetch `GET /api/ipfs/fetch/:cid` to get and display their decrypted demographic info (Name, DoB, allergies, blood type).
- **Verifiable Timeline**: Fetch `GET /api/history/records/:address`. Loop through the records, query `/api/ipfs/fetch/:ipfsCID` to decrypt the contents of each clinical record, and display a beautiful vertical timeline (e.g. Consultations, Vaccines, Lab Results, X-Rays) showing who added it and when.
- **My Prescriptions**: Fetch their prescriptions via `GET /api/prescriptions/patient/:address`, then query each details using `GET /api/prescriptions/:id` to list active and inactive prescriptions (e.g., refills remaining, expiry date).

#### 3. Doctor Dashboard (Clinical Intake & Issuance)
- **Patient Lookup**: Search patient records by pasting their Monad wallet address.
- **Add Clinical Record**:
  1. Input form for record type, diagnosis, treatment, notes, allergies.
  2. POSTs metadata to `/api/ipfs/upload-record` to get the CID.
  3. POSTs that CID to `/api/history/records/add` to record it on the patient's verifiable history timeline.
- **Issue Prescription**:
  1. Input form for medication name, dosage, refills, and expiry.
  2. POSTs details to `/api/ipfs/upload-prescription` to encrypt and get the CID.
  3. POSTs to `/api/prescriptions/issue` to mint the prescription Soulbound token.

#### 4. Pharmacist Dashboard (Verification & Dispensation)
- **Rx Verification**: Form to search/scan a prescription Token ID.
- Display the prescription details (Token ID, patient, doctor, and decrypted IPFS metadata).
- **Dispensation**: Click "Dispense Prescription" which sends a POST to `/api/prescriptions/:id/dispense` to execute the refill or dispensation on-chain.

#### 5. Admin Dashboard (Platform RBAC)
- Admin can type a wallet address and select "Doctor", "Pharmacist", or "Patient" to grant roles using the POST role grant endpoints.
