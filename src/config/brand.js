export const APP_NAME = "LedgerVoice";

export const APP_TAGLINE =
  "Speak your sales. Review your numbers.";

export const APP_DESCRIPTION =
  "AI-assisted daily sales reconciliation and income statement generation.";

export const STORAGE_KEYS = {
  transcript: "ledgerVoiceTranscript",
  businessDate: "ledgerVoiceBusinessDate",
  extractedTransactions: "ledgerVoiceExtractedTransactions",
  dailyBatches: "ledgerVoiceDailyBatches",
  statementHistory: "ledgerVoiceIncomeStatementHistory",
};

const LEGACY_STORAGE_KEYS = {
  [STORAGE_KEYS.transcript]: "dryveTranscript",
  [STORAGE_KEYS.businessDate]: "dryveBusinessDate",
  [STORAGE_KEYS.extractedTransactions]: "dryveExtractedTransactions",
  [STORAGE_KEYS.dailyBatches]: "dryveDailyBatches",
  [STORAGE_KEYS.statementHistory]: "dryveIncomeStatementHistory",
};

function migrateStorageValue(storage, key) {
  const legacyKey = LEGACY_STORAGE_KEYS[key];

  if (!legacyKey || storage.getItem(key) !== null) {
    return;
  }

  const legacyValue = storage.getItem(legacyKey);

  if (legacyValue !== null) {
    storage.setItem(key, legacyValue);
  }
}

export function readSessionValue(key) {
  migrateStorageValue(sessionStorage, key);
  return sessionStorage.getItem(key);
}

export function writeSessionValue(key, value) {
  sessionStorage.setItem(key, value);
}

export function removeSessionValue(key) {
  sessionStorage.removeItem(key);
}

export function readLocalValue(key) {
  migrateStorageValue(localStorage, key);
  return localStorage.getItem(key);
}

export function writeLocalValue(key, value) {
  localStorage.setItem(key, value);
}
