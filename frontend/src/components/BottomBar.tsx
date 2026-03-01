import { Volume2, Delete, Trash2, Bot } from "lucide-react";
import { useState } from "react";

interface BottomBarProps {
  sentence: string;
  onSentenceChange: (text: string) => void;
  onSpeak: () => Promise<void>;
  onBackspace: () => void;
  onClear: () => void;
  onSendToAgent: () => void;
}

const BottomBar = ({ sentence, onSentenceChange, onSpeak, onBackspace, onClear, onSendToAgent }: BottomBarProps) => {
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
      <input
        type="text"
        value={sentence}
        onChange={(e) => onSentenceChange(e.target.value)}
        placeholder="Tap symbols or type here…"
        className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-sentence text-foreground font-medium text-lg outline-none placeholder:text-muted-foreground placeholder:italic placeholder:font-normal"
      />

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
        onClick={onSendToAgent}
        disabled={!sentence.trim()}
        className="shrink-0 p-3 rounded-xl bg-primary/20 hover:bg-primary/30 transition-colors disabled:opacity-40"
        aria-label="Send to Agent"
        title="Send to Agent"
      >
        <Bot size={22} className="text-primary" />
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
