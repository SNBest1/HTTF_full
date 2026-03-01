import { MapPin, Settings, AlertTriangle } from "lucide-react";
import SettingsMenu, { type Settings as AppSettings } from "@/components/SettingsMenu";

interface TopBarProps {
  location: string;
  time: string;
  settingsOpen: boolean;
  onSettingsClick: () => void;
  onSOSClick: () => void;
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
}

const TopBar = ({ location, time, settingsOpen, onSettingsClick, onSOSClick, settings, onSettingsChange }: TopBarProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin size={18} className="text-primary" />
        <span className="font-medium text-foreground">{location}</span>
        <span className="text-sm">— {time}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onSOSClick}
          className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 transition-colors"
          aria-label="SOS Emergency"
        >
          <AlertTriangle size={20} className="text-destructive" />
        </button>
        <div className="relative">
          <button
            onClick={onSettingsClick}
            className={`p-2 rounded-lg transition-colors ${settingsOpen ? "bg-primary/20" : "hover:bg-secondary"}`}
            aria-label="Settings"
          >
            <Settings size={20} className={settingsOpen ? "text-primary" : "text-muted-foreground"} />
          </button>
          <SettingsMenu
            open={settingsOpen}
            settings={settings}
            onChange={onSettingsChange}
            onClose={onSettingsClick}
          />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
