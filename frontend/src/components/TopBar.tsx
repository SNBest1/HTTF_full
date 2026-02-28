import { MapPin, Settings } from "lucide-react";

interface TopBarProps {
  location: string;
  time: string;
  onSettingsClick?: () => void;
}

const TopBar = ({ location, time, onSettingsClick }: TopBarProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin size={18} className="text-primary" />
        <span className="font-medium text-foreground">{location}</span>
        <span className="text-sm">— {time}</span>
      </div>
      <button
        onClick={onSettingsClick}
        className="p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Settings"
      >
        <Settings size={20} className="text-muted-foreground" />
      </button>
    </div>
  );
};

export default TopBar;
