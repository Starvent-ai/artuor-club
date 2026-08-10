import "./sidebar.css";

export type AppSection = "home" | "open_tabs" | "ledger" | "reports" | "transactions" | "settings";

interface SidebarItem {
  section: AppSection;
  label: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { section: "home", label: "میزها و سیستم‌ها" },
  { section: "open_tabs", label: "حساب‌های باز" },
  { section: "ledger", label: "حسابداری" },
  { section: "reports", label: "گزارش‌ها" },
  { section: "transactions", label: "تراکنش‌ها" },
  { section: "settings", label: "تنظیمات" },
];

interface SidebarProps {
  activeSection: AppSection;
  onSelect: (section: AppSection) => void;
}

export function Sidebar({ activeSection, onSelect }: SidebarProps) {
  return (
    <nav className="sidebar">
      {SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.section}
          type="button"
          className={
            item.section === activeSection ? "sidebar__item sidebar__item--active" : "sidebar__item"
          }
          onClick={() => onSelect(item.section)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
