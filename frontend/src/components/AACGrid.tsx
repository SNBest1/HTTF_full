import { aacButtons, categoryColors } from "@/lib/aac-data";

interface AACGridProps {
  onButtonPress: (label: string) => void;
}

const AACGrid = ({ onButtonPress }: AACGridProps) => {
  return (
    <div className="flex-1 overflow-auto px-2 py-2">
      <div className="grid gap-1.5 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11">
        {aacButtons.map((btn, i) => {
          const colors = categoryColors[btn.category];
          return (
            <button
              key={i}
              onClick={() => onButtonPress(btn.label)}
              className={`aac-grid-btn ${colors.bg} ${colors.border} border`}
              aria-label={btn.label}
            >
              <span className="text-4xl leading-none">{btn.emoji}</span>
              <span className={`text-[11px] font-semibold mt-1 ${colors.text} truncate max-w-full px-1`}>
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
