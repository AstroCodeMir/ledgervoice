import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Pencil,
  Save,
  Sparkles,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

/* =========================================
   API CONFIGURATION

   LOCAL:
   Leave VITE_API_BASE_URL empty and use
   the Vite proxy.

   VERCEL FRONTEND:
   Set:

   VITE_API_BASE_URL=
   https://your-backend.vercel.app
========================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

/* =========================================
   CURRENCY FORMAT
========================================= */

function formatCurrency(amount) {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "Amount missing";
  }

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {
    return "Amount missing";
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }
  ).format(numericAmount);
}

/* =========================================
   DATE FORMAT
========================================= */

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

/* =========================================
   SAFE API RESPONSE READER
========================================= */

async function readApiResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  console.error(
    "Unexpected extraction API response:",
    {
      status:
        response.status,

      url:
        response.url,

      body:
        text,
    }
  );

  if (
    response.status === 404
  ) {
    throw new Error(
      "Transaction extraction API endpoint was not found. Check the deployed backend URL."
    );
  }

  throw new Error(
    `The API returned an unexpected response (${response.status}).`
  );
}

/* =========================================
   COMPONENT
========================================= */

export default function ExtractionScreen({
  recapData,
  onBack,
  onContinue,
  onNavigate,
}) {
  /*
    Use recapData first.

    sessionStorage is a backup in case
    the page refreshes.
  */

  const initialTranscript =
    recapData?.transcript ||
    sessionStorage.getItem(
      "dryveTranscript"
    ) ||
    "";

  const initialDate =
    recapData?.date ||
    recapData?.businessDate ||
    sessionStorage.getItem(
      "dryveBusinessDate"
    ) ||
    "";

  const [
    transcript,
    setTranscript,
  ] = useState(
    initialTranscript
  );

  const [
    savedTranscript,
    setSavedTranscript,
  ] = useState(
    initialTranscript
  );

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    isExtracting,
    setIsExtracting,
  ] = useState(false);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /* =========================================
     NEW RECAP DATA
  ========================================= */

  useEffect(() => {
    const nextTranscript =
      recapData?.transcript ||
      sessionStorage.getItem(
        "dryveTranscript"
      ) ||
      "";

    setTranscript(
      nextTranscript
    );

    setSavedTranscript(
      nextTranscript
    );

    setTransactions([]);

    setError("");

    setSuccessMessage("");

    setIsEditing(false);
  }, [recapData]);

  /* =========================================
     REVIEW COUNT
  ========================================= */

  const requiresReviewCount =
    useMemo(
      () =>
        transactions.filter(
          (transaction) =>
            transaction.needs_review
        ).length,
      [transactions]
    );

  /* =========================================
     HELPERS
  ========================================= */

  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  function handleEditTranscript() {
    clearMessages();

    setIsEditing(true);
  }

  function handleCancelEdit() {
    clearMessages();

    setTranscript(
      savedTranscript
    );

    setIsEditing(false);
  }

  /* =========================================
     SAVE TRANSCRIPT
  ========================================= */

  function handleSaveTranscript() {
    clearMessages();

    const cleanedTranscript =
      transcript.trim();

    if (!cleanedTranscript) {
      setError(
        "Transcript cannot be empty."
      );

      return;
    }

    setTranscript(
      cleanedTranscript
    );

    setSavedTranscript(
      cleanedTranscript
    );

    sessionStorage.setItem(
      "dryveTranscript",
      cleanedTranscript
    );

    setIsEditing(false);

    /*
      Previously extracted transactions
      become invalid when the transcript
      changes.
    */

    setTransactions([]);

    setSuccessMessage(
      "Transcript changes saved. Extract the transactions again to use the updated text."
    );
  }

  /* =========================================
     EXTRACT TRANSACTIONS
  ========================================= */

  async function handleExtractTransactions() {
    clearMessages();

    const cleanedTranscript =
      transcript.trim();

    if (!cleanedTranscript) {
      setError(
        "A transcript is required before extracting transactions."
      );

      return;
    }

    /*
      Save the final reviewed transcript
      before calling the backend.
    */

    setSavedTranscript(
      cleanedTranscript
    );

    setTranscript(
      cleanedTranscript
    );

    sessionStorage.setItem(
      "dryveTranscript",
      cleanedTranscript
    );

    setIsEditing(false);

    setIsExtracting(true);

    setTransactions([]);

    try {
      const endpoint =
        buildApiUrl(
          "/api/extract-transactions"
        );

      console.log(
        "Calling extraction API:",
        endpoint
      );

      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                transcript:
                  cleanedTranscript,
              }),
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            data.details ||
            "Unable to extract transactions."
        );
      }

      const extractedTransactions =
        Array.isArray(
          data.transactions
        )
          ? data.transactions
          : [];

      if (
        extractedTransactions.length ===
        0
      ) {
        throw new Error(
          "No accounting transactions were detected in this recap."
        );
      }

      /* =================================
         NORMALIZE SERVER RESULT
      ================================= */

      const normalizedTransactions =
        extractedTransactions.map(
          (
            transaction,
            index
          ) => ({
            id:
              transaction.id ||
              index + 1,

            currency:
              "PHP",

            type:
              transaction.type ||
              "Operating Expense",

            account:
              transaction.account ||
              "Miscellaneous",

            description:
              transaction.description ||
              "Unspecified transaction",

            amount:
              transaction.amount ===
                null ||
              transaction.amount ===
                undefined ||
              transaction.amount ===
                ""
                ? null
                : Number(
                    transaction.amount
                  ),

            needs_review:
              Boolean(
                transaction.needs_review
              ),

            review_reason:
              transaction.review_reason ||
              null,
          })
        );

      setTransactions(
        normalizedTransactions
      );

      setSuccessMessage(
        `${normalizedTransactions.length} transaction${
          normalizedTransactions.length ===
          1
            ? ""
            : "s"
        } extracted successfully.`
      );
    } catch (
      requestError
    ) {
      console.error(
        "Transaction extraction failed:",
        requestError
      );

      setTransactions([]);

      setError(
        requestError?.message ||
          "Unable to connect to the transaction extraction service."
      );
    } finally {
      setIsExtracting(
        false
      );
    }
  }

  /* =========================================
     CONTINUE TO FINAL REVIEW
  ========================================= */

  function handleContinueToReview() {
    clearMessages();

    if (
      transactions.length ===
      0
    ) {
      setError(
        "Extract the transactions before continuing to review."
      );

      return;
    }

    onContinue?.({
      date:
        initialDate,

      businessDate:
        initialDate,

      currency:
        "PHP",

      transcript:
        savedTranscript.trim(),

      transactions,
    });
  }

  /* =========================================
     NAVIGATION
  ========================================= */

  function handleBottomNavigation(
    tab
  ) {
    if (onNavigate) {
      onNavigate(tab);
    }
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="screen-content extraction-screen">
        <section className="page-heading extraction-page-heading">
          <button
            type="button"
            className="back-button"
            onClick={onBack}
          >
            <ArrowLeft
              size={19}
              aria-hidden="true"
            />

            Back
          </button>

          <div>
            <p className="eyebrow">
              AI EXTRACTION
            </p>

            <h1>
              Review Transcript
            </h1>

            <p className="page-description">
              Check what the
              transcription service
              understood before creating
              financial transactions.
            </p>
          </div>
        </section>

        {initialDate && (
          <div className="business-date-banner">
            <span>
              Business Date
            </span>

            <strong>
              {formatDate(
                initialDate
              )}
            </strong>
          </div>
        )}

        <section className="extraction-card transcript-card">
          <div className="section-heading-row">
            <div>
              <h2>
                Transcript
              </h2>

              <p>
                Correct names,
                amounts or
                transcription
                mistakes before
                extraction.
              </p>
            </div>

            <FileText
              size={22}
              aria-hidden="true"
            />
          </div>

          {isEditing ? (
            <>
              <textarea
                className="transcript-textarea"
                value={
                  transcript
                }
                rows={10}
                disabled={
                  isExtracting
                }
                onChange={(
                  event
                ) => {
                  setTranscript(
                    event.target
                      .value
                  );

                  clearMessages();
                }}
              />

              <div className="transcript-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    isExtracting
                  }
                  onClick={
                    handleCancelEdit
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={
                    isExtracting ||
                    !transcript.trim()
                  }
                  onClick={
                    handleSaveTranscript
                  }
                >
                  <Save
                    size={18}
                    aria-hidden="true"
                  />

                  Save Transcript
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="transcript-preview">
                {savedTranscript ? (
                  <p>
                    {
                      savedTranscript
                    }
                  </p>
                ) : (
                  <p className="muted-text">
                    No transcript is
                    available.
                  </p>
                )}
              </div>

              <button
                type="button"
                className="secondary-button"
                disabled={
                  isExtracting
                }
                onClick={
                  handleEditTranscript
                }
              >
                <Pencil
                  size={17}
                  aria-hidden="true"
                />

                Edit Transcript
              </button>
            </>
          )}
        </section>

        <div className="currency-notice">
          <strong>
            ₱ Philippine Pesos
            (PHP)
          </strong>

          <span>
            All monetary amounts
            in this prototype are
            treated as PHP.
          </span>
        </div>

        {error && (
          <div
            className="status-message error-message"
            role="alert"
          >
            <AlertTriangle
              size={20}
              aria-hidden="true"
            />

            <div>
              <strong>
                Unable to continue
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className="status-message success-message"
            role="status"
          >
            <CheckCircle2
              size={20}
              aria-hidden="true"
            />

            <div>
              <strong>
                Extraction ready
              </strong>

              <p>
                {
                  successMessage
                }
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          className="primary-button full-width-button"
          disabled={
            isExtracting ||
            !transcript.trim() ||
            isEditing
          }
          onClick={
            handleExtractTransactions
          }
        >
          {isExtracting ? (
            <>
              <LoaderCircle
                className="spin"
                size={19}
                aria-hidden="true"
              />

              Extracting
              Transactions...
            </>
          ) : (
            <>
              <Sparkles
                size={19}
                aria-hidden="true"
              />

              Extract Transactions
            </>
          )}
        </button>

        {transactions.length >
          0 && (
          <section className="extraction-card extracted-transactions-card">
            <div className="section-heading-row">
              <div>
                <h2>
                  Extracted
                  Transactions
                </h2>

                <p>
                  These are
                  preliminary. You
                  can make final
                  corrections on the
                  next screen.
                </p>
              </div>

              <span className="transaction-count-badge">
                {
                  transactions.length
                }
              </span>
            </div>

            {requiresReviewCount >
              0 && (
              <div className="review-warning-banner">
                <AlertTriangle
                  size={18}
                  aria-hidden="true"
                />

                <span>
                  {
                    requiresReviewCount
                  }{" "}
                  transaction
                  {requiresReviewCount ===
                  1
                    ? ""
                    : "s"}{" "}
                  require human
                  review.
                </span>
              </div>
            )}

            <div className="transaction-preview-list">
              {transactions.map(
                (
                  transaction
                ) => (
                  <article
                    key={
                      transaction.id
                    }
                    className={`transaction-preview-item ${
                      transaction.needs_review
                        ? "needs-review"
                        : ""
                    }`}
                  >
                    <div className="transaction-preview-top">
                      <div>
                        <span className="transaction-type-label">
                          {
                            transaction.type
                          }
                        </span>

                        <h3>
                          {
                            transaction.account
                          }
                        </h3>
                      </div>

                      <strong className="transaction-amount">
                        {formatCurrency(
                          transaction.amount
                        )}
                      </strong>
                    </div>

                    <p className="transaction-description">
                      {
                        transaction.description
                      }
                    </p>

                    {transaction.needs_review && (
                      <div className="transaction-review-reason">
                        <AlertTriangle
                          size={15}
                          aria-hidden="true"
                        />

                        <span>
                          {transaction.review_reason ||
                            "This transaction needs review."}
                        </span>
                      </div>
                    )}
                  </article>
                )
              )}
            </div>

            <button
              type="button"
              className="primary-button full-width-button"
              onClick={
                handleContinueToReview
              }
            >
              Continue to Review
            </button>
          </section>
        )}
      </main>

      <BottomNav
        activeTab="extract"
        onNavigate={
          handleBottomNavigation
        }
      />
    </div>
  );
}