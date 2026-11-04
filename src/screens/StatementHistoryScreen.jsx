import {
  CalendarDays,
  ChevronRight,
  History,
  Plus,
  FileText,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

import {
  formatCurrency,
  formatDate,
  getStatementHistory,
} from "../utils/ledgerStorage";

function StatementHistoryScreen({
  onBack,
  onViewStatement,
  onProcessNewRecap,
}) {
  const history =
    getStatementHistory();

  return (
    <div className="app-shell">
      <main className="phone-app">
        <AppHeader
          onBack={onBack}
        />

        <section className="content history-content">
          <div className="page-heading">
            <h1>
              Income Statement
              History
            </h1>

            <p className="screen-description">
              View finalized daily
              income statements.
            </p>
          </div>

          <div className="currency-notice">
            ₱ All statements are in
            Philippine Pesos (PHP).
          </div>

          {/* =============================
              EMPTY HISTORY
          ============================= */}

          {history.length === 0 ? (
            <div className="history-empty">
              <History
                size={36}
              />

              <strong>
                No finalized
                statements yet
              </strong>

              <span>
                Income statements
                will appear here
                after a daily batch
                is finalized.
              </span>
            </div>
          ) : (
            /* =============================
               STATEMENT HISTORY
            ============================= */

            <div className="history-list">
              {history.map(
                (statement) => (
                  <button
                    type="button"
                    key={
                      statement.id ||
                      statement.date
                    }
                    className="history-card"
                    onClick={() =>
                      onViewStatement?.(
                        statement
                      )
                    }
                  >
                    <div className="history-date-icon">
                      <CalendarDays
                        size={20}
                      />
                    </div>

                    <div className="history-card-info">
                      <strong>
                        {formatDate(
                          statement.date
                        )}
                      </strong>

                      <span>
                        <FileText
                          size={11}
                        />

                        {
                          statement.recapCount ||
                          0
                        }{" "}
                        recap
                        {statement.recapCount !==
                        1
                          ? "s"
                          : ""}
                        {" • "}
                        {
                          statement.transactionCount ||
                          0
                        }{" "}
                        transaction
                        {statement.transactionCount !==
                        1
                          ? "s"
                          : ""}
                      </span>

                      <div className="history-net-income">
                        <span>
                          Net Income
                        </span>

                        <b>
                          {formatCurrency(
                            statement
                              .totals
                              ?.netIncome ||
                              0
                          )}
                        </b>
                      </div>
                    </div>

                    <ChevronRight
                      size={20}
                      className="history-chevron"
                    />
                  </button>
                )
              )}
            </div>
          )}

          {/* =============================
              PROCESS NEW RECAP
          ============================= */}

          <button
            type="button"
            className="add-recap-button"
            onClick={
              onProcessNewRecap
            }
          >
            <Plus size={18} />

            Process New Recap
          </button>
        </section>

        <BottomNav
          activeTab="history"
          onChange={(tab) => {
            if (
              tab === "recap"
            ) {
              onProcessNewRecap?.();
            }
          }}
        />
      </main>
    </div>
  );
}

export default StatementHistoryScreen;
