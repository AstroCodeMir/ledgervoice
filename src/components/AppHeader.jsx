import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { APP_NAME } from "../config/brand";

function AppHeader({ onBack }) {
  return (
    <header className="app-header">
      <button
        className="header-icon-button"
        type="button"
        aria-label="Go back"
        onClick={onBack || (() => window.history.back())}
      >
        <ChevronLeft size={26} />
      </button>

      <div className="brand" aria-label={APP_NAME}>
        <span className="brand-ledger">LEDGER</span>
        <span className="brand-voice">VOICE</span>
      </div>

      <button
        className="header-icon-button"
        type="button"
        aria-label="More options"
      >
        <MoreHorizontal size={25} />
      </button>
    </header>
  );
}

export default AppHeader;
