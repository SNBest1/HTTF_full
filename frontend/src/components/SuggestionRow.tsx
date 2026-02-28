import { Zap } from "lucide-react";

interface SuggestionRowProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

const SuggestionRow = ({ suggestions, onSelect }: SuggestionRowProps) => {
  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto">
      {suggestions.map((s, i) => (
        <button
          key={`${s}-${i}`}
          onClick={() => onSelect(s)}
          className="suggestion-pill flex items-center gap-2 whitespace-nowrap animate-fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <Zap size={14} className="shrink-0" />
          <span>{s}</span>
        </button>
      ))}
    </div>
  );
};

export default SuggestionRow;
