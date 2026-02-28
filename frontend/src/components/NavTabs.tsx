import { Grid3X3, BarChart3, User } from "lucide-react";

export type TabId = "aac" | "analytics" | "profile";

interface NavTabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "aac", label: "AAC Board", icon: <Grid3X3 size={20} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
  { id: "profile", label: "Profile", icon: <User size={20} /> },
];

const NavTabs = ({ active, onChange }: NavTabsProps) => {
  return (
    <div className="flex border-t border-border bg-card">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors
            ${active === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default NavTabs;
