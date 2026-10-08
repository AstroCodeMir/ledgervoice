import { useState } from "react";

import RecapScreen from "./screens/RecapScreen";
import ExtractionScreen from "./screens/ExtractionScreen";
import ReviewScreen from "./screens/ReviewScreen";
import DailyBatchScreen from "./screens/DailyBatchScreen";
import IncomeStatementScreen from "./screens/IncomeStatementScreen";
import StatementHistoryScreen from "./screens/StatementHistoryScreen";

import {
  finalizeDailyBatch,
  getTodayDate,
} from "./utils/dryveStorage";

function App() {
  const [currentScreen, setCurrentScreen] =
    useState("recap");

  const [recapData, setRecapData] =
    useState(null);

  const [extractedData, setExtractedData] =
    useState(null);

  const [batchDate, setBatchDate] =
    useState(getTodayDate());

  const [statementData, setStatementData] =
    useState(null);

  /* ==========================
     RECAP → EXTRACTION
  ========================== */

  const handleContinueToExtraction = (
    data
  ) => {
    setRecapData(data);

    setCurrentScreen("extract");
  };

  /* ==========================
     EXTRACTION → REVIEW
  ========================== */

  const handleContinueToReview = (
    data
  ) => {
    setExtractedData(data);

    sessionStorage.setItem(
      "dryveExtractedTransactions",
      JSON.stringify(data)
    );

    setCurrentScreen("review");
  };

  /* ==========================
     REVIEW → DAILY BATCH
  ========================== */

  const handleSavedToDailyBatch = (
    date
  ) => {
    setBatchDate(date);

    setRecapData(null);
    setExtractedData(null);

    sessionStorage.removeItem(
      "dryveTranscript"
    );

    sessionStorage.removeItem(
      "dryveExtractedTransactions"
    );

    setCurrentScreen("batch");
  };

  /* ==========================
     ADD ANOTHER RECAP
  ========================== */

  const handleAddAnotherRecap = () => {
    setRecapData(null);
    setExtractedData(null);

    sessionStorage.removeItem(
      "dryveTranscript"
    );

    sessionStorage.removeItem(
      "dryveExtractedTransactions"
    );

    setCurrentScreen("recap");
  };

  /* ==========================
     FINALIZE DAY
  ========================== */

  const handleFinalizeDay = (
    date
  ) => {
    try {
      const statement =
        finalizeDailyBatch(date);

      setStatementData(statement);

      setCurrentScreen(
        "statement"
      );
    } catch (error) {
      alert(error.message);
    }
  };

  /* ==========================
     VIEW HISTORY STATEMENT
  ========================== */

  const handleViewHistory = (
    statement
  ) => {
    setStatementData(statement);

    setCurrentScreen(
      "statement"
    );
  };

  /* ==========================
     ROUTING
  ========================== */

  if (
    currentScreen === "extract"
  ) {
    return (
      <ExtractionScreen
        transcript={
          recapData?.transcript
        }
        onBack={() =>
          setCurrentScreen("recap")
        }
        onContinueToReview={
          handleContinueToReview
        }
      />
    );
  }

  if (
    currentScreen === "review"
  ) {
    return (
      <ReviewScreen
        extractedData={
          extractedData
        }
        onBack={() =>
          setCurrentScreen(
            "extract"
          )
        }
        onSavedToDailyBatch={
          handleSavedToDailyBatch
        }
        onGoToRecap={() =>
          setCurrentScreen("recap")
        }
        onGoToExtract={() =>
          setCurrentScreen(
            "extract"
          )
        }
        onGoToHistory={() =>
          setCurrentScreen(
            "history"
          )
        }
      />
    );
  }

  if (
    currentScreen === "batch"
  ) {
    return (
      <DailyBatchScreen
        date={batchDate}
        onAddAnotherRecap={
          handleAddAnotherRecap
        }
        onFinalizeDay={
          handleFinalizeDay
        }
        onGoToHistory={() =>
          setCurrentScreen(
            "history"
          )
        }
      />
    );
  }

  if (
    currentScreen ===
    "statement"
  ) {
    return (
      <IncomeStatementScreen
        statement={
          statementData
        }
        onBack={() =>
          setCurrentScreen(
            "history"
          )
        }
        onProcessNewRecap={
          handleAddAnotherRecap
        }
        onGoToHistory={() =>
          setCurrentScreen(
            "history"
          )
        }
      />
    );
  }

  if (
    currentScreen === "history"
  ) {
    return (
      <StatementHistoryScreen
        onBack={() =>
          setCurrentScreen(
            "recap"
          )
        }
        onViewStatement={
          handleViewHistory
        }
        onProcessNewRecap={
          handleAddAnotherRecap
        }
      />
    );
  }

  return (
    <RecapScreen
      onContinueToExtraction={
        handleContinueToExtraction
      }
    />
  );
}

export default App;