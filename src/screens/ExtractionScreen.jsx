import { useState } from "react";

import {
  FileText,
  Pencil,
  Sparkles,
  LoaderCircle,
  AlertTriangle,
  Car,
  Wrench,
  Fuel,
  Users,
  WalletCards,
  CheckCircle2,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

function formatCurrency(amount) {
  if (amount === null || amount === undefined) {
    return "Amount missing";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTransactionIcon(account) {
  switch (account) {
    case "Vehicle Sales":
    case "Vehicle Acquisition Cost":
      return Car;

    case "Reconditioning":
      return Wrench;

    case "Transport and Fuel":
      return Fuel;

    case "Salaries and Commissions":
      return Users;

    default:
      return WalletCards;
  }
}

function ExtractionScreen({
  transcript,
  onBack,
  onContinueToReview,
}) {
  const initialTranscript =
    transcript ||
    sessionStorage.getItem("dryveTranscript") ||
    "";

  const [editedTranscript, setEditedTranscript] =
    useState(initialTranscript);

  const [isEditing, setIsEditing] =
    useState(false);

  const [isExtracting, setIsExtracting] =
    useState(false);

  const [transactions, setTransactions] =
    useState([]);

  const [error, setError] =
    useState("");

  const handleSaveTranscript = () => {
    const cleaned =
      editedTranscript.trim();

    if (!cleaned) {
      setError(
        "Transcript cannot be empty."
      );

      return;
    }

    sessionStorage.setItem(
      "dryveTranscript",
      cleaned
    );

    setError("");
    setIsEditing(false);
  };

  const extractTransactions = async () => {
    const cleanedTranscript =
      editedTranscript.trim();

    if (!cleanedTranscript) {
      setError(
        "Please provide a transcript before extraction."
      );

      return;
    }

    setError("");
    setIsExtracting(true);
    setTransactions([]);

    try {
      sessionStorage.setItem(
        "dryveTranscript",
        cleanedTranscript
      );

      const response = await fetch(
        "/api/extract-transactions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            transcript: cleanedTranscript,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Extraction failed."
        );
      }

      const extracted =
        result.transactions || [];

      setTransactions(extracted);

      sessionStorage.setItem(
        "dryveExtractedTransactions",
        JSON.stringify({
          date:
            new Date()
              .toISOString()
              .split("T")[0],

          transcript:
            cleanedTranscript,

          transactions: extracted,
        })
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to extract transactions."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleContinue = () => {
    if (!transactions.length) {
      setError(
        "Extract transactions before continuing."
      );

      return;
    }

    onContinueToReview?.({
      date:
        new Date()
          .toISOString()
          .split("T")[0],

      transcript:
        editedTranscript,

      transactions,
    });
  };

  return (
    <div className="app-shell">
      <main className="phone-app">

        <AppHeader onBack={onBack} />

        <section className="content extraction-content">

          <div className="page-heading">
            <h1>AI Extraction</h1>

            <p className="screen-description">
              Review the transcription before
              extracting financial transactions.
            </p>
          </div>

          {/* TRANSCRIPT */}

          <section className="transcript-review-card">

            <div className="transcript-review-header">

              <div className="transcript-title">
                <FileText size={20} />

                <strong>
                  Voice Transcript
                </strong>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="edit-transcript-button"
                  onClick={() =>
                    setIsEditing(true)
                  }
                >
                  <Pencil size={15} />

                  Edit
                </button>
              )}

            </div>

            {isEditing ? (
              <>
                <textarea
                  className="transcript-editor"
                  value={editedTranscript}
                  onChange={(event) =>
                    setEditedTranscript(
                      event.target.value
                    )
                  }
                  rows={8}
                />

                <div className="transcript-actions">

                  <button
                    type="button"
                    className="cancel-transcript-button"
                    onClick={() =>
                      setIsEditing(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="save-transcript-button"
                    onClick={
                      handleSaveTranscript
                    }
                  >
                    Save Changes
                  </button>

                </div>
              </>
            ) : (
              <p className="transcript-text">
                {editedTranscript}
              </p>
            )}

          </section>

          {/* INFORMATION */}

          <div className="review-helper-card">
            <CheckCircle2 size={18} />

            <span>
              Correct names, amounts, or words
              that were misheard before continuing.
            </span>
          </div>

          {/* EXTRACTION BUTTON */}

          <button
            type="button"
            className="extract-ai-button"
            onClick={
              extractTransactions
            }
            disabled={
              isExtracting ||
              isEditing
            }
          >

            {isExtracting ? (
              <>
                <LoaderCircle
                  size={19}
                  className="processing-spinner"
                />

                Extracting Transactions...
              </>
            ) : (
              <>
                <Sparkles size={19} />

                Extract Transactions
              </>
            )}

          </button>

          {error && (
            <div className="extraction-error">
              <AlertTriangle size={18} />

              <span>{error}</span>
            </div>
          )}

          {/* RESULTS */}

          {transactions.length > 0 && (
            <section className="extracted-results">

              <div className="results-heading">

                <div>
                  <h2>
                    Detected Transactions
                  </h2>

                  <p>
                    {transactions.length} transaction
                    {transactions.length !== 1
                      ? "s"
                      : ""}{" "}
                    found
                  </p>
                </div>

              </div>

              <div className="transaction-list">

                {transactions.map(
                  (transaction) => {

                    const Icon =
                      getTransactionIcon(
                        transaction.account
                      );

                    return (
                      <article
                        key={transaction.id}
                        className={`extracted-transaction-card ${
                          transaction.needs_review
                            ? "transaction-needs-review"
                            : ""
                        }`}
                      >

                        <div className="transaction-icon">
                          <Icon size={20} />
                        </div>

                        <div className="transaction-info">

                          <span className="transaction-account">
                            {transaction.account}
                          </span>

                          <strong>
                            {transaction.description}
                          </strong>

                          <span className="transaction-type">
                            {transaction.type}
                          </span>

                          {transaction.needs_review && (
                            <span className="needs-review-label">
                              <AlertTriangle
                                size={13}
                              />

                              Needs Review
                            </span>
                          )}

                          {transaction.review_reason && (
                            <span className="review-reason">
                              {
                                transaction.review_reason
                              }
                            </span>
                          )}

                        </div>

                        <div className="transaction-amount">
                          {formatCurrency(
                            transaction.amount
                          )}
                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            </section>
          )}

          {transactions.length > 0 && (
            <button
              type="button"
              className="continue-button"
              onClick={
                handleContinue
              }
            >
              Continue to Review
            </button>
          )}

        </section>

        <BottomNav
          activeTab="extract"
          onChange={(tab) => {
            if (tab === "recap") {
              onBack?.();
            }
          }}
        />

      </main>
    </div>
  );
}

export default ExtractionScreen;