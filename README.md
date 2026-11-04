# LedgerVoice

**Speak your sales. Review your numbers.**

LedgerVoice is an AI-assisted daily sales reconciliation tool that turns an end-of-day voice recap into structured financial entries for human review and a daily income statement. It is designed to make daily closing clearer for Philippine small businesses while keeping financial decisions with the user.

## How it works

```text
Voice recap
  ↓
AI transcription
  ↓
Transaction extraction
  ↓
Human review
  ↓
Daily closing
  ↓
Income statement
```

1. Choose the business date and upload an audio recap.
2. LedgerVoice transcribes the recording with Groq Whisper.
3. Review and correct the transcript before extraction.
4. LedgerVoice extracts transactions into the supported account template.
5. Review, edit, and confirm every entry that needs attention.
6. Combine approved recaps into a daily closing and generate the income statement.

## Features

- Audio recap upload with file type and size validation
- AI transcription for English, Tagalog, and Taglish recaps
- Editable transcripts before financial extraction
- Structured AI-assisted transaction extraction
- Review-required flags for missing, uncertain, or invalid entries
- Human confirmation before a closing can be finalized
- Multiple recaps per business date
- Daily revenue, cost of sales, gross profit, operating expense, and net income calculations
- Local daily statement history
- Philippine Peso formatting and Philippine date locale

## Financial accuracy and AI safety

LedgerVoice assists with data entry; it does not autonomously approve financial records.

- The AI is instructed not to invent missing amounts, people, assets, dates, or transaction details.
- Missing or uncertain entries are marked for review.
- A daily closing cannot be finalized while unresolved entries remain.
- Final statement values are calculated by the application from confirmed transactions.

The included account template currently supports vehicle operations. It can be expanded into configurable account templates in a future version.

## Tech stack

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
- CORS

### AI

- Groq Whisper (`whisper-large-v3-turbo`) for speech-to-text
- Groq chat completions (`openai/gpt-oss-120b`) for transaction extraction

### Deployment

- Vercel-ready Express API configuration

## Architecture

```text
React client
  → Express API
    → Groq speech-to-text / transaction extraction
      → structured JSON
        → human review
          → local daily statement history
```

The frontend calls `POST /api/transcribe` and `POST /api/extract-transactions`. During local development, Vite proxies `/api` requests to the Express server on port `3001`. In a deployed environment, set `VITE_API_BASE_URL` to the deployed API base URL.

## Run locally

### Requirements

- Node.js 18 or newer
- npm
- A Groq API key

### 1. Install frontend and API dependencies

```bash
npm install
cd backend
npm install
```

### 2. Configure the API environment

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```

### 3. Start the API

```bash
cd backend
npm start
```

### 4. Start the frontend

In a second terminal, from the repository root:

```bash
npm run dev
```

Open the Vite address shown in the terminal, normally `http://localhost:5173`.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Express API | Authenticates Groq transcription and extraction requests. |
| `PORT` | Express API | Local API port; defaults to `3001`. |
| `VITE_API_BASE_URL` | React app | Optional deployed API base URL. Leave unset locally to use the Vite proxy. |

Never commit real credentials.

## Data storage

This version stores daily batches and statement history in browser `localStorage`; in-progress recap data uses `sessionStorage`. Existing Dryve-era storage values are migrated on first use to LedgerVoice keys, so current browser data is preserved.

## Repository

The intended GitHub repository is [AstroCodeMir/ledgervoice](https://github.com/AstroCodeMir/ledgervoice). The hosted repository must be renamed through GitHub before this URL becomes active.

## Future improvements

- Persistent database and encrypted cloud storage
- Authentication and multi-business access
- Configurable account templates
- PDF and CSV/Excel exports
- Audit trails and approval workflows
- Accounting platform integrations
- Daily email summaries and analytics
- Browser microphone recording

## Portfolio scope

LedgerVoice demonstrates a human-in-the-loop financial workflow using React, Express, Groq AI, structured JSON validation, audio processing, error handling, and local state management. It is not a substitute for professional accounting review.
