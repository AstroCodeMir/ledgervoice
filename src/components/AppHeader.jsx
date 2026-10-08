import { ChevronLeft, MoreHorizontal } from "lucide-react";

function AppHeader() {
  return (
    <header className="app-header">
      <button
        className="header-icon-button"
        type="button"
        aria-label="Go back"
        onClick={() => window.history.back()}
      >
        <ChevronLeft size={26} />
      </button>

      <div className="brand">
        <span className="brand-dryve">DRYVE</span>
        <span className="brand-ph">PH</span>
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