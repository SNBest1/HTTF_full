import { Volume2, Delete, Trash2 } from "lucide-react";
import { useState } from "react";

interface BottomBarProps {
  sentence: string;
  onSpeak: () => Promise<void>;
  onBackspace: () => void;
  onClear: () => void;
}

const BottomBar = ({ sentence, onSpeak, onBackspace, onClear }: BottomBarProps) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (!sentence.trim() || speaking) return;
    setSpeaking(true);
    try {
      await onSpeak();
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-card border-t border-border">
      <div className="flex-1 min-h-[44px] flex items-center px-4 py-2 rounded-xl bg-sentence text-foreground font-medium text-lg truncate">
        {sentence || <span className="text-muted-foreground italic">Tap symbols to build a sentence…</span>}
      </div>

      <button
        onClick={onBackspace}
        className="shrink-0 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
        aria-label="Backspace"
      >
        <Delete size={22} className="text-secondary-foreground" />
      </button>

      <button
        onClick={onClear}
        className="shrink-0 p-3 rounded-xl bg-destructive/20 hover:bg-destructive/30 transition-colors"
        aria-label="Clear"
      >
        <Trash2 size={22} className="text-destructive" />
      </button>

      <button
        onClick={handleSpeak}
        disabled={speaking || !sentence.trim()}
        className={`shrink-0 px-5 py-3 rounded-xl bg-speak font-bold text-speak-foreground flex items-center gap-2 
          transition-all disabled:opacity-40 ${speaking ? "speak-pulse" : "hover:brightness-110 active:scale-95"}`}
        aria-label="Speak"
      >
        <Volume2 size={22} />
        <span className="hidden sm:inline">{speaking ? "Speaking…" : "Speak"}</span>
      </button>
    </div>
  );
};

export default BottomBar;
