import { MapPin, Settings, AlertTriangle } from "lucide-react";
import SettingsMenu, { type Settings as AppSettings } from "@/components/SettingsMenu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TopBarProps {
  location: string;
  locations: string[];
  onLocationChange: (loc: string) => void;
  time: string;
  settingsOpen: boolean;
  onSettingsClick: () => void;
  onSOSClick: () => void;
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
}

const TopBar = ({ location, locations, onLocationChange, time, settingsOpen, onSettingsClick, onSOSClick, settings, onSettingsChange }: TopBarProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin size={14} className="text-primary shrink-0" />
        <Select value={location} onValueChange={onLocationChange}>
          <SelectTrigger className="h-7 w-auto border-none bg-transparent px-1 text-sm font-semibold text-foreground shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
