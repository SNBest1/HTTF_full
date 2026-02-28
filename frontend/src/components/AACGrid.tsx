import { aacButtons, categoryColors } from "@/lib/aac-data";

interface AACGridProps {
  onButtonPress: (label: string) => void;
}

const AACGrid = ({ onButtonPress }: AACGridProps) => {
  return (
    <div className="flex-1 overflow-auto px-2 py-2">
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: "repeat(11, 1fr)",
          gridTemplateRows: "repeat(6, 1fr)",
        }}
      >
        {aacButtons.map((btn, i) => {
          const colors = categoryColors[btn.category];
          return (
            <button
              key={i}
              onClick={() => onButtonPress(btn.label)}
              className={`aac-grid-btn ${colors.bg} ${colors.border} border`}
              aria-label={btn.label}
            >
              <span className="text-2xl leading-none">{btn.emoji}</span>
              <span className={`text-xs font-semibold mt-1 ${colors.text} truncate max-w-full px-1`}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AACGrid;
