import { User } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const ProfileView = () => {
  const [voiceClone, setVoiceClone] = useState(false);

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
            <div className="text-3xl font-extrabold text-primary">24</div>
            <div className="text-xs text-muted-foreground mt-1">Learned Phrases</div>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center">
            <div className="text-3xl font-extrabold text-primary">142</div>
            <div className="text-xs text-muted-foreground mt-1">Words Spoken</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
