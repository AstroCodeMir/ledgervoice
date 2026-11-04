import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Save,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

import {
  ACCOUNT_OPTIONS,
  formatCurrency,
  getTodayDate,
  getTypeForAccount,
  saveRecapToDailyBatch,
} from "../utils/ledgerStorage";
import {
  readSessionValue,
  removeSessionValue,
  STORAGE_KEYS,
} from "../config/brand";

function ReviewScreen({
  extractedData,
  onBack,
  onSavedToDailyBatch,
  onGoToRecap,
  onGoToExtract,
  onGoToHistory,
}) {
  /* ======================================
     LOAD EXTRACTED DATA
  ====================================== */

  const savedExtraction =
    readSessionValue(
      STORAGE_KEYS.extractedTransactions
    );

  let savedData = null;

  try {
    savedData = savedExtraction
      ? JSON.parse(savedExtraction)
      : null;
  } catch (error) {
    console.error(
      "Could not read saved extraction:",
      error
    );
  }

  const sourceData =
    extractedData || savedData;

  /* ======================================
     UNIQUE RECAP ID
  ====================================== */

  const [recapId] = useState(() => {
    if (
      typeof crypto !== "undefined" &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }

    return `recap-${Date.now()}`;
  });

  /* ======================================
     BUSINESS DATE
  ====================================== */

  const [businessDate, setBusinessDate] =
    useState(
      sourceData?.date ||
        getTodayDate()
    );

  /* ======================================
     TRANSACTIONS
  ====================================== */

  const [transactions, setTransactions] =
    useState(() => {
      if (
        !sourceData ||
        !Array.isArray(
          sourceData.transactions
        )
      ) {
        return [];
      }

      return sourceData.transactions.map(
        (transaction, index) => {
          const hasAmount =
            transaction.amount !==
              null &&
            transaction.amount !==
              undefined &&
            transaction.amount !== "";

          const requiresReview =
            Boolean(
              transaction.needs_review
            ) ||
            !hasAmount;

          return {
            ...transaction,

            id:
              transaction.id ||
              index + 1,

            type:
              transaction.type ||
              getTypeForAccount(
                transaction.account
              ),

            amount:
              hasAmount
                ? Number(
                    transaction.amount
                  )
                : null,

            needs_review:
              requiresReview,

            confirmed:
              !requiresReview,

            review_reason:
              transaction.review_reason ||
              (
                !hasAmount
                  ? "Amount is missing."
                  : null
              ),
          };
        }
      );
    });

  const [editingId, setEditingId] =
    useState(null);

  /* ======================================
     UPDATE TRANSACTION
  ====================================== */

  function updateTransaction(
    id,
    field,
    value
  ) {
    setTransactions((previous) =>
      previous.map(
        (transaction) => {
          if (
            transaction.id !== id
          ) {
            return transaction;
          }

          const updated = {
            ...transaction,
            [field]: value,

            /*
              Any manual edit should
              be reconfirmed.
            */
            confirmed: false,
            needs_review: true,
          };

          /*
            Account determines its
            accounting section.
          */
          if (field === "account") {
            updated.type =
              getTypeForAccount(
                value
              );
          }

          return updated;
        }
      )
    );
  }

  /* ======================================
     CONFIRM TRANSACTION
  ====================================== */

  function confirmTransaction(id) {
    let validationFailed = false;

    setTransactions((previous) =>
      previous.map(
        (transaction) => {
          if (
            transaction.id !== id
          ) {
            return transaction;
          }

          const amountMissing =
            transaction.amount ===
              null ||
            transaction.amount ===
              undefined ||
            transaction.amount === "";

          const invalidAmount =
            !amountMissing &&
            (
              Number.isNaN(
                Number(
                  transaction.amount
                )
              ) ||
              Number(
                transaction.amount
              ) < 0
            );

          if (
            !transaction.account ||
            !transaction.description?.trim() ||
            amountMissing ||
            invalidAmount
          ) {
            validationFailed = true;

            return {
              ...transaction,

              confirmed: false,
              needs_review: true,

              review_reason:
                amountMissing
                  ? "Amount is required."
                  : invalidAmount
                  ? "Enter a valid PHP amount."
                  : "Complete the missing information.",
            };
          }

          return {
            ...transaction,

            amount: Number(
              transaction.amount
            ),

            type:
              getTypeForAccount(
                transaction.account
              ),

            confirmed: true,
            needs_review: false,
            review_reason: null,
          };
        }
      )
    );

    if (!validationFailed) {
      setEditingId(null);
    }
  }

  /* ======================================
     UNRESOLVED
  ====================================== */

  const unresolvedTransactions =
    transactions.filter(
      (transaction) =>
        transaction.needs_review ||
        !transaction.confirmed ||
        transaction.amount ===
          null ||
        transaction.amount ===
          undefined
    );

  /* ======================================
     SAVE TO DAILY BATCH
  ====================================== */

  function handleSaveToDailyBatch() {
    if (
      !transactions.length
    ) {
      alert(
        "No transactions are available."
      );

      return;
    }

    if (
      unresolvedTransactions.length >
      0
    ) {
      alert(
        `Please review ${unresolvedTransactions.length} transaction(s) before saving this recap.`
      );

      return;
    }

    const reviewedTransactions =
      transactions.map(
        (transaction) => ({
          ...transaction,

          amount: Number(
            transaction.amount
          ),

          type:
            getTypeForAccount(
              transaction.account
            ),

          confirmed: true,
          needs_review: false,
        })
      );

    saveRecapToDailyBatch({
      date: businessDate,

      recapId,

      transcript:
        sourceData?.transcript ||
        "",

      transactions:
        reviewedTransactions,
    });

    removeSessionValue(
      STORAGE_KEYS.extractedTransactions
    );

    onSavedToDailyBatch?.(
      businessDate
    );
  }

  /* ======================================
     EMPTY STATE
  ====================================== */

  if (!transactions.length) {
    return (
      <div className="app-shell">
        <main className="phone-app">
          <AppHeader
            onBack={onBack}
          />

          <section className="content">
            <div className="page-heading">
              <h1>
                Review Transactions
              </h1>
            </div>

            <div className="review-summary-warning">
              <AlertTriangle
                size={18}
              />

              <div>
                <strong>
                  No transactions
                </strong>

                <span>
                  Return to AI
                  Extraction and
                  process the
                  transcript first.
                </span>
              </div>
            </div>
          </section>

          <BottomNav
            activeTab="review"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="phone-app">
        <AppHeader
          onBack={onBack}
        />

        <section className="content review-content">
          <div className="page-heading">
            <h1>
              Review Transactions
            </h1>

            <p className="screen-description">
              LedgerVoice prepares
              financial entries, but
              you remain in control
              of what gets finalized.
            </p>
          </div>

          {/* =============================
              BUSINESS DATE
          ============================= */}

          <div className="business-date-field">
            <label>
              Business Date
            </label>

            <input
              type="date"
              value={
                businessDate
              }
              onChange={(event) =>
                setBusinessDate(
                  event.target.value
                )
              }
            />
          </div>

          {/* =============================
              CURRENCY INFO
          ============================= */}

          <div className="currency-notice">
            ₱ All amounts are in
            Philippine Pesos (PHP).
          </div>

          {/* =============================
              REVIEW WARNING
          ============================= */}

          {unresolvedTransactions.length >
            0 && (
            <div className="review-summary-warning">
              <AlertTriangle
                size={18}
              />

              <div>
                <strong>
                  {
                    unresolvedTransactions.length
                  }{" "}
                  transaction
                  {unresolvedTransactions.length !==
                  1
                    ? "s"
                    : ""}
                  {" "}
                  need review
                </strong>

                <span>
                  Resolve all missing
                  or uncertain
                  information before
                  saving this recap.
                </span>
              </div>
            </div>
          )}

          {/* =============================
              TRANSACTIONS
          ============================= */}

          <div className="review-transaction-list">
            {transactions.map(
              (transaction) => (
                <article
                  className="review-transaction-card"
                  key={
                    transaction.id
                  }
                >
                  <div className="review-card-header">
                    <div>
                      <span className="transaction-account">
                        {
                          transaction.account
                        }
                      </span>

                      <strong>
                        {
                          transaction.description
                        }
                      </strong>

                      <span className="transaction-type">
                        {
                          transaction.type
                        }
                      </span>
                    </div>

                    {transaction.confirmed ? (
                      <CheckCircle2
                        size={21}
                        className="review-confirmed-icon"
                      />
                    ) : (
                      <AlertTriangle
                        size={21}
                        className="review-warning-icon"
                      />
                    )}
                  </div>

                  {/* EDIT MODE */}

                  {editingId ===
                  transaction.id ? (
                    <div className="review-edit-fields">
                      <label>
                        Account
                      </label>

                      <select
                        value={
                          transaction.account
                        }
                        onChange={(
                          event
                        ) =>
                          updateTransaction(
                            transaction.id,
                            "account",
                            event.target
                              .value
                          )
                        }
                      >
                        {ACCOUNT_OPTIONS.map(
                          (account) => (
                            <option
                              key={
                                account
                              }
                              value={
                                account
                              }
                            >
                              {
                                account
                              }
                            </option>
                          )
                        )}
                      </select>

                      <label>
                        Description
                      </label>

                      <input
                        type="text"
                        value={
                          transaction.description ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateTransaction(
                            transaction.id,
                            "description",
                            event.target
                              .value
                          )
                        }
                      />

                      <label>
                        Amount (PHP)
                      </label>

                      <div className="peso-input-wrapper">
                        <span>
                          ₱
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={
                            transaction.amount ??
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateTransaction(
                              transaction.id,
                              "amount",
                              event.target
                                .value ===
                                ""
                                ? null
                                : Number(
                                    event
                                      .target
                                      .value
                                  )
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="confirm-transaction-button"
                        onClick={() =>
                          confirmTransaction(
                            transaction.id
                          )
                        }
                      >
                        <Save
                          size={16}
                        />

                        Save & Confirm
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* PESO DISPLAY */}

                      <div className="review-amount">
                        {formatCurrency(
                          transaction.amount
                        )}
                      </div>

                      {transaction.review_reason && (
                        <p className="review-reason">
                          {
                            transaction.review_reason
                          }
                        </p>
                      )}

                      <button
                        type="button"
                        className="edit-review-button"
                        onClick={() =>
                          setEditingId(
                            transaction.id
                          )
                        }
                      >
                        <Pencil
                          size={15}
                        />

                        Edit
                      </button>
                    </>
                  )}
                </article>
              )
            )}
          </div>

          {/* =============================
              SAVE BATCH
          ============================= */}

          <button
            type="button"
            className="save-daily-batch-button"
            disabled={
              unresolvedTransactions.length >
              0
            }
            onClick={
              handleSaveToDailyBatch
            }
          >
            Confirm & Add to Closing
          </button>
        </section>

        <BottomNav
          activeTab="review"
          onChange={(tab) => {
            if (
              tab === "recap"
            ) {
              onGoToRecap?.();
            }

            if (
              tab === "extract"
            ) {
              onGoToExtract?.();
            }

            if (
              tab === "history"
            ) {
              onGoToHistory?.();
            }
          }}
        />
      </main>
    </div>
  );
}

export default ReviewScreen;
