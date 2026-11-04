import {
  CalendarDays,
  History,
  RotateCcw,
  FileText,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

import {
  formatCurrency,
  formatDate,
} from "../utils/ledgerStorage";

function IncomeStatementScreen({
  statement,
  onBack,
  onProcessNewRecap,
  onGoToHistory,
}) {
  /* ======================================
     EMPTY STATE
  ====================================== */

  if (
    !statement ||
    !statement.totals
  ) {
    return (
      <div className="app-shell">
        <main className="phone-app">
          <AppHeader
            onBack={onBack}
          />

          <section className="content">
            <div className="page-heading">
              <h1>
                Income Statement
              </h1>
            </div>

            <p>
              No finalized income
              statement is currently
              selected.
            </p>

            <button
              type="button"
              className="history-button"
              onClick={
                onGoToHistory
              }
            >
              <History
                size={18}
              />

              View Statement History
            </button>
          </section>
        </main>
      </div>
    );
  }

  const {
    date,
    recapCount = 0,
    transactionCount = 0,
    totals,
    finalizedAt,
  } = statement;

  const {
    revenueAccounts = {},
    costAccounts = {},
    expenseAccounts = {},

    revenue = 0,
    costOfSales = 0,
    grossProfit = 0,
    operatingExpenses = 0,
    netIncome = 0,
  } = totals;

  function renderAccounts(
    accounts
  ) {
    return Object.entries(
      accounts
    ).map(
      ([account, amount]) => (
        <div
          className="statement-row"
          key={account}
        >
          <span>
            {account}
          </span>

          <strong>
            {formatCurrency(
              amount
            )}
          </strong>
        </div>
      )
    );
  }

  return (
    <div className="app-shell">
      <main className="phone-app">
        <AppHeader
          onBack={onBack}
        />

        <section className="content statement-content">
          {/* =============================
              HEADER
          ============================= */}

          <div className="page-heading">
            <h1>
              Daily Income Statement
            </h1>

            <div className="recording-date">
              <CalendarDays
                size={19}
              />

              <span>
                {formatDate(
                  date
                )}
              </span>
            </div>
          </div>

          {/* =============================
              PHP BADGE
          ============================= */}

          <div className="currency-notice">
            ₱ Philippine Pesos
            (PHP)
          </div>

          {/* =============================
              META
          ============================= */}

          <div className="statement-meta">
            <span>
              <FileText
                size={12}
              />

              {recapCount} recap
              {recapCount !== 1
                ? "s"
                : ""}
            </span>

            <span>
              {
                transactionCount
              }{" "}
              transaction
              {transactionCount !==
              1
                ? "s"
                : ""}
            </span>
          </div>

          {/* =============================
              REVENUE
          ============================= */}

          <section className="statement-section">
            <h2>
              Revenue
            </h2>

            {renderAccounts(
              revenueAccounts
            )}

            <div className="statement-total">
              <span>
                Total Revenue
              </span>

              <strong>
                {formatCurrency(
                  revenue
                )}
              </strong>
            </div>
          </section>

          {/* =============================
              COST OF SALES
          ============================= */}

          <section className="statement-section">
            <h2>
              Cost of Sales
            </h2>

            {renderAccounts(
              costAccounts
            )}

            <div className="statement-total">
              <span>
                Total Cost of
                Sales
              </span>

              <strong>
                {formatCurrency(
                  costOfSales
                )}
              </strong>
            </div>
          </section>

          {/* =============================
              GROSS PROFIT
          ============================= */}

          <section className="gross-profit-card">
            <span>
              Gross Profit
            </span>

            <strong>
              {formatCurrency(
                grossProfit
              )}
            </strong>
          </section>

          {/* =============================
              OPERATING EXPENSES
          ============================= */}

          <section className="statement-section">
            <h2>
              Operating Expenses
            </h2>

            {renderAccounts(
              expenseAccounts
            )}

            <div className="statement-total">
              <span>
                Total Operating
                Expenses
              </span>

              <strong>
                {formatCurrency(
                  operatingExpenses
                )}
              </strong>
            </div>
          </section>

          {/* =============================
              NET INCOME
          ============================= */}

          <section className="net-income-card">
            <div>
              <span>
                Net Income
              </span>

              <small>
                Revenue less cost of
                sales and operating
                expenses
              </small>
            </div>

            <strong>
              {formatCurrency(
                netIncome
              )}
            </strong>
          </section>

          {/* =============================
              FINALIZED DATE
          ============================= */}

          {finalizedAt && (
            <p className="statement-finalized-time">
              Finalized{" "}
              {new Date(
                finalizedAt
              ).toLocaleString(
                "en-PH"
              )}
            </p>
          )}

          {/* =============================
              ACTIONS
          ============================= */}

          <button
            type="button"
            className="history-button"
            onClick={
              onGoToHistory
            }
          >
            <History
              size={18}
            />

            View Statement History
          </button>

          <button
            type="button"
            className="new-recap-button"
            onClick={
              onProcessNewRecap
            }
          >
            <RotateCcw
              size={18}
            />

            Process New Recap
          </button>
        </section>

        <BottomNav
          activeTab="statement"
          onChange={(tab) => {
            if (
              tab === "recap"
            ) {
              onProcessNewRecap?.();
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

export default IncomeStatementScreen;
