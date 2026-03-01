import { User } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { fetchAnalyticsSummary, type AnalyticsSummary } from "@/lib/api";

const ProfileView = () => {
  const [voiceClone, setVoiceClone] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    fetchAnalyticsSummary().then(setSummary);
  }, []);

  return (
    <div className="flex-1 overflow-auto p-4 space-y-5">
      {/* Avatar & Name */}
      <div className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <User size={32} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Alex</h2>
          <p className="text-sm text-muted-foreground">AAC User</p>
        </div>
      </div>

      {/* Voice Mode */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Voice Mode</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {voiceClone ? "Voice Clone Mode" : "Standard TTS"}
            </p>
          </div>
          <Switch checked={voiceClone} onCheckedChange={setVoiceClone} />
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-semibold text-foreground mb-3">This Week</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-lg p-4 text-center">
            <div className="text-3xl font-extrabold text-primary">
              {summary ? summary.total_phrases : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Phrases Logged</div>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center">
            <div className="text-3xl font-extrabold text-primary">
              {summary ? `${Math.round(summary.acceptance_rate * 100)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">AI Accept Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
