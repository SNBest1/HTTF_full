interface Settings {
  theme: "dark" | "light";
  dyslexia: boolean;
  highContrast: boolean;
}

interface SettingsMenuProps {
  open: boolean;
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}

const Toggle = ({
  label,
  left,
  right,
  active,
  onToggle,
}: {
  label: string;
  left: string;
  right: string;
  active: boolean;
  onToggle: () => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    <button
      onClick={onToggle}
      className="flex items-center rounded-lg border border-border bg-secondary overflow-hidden text-sm font-medium w-full"
    >
      <span className={`flex-1 py-2 text-center transition-colors ${!active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
        {left}
      </span>
      <span className={`flex-1 py-2 text-center transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
        {right}
      </span>
    </button>
  </div>
);

const SettingsMenu = ({ open, settings, onChange, onClose }: SettingsMenuProps) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-2xl p-4 w-64 space-y-4">
        <p className="text-sm font-bold text-foreground">Settings</p>

        <Toggle
          label="Theme"
          left="Dark"
          right="Light"
          active={settings.theme === "light"}
          onToggle={() => onChange({ ...settings, theme: settings.theme === "dark" ? "light" : "dark" })}
        />

        <Toggle
          label="Font"
          left="Normal"
          right="Dyslexia"
          active={settings.dyslexia}
          onToggle={() => onChange({ ...settings, dyslexia: !settings.dyslexia })}
        />

        <Toggle
          label="Contrast"
          left="Normal"
          right="High"
          active={settings.highContrast}
          onToggle={() => onChange({ ...settings, highContrast: !settings.highContrast })}
        />
      </div>
    </>
  );
};

export type { Settings };
export default SettingsMenu;
