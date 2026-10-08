# Dryve PH Voice-to-Income Statement Prototype

A mobile-first prototype that converts daily manager voice recaps into structured accounting transactions and daily income statements.

The system is designed for the Dryve PH workflow, where managers provide short voice recaps containing vehicle sales, expenses, fees, corrections, and other business transactions.

The application uses Groq for:

- Speech-to-text transcription
- AI-assisted transaction extraction

Users can review and correct the transcript before financial transactions are extracted and finalized.

---

## Features

- Upload daily voice recordings
- Supports English, Tagalog, and Taglish
- AI speech-to-text transcription
- Editable transcript before transaction extraction
- AI-assisted transaction extraction
- Philippine Peso support using PHP / ₱
- Review and edit extracted transactions
- Missing or uncertain values are flagged for review
- Prevents unresolved transactions from being finalized
- Multiple voice recaps per business day
- Daily recap batching
- Combined daily income statement
- Income statement history by date
- Revenue calculation
- Cost of Sales calculation
- Gross Profit calculation
- Operating Expenses calculation
- Net Income calculation
- Browser-based local storage for prototype data

---

## System Workflow

```text
Upload Voice Recording
        ↓
Groq Speech-to-Text
        ↓
Review / Edit Transcript
        ↓
Groq Transaction Extraction
        ↓
Review / Edit Transactions
        ↓
Save to Daily Batch
        ↓
Add Additional Recaps
        ↓
Finalize Business Day
        ↓
Generate Combined Income Statement
        ↓
Income Statement History
```

---

## Accounting Structure

### Revenue

- Vehicle Sales
- Other Income

### Cost of Sales

- Vehicle Acquisition Cost
- Reconditioning

### Operating Expenses

- Salaries and Commissions
- Transport and Fuel
- Rent and Utilities
- Marketing
- Office and Admin
- Miscellaneous

The income statement follows:

```text
Revenue
- Cost of Sales
= Gross Profit

Gross Profit
- Operating Expenses
= Net Income
```

All monetary values are treated as:

```text
Philippine Pesos
PHP / ₱
```

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Lucide React

### Backend

- Node.js
- Express
- Multer
- dotenv
- CORS

### AI Services

- Groq API
- Whisper Large V3 Turbo for speech-to-text
- Groq-hosted language model for transaction extraction

### Storage

- `localStorage`
- `sessionStorage`

No production database is currently used.

---

## Project Structure

```text
dryve-voice-income/
│
├── src/
│   ├── components/
│   │   ├── AppHeader.jsx
│   │   └── BottomNav.jsx
│   │
│   ├── screens/
│   │   ├── RecapScreen.jsx
│   │   ├── ExtractionScreen.jsx
│   │   ├── ReviewScreen.jsx
│   │   ├── DailyBatchScreen.jsx
│   │   ├── IncomeStatementScreen.jsx
│   │   └── StatementHistoryScreen.jsx
│   │
│   ├── utils/
│   │   └── dryveStorage.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── server/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## Requirements

Before installing the project, make sure you have:

- Node.js 18 or newer
- npm
- Git
- A Groq API key
- Internet connection

Recommended browser:

- Google Chrome
- Microsoft Edge

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/dryve-voice-income.git
```

Open the project folder:

```bash
cd dryve-voice-income
```

### 2. Install frontend dependencies

From the project root:

```bash
npm install
```

### 3. Install backend dependencies

Open the backend folder:

```bash
cd server
```

Install backend packages:

```bash
npm install
```

### 4. Configure environment variables

Inside the `server` folder, create:

```text
.env
```

You can copy the included example file.

#### Windows

```bash
copy .env.example .env
```

#### macOS / Linux

```bash
cp .env.example .env
```

Then open `server/.env` and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```

Example:

```env
GROQ_API_KEY=gsk_your_actual_key_here
PORT=3001
```

Do not commit the `.env` file to GitHub.

---

## Running the Application

The frontend and backend run separately during local development.

You will need two terminals.

### Terminal 1 — Start the backend

From the `server` folder:

```bash
npm start
```

You should see something similar to:

```text
Groq key loaded: true
Dryve backend running at http://localhost:3001
Health check: http://localhost:3001/api/health
```

You can verify the backend by opening:

```text
http://localhost:3001/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Dryve transcription server is running.",
  "currency": "PHP"
}
```

### Terminal 2 — Start the frontend

Return to the root project directory:

```bash
cd ..
```

Run:

```bash
npm run dev
```

Vite should display a local address similar to:

```text
http://localhost:5173
```

Open it in your browser.

---

## How to Use the App

### Step 1 — Upload a Daily Voice Recap

From the Daily Recap screen:

1. Click **Choose Audio Recording**
2. Select a recording
3. Play the preview if needed
4. Click **Process Recording**

Supported formats may include:

- MP3
- WAV
- M4A
- MP4
- WebM
- OGG

The recording is sent to Groq for speech-to-text transcription.

### Step 2 — Review the Transcript

After transcription, the generated text is displayed.

Click **Edit** to correct transcription mistakes before financial extraction.

Example:

```text
Mineral ko
```

can be corrected to:

```text
Meralco
```

This review step is important because speech recognition may mishear names, vehicle details, plate numbers, amounts, Tagalog words, or Taglish phrases.

### Step 3 — Extract Transactions

Click **Extract Transactions**.

The system sends the reviewed transcript to Groq and maps detected financial transactions to the supported accounting categories.

Example:

```text
Vehicle Sales
2017 Toyota Innova
₱690,000
```

Example with missing data:

```text
Rent and Utilities
Meralco warehouse bill
Amount missing
Needs Review
```

The extraction workflow is designed not to invent missing amounts.

### Step 4 — Review Transactions

Review each extracted transaction.

You can edit:

- Account
- Description
- Amount

All monetary values are treated as Philippine Pesos (`PHP / ₱`).

Transactions containing missing or uncertain information must be resolved before they can be saved.

### Step 5 — Save to Daily Batch

Click **Save to Daily Batch**.

Multiple recordings can belong to the same business date.

Example:

```text
October 8, 2026

Recap 1
3 transactions

Recap 2
2 transactions

Recap 3
4 transactions
```

### Step 6 — Finalize the Business Day

When all recaps for the day have been processed and reviewed, click:

```text
Finalize Day & Generate Statement
```

The system combines all confirmed transactions for that business date.

It calculates:

```text
Revenue
- Cost of Sales
= Gross Profit

Gross Profit
- Operating Expenses
= Net Income
```

### Step 7 — Income Statement History

Finalized statements are stored by business date and can be opened from **Income Statement History**.

Each history record includes:

- Business date
- Number of recaps
- Number of transactions
- Revenue
- Cost of Sales
- Gross Profit
- Operating Expenses
- Net Income

If the same date is finalized again, the existing history record for that date is updated rather than duplicated.

---

## Handling Corrections

The AI is instructed to use the final corrected value when the speaker corrects themselves.

Example:

```text
Printer ink, 1,500...
wait, 1,050, mali yung basa ko.
```

Expected result:

```text
Office and Admin
Printer Ink
₱1,050
```

The earlier value of `₱1,500` should not be used.

---

## Handling Missing Information

If an amount is missing, the system does not guess.

Example:

```text
Paid the Meralco for the warehouse.
I forgot how much exactly.
I'll check tomorrow.
```

Expected result:

```text
Rent and Utilities
Meralco Warehouse Bill
Amount missing
Needs Review
```

The transaction cannot be finalized until the missing information is reviewed and completed.

---

## Local Data Storage

This prototype uses browser storage:

- `localStorage`
- `sessionStorage`

Prototype data may include:

- Daily recap batches
- Reviewed transactions
- Finalized income statement history

Clearing browser storage will remove this data.

---

## Security Notes

Do not expose your Groq API key in frontend code.

The API key should only exist in:

```text
server/.env
```

The `.env` file should be ignored by Git and must never be committed to GitHub.

For production deployment, configure `GROQ_API_KEY` as an environment variable in the hosting platform.

---

## Known Limitations

This project is a prototype and currently has the following limitations:

- Speech-to-text may mishear names, numbers, vehicle information, or Taglish terms
- Users must review AI-generated results before finalization
- Data is stored in browser storage rather than a production database
- No user authentication
- No role-based access control
- No accounting software integration
- No Google Sheets or Excel synchronization
- Internet access is required for Groq API calls
- Local development currently runs the frontend and backend separately

---

## Future Improvements

With additional development time, the following could be added:

- PostgreSQL or MySQL database
- User authentication
- Role-based permissions
- Persistent cloud storage
- Audit trail
- Google Sheets integration
- Excel export
- PDF income statement export
- Confidence scoring
- Improved Taglish terminology normalization
- Better vehicle and plate-number recognition
- Daily reconciliation workflow
- Date-range reporting
- Month-to-date reporting
- Cloud deployment
- Serverless API routes
- Automated accounting synchronization

---

## Deployment

For local development:

```text
Frontend
http://localhost:5173

Backend
http://localhost:3001
```

For production deployment, the backend should be deployed with the frontend or converted into serverless API routes.

The following environment variable must be configured on the hosting platform:

```text
GROQ_API_KEY
```

Never commit the actual API key to GitHub.

---

## Project Purpose

This project was developed as a prototype for the Dryve PH IT Support Specialist take-home assessment.

The goal is to demonstrate how daily voice recaps can be transformed into structured, reviewable accounting transactions and same-day income statements while keeping human verification in the workflow.

---

## Disclaimer

This application is a prototype and is not intended for production financial use without additional validation, security controls, persistent storage, audit controls, and accounting review.
