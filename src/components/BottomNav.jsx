import {
  Mic,
  FileText,
  CircleCheckBig,
  ChartNoAxesColumnIncreasing,
  History,
} from "lucide-react";

function BottomNav({
  activeTab,
  onChange,
  onNavigate,
}) {
  const items = [
    {
      id: "recap",
      label: "Recap",
      icon: Mic,
    },
    {
      id: "extract",
      label: "Extract",
      icon: FileText,
    },
    {
      id: "review",
      label: "Review",
      icon: CircleCheckBig,
    },
    {
      id: "statement",
      label: "Statement",
      icon:
        ChartNoAxesColumnIncreasing,
    },
    {
      id: "history",
      label: "History",
      icon: History,
    },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon =
          item.icon;

        const active =
          activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={
              active
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => (onNavigate || onChange)?.(item.id)}
          >
            <Icon size={20} />

            <span>
              {item.label}
            </span>

            {active && (
              <i className="active-dot" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
