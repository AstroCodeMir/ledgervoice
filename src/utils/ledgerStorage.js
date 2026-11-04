import {
  readLocalValue,
  STORAGE_KEYS,
  writeLocalValue,
} from "../config/brand";

const BATCH_KEY = STORAGE_KEYS.dailyBatches;
const HISTORY_KEY = STORAGE_KEYS.statementHistory;

/* =========================================
   ACCOUNTING STRUCTURE
========================================= */

export const REVENUE_ACCOUNTS = [
  "Vehicle Sales",
  "Other Income",
];

export const COST_OF_SALES_ACCOUNTS = [
  "Vehicle Acquisition Cost",
  "Reconditioning",
];

export const OPERATING_EXPENSE_ACCOUNTS = [
  "Salaries and Commissions",
  "Transport and Fuel",
  "Rent and Utilities",
  "Marketing",
  "Office and Admin",
  "Miscellaneous",
];

export const ACCOUNT_OPTIONS = [
  ...REVENUE_ACCOUNTS,
  ...COST_OF_SALES_ACCOUNTS,
  ...OPERATING_EXPENSE_ACCOUNTS,
];

/* =========================================
   ACCOUNT → TYPE
========================================= */

export function getTypeForAccount(account) {
  if (REVENUE_ACCOUNTS.includes(account)) {
    return "Revenue";
  }

  if (COST_OF_SALES_ACCOUNTS.includes(account)) {
    return "Cost of Sales";
  }

  if (OPERATING_EXPENSE_ACCOUNTS.includes(account)) {
    return "Operating Expense";
  }

  return "Operating Expense";
}

/* =========================================
   DATE HELPERS
========================================= */

export function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* =========================================
   PHP CURRENCY
========================================= */

export function formatCurrency(amount) {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "Amount missing";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Amount missing";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/* =========================================
   DAILY BATCH STORAGE
========================================= */

export function getDailyBatches() {
  try {
    const stored =
      readLocalValue(BATCH_KEY);

    return stored
      ? JSON.parse(stored)
      : {};
  } catch (error) {
    console.error(
      "Unable to read daily batches:",
      error
    );

    return {};
  }
}

export function getDailyBatch(date) {
  const batches =
    getDailyBatches();

  return (
    batches[date] || {
      date,
      finalized: false,
      recaps: [],
    }
  );
}

/* =========================================
   SAVE RECAP TO DAILY BATCH
========================================= */

export function saveRecapToDailyBatch({
  date,
  recapId,
  transcript,
  transactions,
}) {
  if (!date) {
    throw new Error(
      "Business date is required."
    );
  }

  if (!recapId) {
    throw new Error(
      "Recap ID is required."
    );
  }

  const batches =
    getDailyBatches();

  const batch =
    batches[date] || {
      date,
      finalized: false,
      recaps: [],
    };

  const normalizedTransactions =
    Array.isArray(transactions)
      ? transactions.map(
          (transaction, index) => ({
            ...transaction,

            id:
              transaction.id ||
              index + 1,

            type:
              getTypeForAccount(
                transaction.account
              ),

            amount:
              transaction.amount ===
                null ||
              transaction.amount ===
                undefined ||
              transaction.amount === ""
                ? null
                : Number(
                    transaction.amount
                  ),

            currency: "PHP",

            confirmed:
              transaction.confirmed !==
              false,

            needs_review:
              Boolean(
                transaction.needs_review
              ),
          })
        )
      : [];

  const recap = {
    id: recapId,

    date,

    currency: "PHP",

    transcript:
      transcript || "",

    transactions:
      normalizedTransactions,

    savedAt:
      new Date().toISOString(),
  };

  const existingIndex =
    batch.recaps.findIndex(
      (item) =>
        item.id === recapId
    );

  if (existingIndex >= 0) {
    batch.recaps[
      existingIndex
    ] = recap;
  } else {
    batch.recaps.push(recap);
  }

  /*
    If a recap is added or edited,
    the business day becomes open again.
  */
  batch.finalized = false;

  batches[date] = batch;

  writeLocalValue(
    BATCH_KEY,
    JSON.stringify(batches)
  );

  return batch;
}

/* =========================================
   REMOVE RECAP
========================================= */

export function removeRecapFromDailyBatch(
  date,
  recapId
) {
  const batches =
    getDailyBatches();

  const batch =
    batches[date];

  if (!batch) {
    return null;
  }

  batch.recaps =
    batch.recaps.filter(
      (recap) =>
        recap.id !== recapId
    );

  batch.finalized = false;

  batches[date] = batch;

  writeLocalValue(
    BATCH_KEY,
    JSON.stringify(batches)
  );

  return batch;
}

/* =========================================
   GET ALL TRANSACTIONS FROM BATCH
========================================= */

export function getBatchTransactions(batch) {
  if (
    !batch ||
    !Array.isArray(batch.recaps)
  ) {
    return [];
  }

  return batch.recaps.flatMap(
    (recap) =>
      Array.isArray(
        recap.transactions
      )
        ? recap.transactions
        : []
  );
}

/* =========================================
   ACCOUNT TOTAL
========================================= */

function getAccountTotal(
  transactions,
  account
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.account ===
          account &&
        transaction.confirmed !==
          false &&
        transaction.amount !==
          null &&
        transaction.amount !==
          undefined
    )
    .reduce(
      (sum, transaction) => {
        const amount =
          Number(
            transaction.amount
          );

        return (
          sum +
          (
            Number.isFinite(
              amount
            )
              ? amount
              : 0
          )
        );
      },
      0
    );
}

/* =========================================
   CALCULATE INCOME STATEMENT
========================================= */

export function calculateStatement(
  transactions = []
) {
  const revenueAccounts = {};

  REVENUE_ACCOUNTS.forEach(
    (account) => {
      revenueAccounts[account] =
        getAccountTotal(
          transactions,
          account
        );
    }
  );

  const costAccounts = {};

  COST_OF_SALES_ACCOUNTS.forEach(
    (account) => {
      costAccounts[account] =
        getAccountTotal(
          transactions,
          account
        );
    }
  );

  const expenseAccounts = {};

  OPERATING_EXPENSE_ACCOUNTS.forEach(
    (account) => {
      expenseAccounts[account] =
        getAccountTotal(
          transactions,
          account
        );
    }
  );

  const revenue =
    Object.values(
      revenueAccounts
    ).reduce(
      (sum, amount) =>
        sum + amount,
      0
    );

  const costOfSales =
    Object.values(
      costAccounts
    ).reduce(
      (sum, amount) =>
        sum + amount,
      0
    );

  const operatingExpenses =
    Object.values(
      expenseAccounts
    ).reduce(
      (sum, amount) =>
        sum + amount,
      0
    );

  const grossProfit =
    revenue - costOfSales;

  const netIncome =
    grossProfit -
    operatingExpenses;

  return {
    currency: "PHP",

    revenueAccounts,
    costAccounts,
    expenseAccounts,

    revenue,
    costOfSales,
    grossProfit,
    operatingExpenses,
    netIncome,
  };
}

/* =========================================
   STATEMENT HISTORY
========================================= */

export function getStatementHistory() {
  try {
    const stored =
      readLocalValue(
        HISTORY_KEY
      );

    return stored
      ? JSON.parse(stored)
      : [];
  } catch (error) {
    console.error(
      "Unable to read statement history:",
      error
    );

    return [];
  }
}

/* =========================================
   FINALIZE DAILY BATCH
========================================= */

export function finalizeDailyBatch(date) {
  const batches =
    getDailyBatches();

  const batch =
    batches[date];

  if (!batch) {
    throw new Error(
      "No daily batch was found for this date."
    );
  }

  if (
    !Array.isArray(
      batch.recaps
    ) ||
    batch.recaps.length === 0
  ) {
    throw new Error(
      "Add at least one recap before finalizing the day."
    );
  }

  const transactions =
    getBatchTransactions(
      batch
    );

  if (
    transactions.length === 0
  ) {
    throw new Error(
      "No transactions were found for this business day."
    );
  }

  const unresolvedTransactions =
    transactions.filter(
      (transaction) =>
        transaction.needs_review ||
        transaction.confirmed ===
          false ||
        transaction.amount ===
          null ||
        transaction.amount ===
          undefined ||
        !Number.isFinite(
          Number(
            transaction.amount
          )
        )
    );

  if (
    unresolvedTransactions.length >
    0
  ) {
    throw new Error(
      `${unresolvedTransactions.length} transaction(s) still need review.`
    );
  }

  const normalizedTransactions =
    transactions.map(
      (transaction) => ({
        ...transaction,

        type:
          getTypeForAccount(
            transaction.account
          ),

        amount:
          Number(
            transaction.amount
          ),

        currency: "PHP",

        confirmed: true,
        needs_review: false,
      })
    );

  const totals =
    calculateStatement(
      normalizedTransactions
    );

  const statement = {
    id:
      `statement-${date}`,

    date,

    currency: "PHP",

    recapCount:
      batch.recaps.length,

    transactionCount:
      normalizedTransactions.length,

    transactions:
      normalizedTransactions,

    totals,

    finalizedAt:
      new Date().toISOString(),
  };

  let history =
    getStatementHistory();

  /*
    Only one finalized statement per date.

    If the same date is finalized again,
    update the existing statement.
  */
  const existingIndex =
    history.findIndex(
      (item) =>
        item.date === date
    );

  if (existingIndex >= 0) {
    history[
      existingIndex
    ] = statement;
  } else {
    history.push(
      statement
    );
  }

  /*
    Latest date first.
  */
  history.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  writeLocalValue(
    HISTORY_KEY,
    JSON.stringify(history)
  );

  /*
    Mark the daily batch finalized.
  */
  batch.finalized = true;

  batch.finalizedAt =
    statement.finalizedAt;

  batches[date] = batch;

  writeLocalValue(
    BATCH_KEY,
    JSON.stringify(batches)
  );

  return statement;
}
