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
  const [
    currentScreen,
    setCurrentScreen,
  ] = useState("recap");

  const [
    recapData,
    setRecapData,
  ] = useState(null);

  const [
    extractedData,
    setExtractedData,
  ] = useState(null);

  const [
    batchDate,
    setBatchDate,
  ] = useState(
    getTodayDate()
  );

  const [
    statementData,
    setStatementData,
  ] = useState(null);

  /* =========================================
     NAVIGATION
  ========================================= */

  function handleNavigation(
    tab
  ) {
    if (!tab) {
      return;
    }

    switch (tab) {
      case "recap":
        setCurrentScreen(
          "recap"
        );
        break;

      case "extract":
        setCurrentScreen(
          "extract"
        );
        break;

      case "review":
        setCurrentScreen(
          "review"
        );
        break;

      case "batch":
        setCurrentScreen(
          "batch"
        );
        break;

      case "statement":
        setCurrentScreen(
          "statement"
        );
        break;

      case "history":
        setCurrentScreen(
          "history"
        );
        break;

      default:
        console.warn(
          "Unknown navigation tab:",
          tab
        );
    }
  }

  /* =========================================
     RECAP → EXTRACTION
  ========================================= */

  function handleContinueToExtraction(
    data
  ) {
    console.log(
      "Moving to extraction screen:",
      data
    );

    setRecapData(
      data
    );

    setExtractedData(
      null
    );

    setCurrentScreen(
      "extract"
    );
  }

  /* =========================================
     EXTRACTION → REVIEW
  ========================================= */

  function handleContinueToReview(
    data
  ) {
    console.log(
      "Moving to review screen:",
      data
    );

    setExtractedData(
      data
    );

    sessionStorage.setItem(
      "dryveExtractedTransactions",
      JSON.stringify(
        data
      )
    );

    setCurrentScreen(
      "review"
    );
  }

  /* =========================================
     REVIEW → DAILY BATCH
  ========================================= */

  function handleSavedToDailyBatch(
    date
  ) {
    setBatchDate(
      date
    );

    setRecapData(
      null
    );

    setExtractedData(
      null
    );

    sessionStorage.removeItem(
      "dryveTranscript"
    );

    sessionStorage.removeItem(
      "dryveBusinessDate"
    );

    sessionStorage.removeItem(
      "dryveExtractedTransactions"
    );

    setCurrentScreen(
      "batch"
    );
  }

  /* =========================================
     ADD ANOTHER RECAP
  ========================================= */

  function handleAddAnotherRecap() {
    setRecapData(
      null
    );

    setExtractedData(
      null
    );

    sessionStorage.removeItem(
      "dryveTranscript"
    );

    sessionStorage.removeItem(
      "dryveBusinessDate"
    );

    sessionStorage.removeItem(
      "dryveExtractedTransactions"
    );

    setCurrentScreen(
      "recap"
    );
  }

  /* =========================================
     FINALIZE DAY
  ========================================= */

  function handleFinalizeDay(
    date
  ) {
    try {
      const statement =
        finalizeDailyBatch(
          date
        );

      setStatementData(
        statement
      );

      setCurrentScreen(
        "statement"
      );
    } catch (error) {
      console.error(
        "Unable to finalize day:",
        error
      );

      alert(
        error?.message ||
          "Unable to finalize the daily batch."
      );
    }
  }

  /* =========================================
     VIEW HISTORY STATEMENT
  ========================================= */

  function handleViewHistory(
    statement
  ) {
    setStatementData(
      statement
    );

    setCurrentScreen(
      "statement"
    );
  }

  /* =========================================
     EXTRACTION SCREEN
  ========================================= */

  if (
    currentScreen ===
    "extract"
  ) {
    return (
      <ExtractionScreen
        recapData={
          recapData
        }
        onBack={() =>
          setCurrentScreen(
            "recap"
          )
        }
        onContinue={
          handleContinueToReview
        }
        onNavigate={
          handleNavigation
        }
      />
    );
  }

  /* =========================================
     REVIEW SCREEN
  ========================================= */

  if (
    currentScreen ===
    "review"
  ) {
    return (
      <ReviewScreen
        recapData={
          recapData
        }
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
          setCurrentScreen(
            "recap"
          )
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
        onNavigate={
          handleNavigation
        }
      />
    );
  }

  /* =========================================
     DAILY BATCH SCREEN
  ========================================= */

  if (
    currentScreen ===
    "batch"
  ) {
    return (
      <DailyBatchScreen
        date={
          batchDate
        }
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
        onNavigate={
          handleNavigation
        }
      />
    );
  }

  /* =========================================
     INCOME STATEMENT SCREEN
  ========================================= */

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
        onNavigate={
          handleNavigation
        }
      />
    );
  }

  /* =========================================
     HISTORY SCREEN
  ========================================= */

  if (
    currentScreen ===
    "history"
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
        onNavigate={
          handleNavigation
        }
      />
    );
  }

  /* =========================================
     DEFAULT / RECAP SCREEN
  ========================================= */

  return (
    <RecapScreen
      onContinue={
        handleContinueToExtraction
      }
      onNavigate={
        handleNavigation
      }
    />
  );
}

export default App;