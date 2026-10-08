import { useState } from "react";

import {
  CalendarDays,
  FileAudio,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

import {
  formatDate,
  getDailyBatch,
  getBatchTransactions,
  removeRecapFromDailyBatch,
} from "../utils/dryveStorage";

function DailyBatchScreen({
  date,
  onAddAnotherRecap,
  onFinalizeDay,
  onGoToHistory,
}) {
  const [batch, setBatch] =
    useState(() =>
      getDailyBatch(date)
    );

  const transactions =
    getBatchTransactions(batch);

  const unresolved =
    transactions.filter(
      (transaction) =>
        transaction.needs_review ||
        transaction.confirmed ===
          false
    );

  function removeRecap(
    recapId
  ) {
    const confirmed =
      window.confirm(
        "Remove this recap from today's batch?"
      );

    if (!confirmed) return;

    const updated =
      removeRecapFromDailyBatch(
        date,
        recapId
      );

    setBatch(updated);
  }

  return (
    <div className="app-shell">
      <main className="phone-app">

        <AppHeader />

        <section className="content batch-content">

          <div className="page-heading">
            <h1>
              Daily Recap Batch
            </h1>

            <div className="recording-date">
              <CalendarDays
                size={19}
              />

              {formatDate(date)}
            </div>
          </div>

          <div className="batch-summary-grid">
            <div>
              <strong>
                {
                  batch.recaps
                    .length
                }
              </strong>

              <span>
                Recaps
              </span>
            </div>

            <div>
              <strong>
                {
                  transactions.length
                }
              </strong>

              <span>
                Transactions
              </span>
            </div>

            <div>
              <strong>
                {
                  unresolved.length
                }
              </strong>

              <span>
                Need Review
              </span>
            </div>
          </div>

          <div className="batch-recap-list">
            {batch.recaps.map(
              (recap, index) => (
                <article
                  className="batch-recap-card"
                  key={recap.id}
                >
                  <div className="batch-recap-icon">
                    <FileAudio
                      size={20}
                    />
                  </div>

                  <div className="batch-recap-info">
                    <strong>
                      Recap{" "}
                      {index + 1}
                    </strong>

                    <span>
                      {
                        recap
                          .transactions
                          .length
                      }{" "}
                      transaction(s)
                    </span>

                    <p>
                      {recap.transcript?.slice(
                        0,
                        85
                      )}
                      {recap
                        .transcript
                        ?.length >
                      85
                        ? "..."
                        : ""}
                    </p>
                  </div>

                  <CheckCircle2
                    size={20}
                    className="batch-check"
                  />

                  <button
                    className="batch-delete"
                    onClick={() =>
                      removeRecap(
                        recap.id
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </article>
              )
            )}
          </div>

          {unresolved.length >
            0 && (
            <div className="review-summary-warning">
              <AlertTriangle
                size={18}
              />

              <span>
                Some transactions
                still need review.
              </span>
            </div>
          )}

          <button
            className="add-recap-button"
            onClick={
              onAddAnotherRecap
            }
          >
            <Plus size={18} />

            Add Another Recap
          </button>

          <button
            className="finalize-day-button"
            onClick={() =>
              onFinalizeDay?.(
                date
              )
            }
            disabled={
              batch.recaps
                .length === 0 ||
              unresolved.length >
                0
            }
          >
            Finalize Day & Generate Statement
          </button>

        </section>

        <BottomNav
          activeTab="statement"
          onChange={(tab) => {
            if (
              tab === "recap"
            ) {
              onAddAnotherRecap?.();
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

export default DailyBatchScreen;