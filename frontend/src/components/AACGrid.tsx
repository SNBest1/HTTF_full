import { ChevronLeft, Home, ChevronRight } from "lucide-react";
import { categoryColors, folderColors, type Board } from "@/lib/aac-data";

interface AACGridProps {
  board: Board;
  canGoBack: boolean;
  onWordPress: (label: string) => void;
  onFolderPress: (boardId: string) => void;
  onBack: () => void;
  onHome: () => void;
}

const AACGrid = ({ board, canGoBack, onWordPress, onFolderPress, onBack, onHome }: AACGridProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
          aria-label="Back"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <h2 className="text-sm font-semibold text-foreground/80 truncate px-2">
          {board.title}
        </h2>
        <button
          onClick={onHome}
          disabled={!canGoBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
          aria-label="Home"
        >
          <Home size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-2 py-2">
        <div className="grid gap-1.5 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11">
          {board.cells.map((cell) => {
            if (cell.kind === "folder") {
              return (
                <button
                  key={`folder-${cell.boardId}`}
                  onClick={() => onFolderPress(cell.boardId)}
                  className={`aac-grid-btn relative ${folderColors.bg} ${folderColors.border} border`}
                  aria-label={`Open ${cell.label}`}
                >
                  <ChevronRight
                    size={12}
                    className="absolute top-1 right-1 text-primary/70"
                    aria-hidden
                  />
                  <span className="text-4xl leading-none">{cell.emoji}</span>
                  <span className={`text-[11px] font-semibold mt-1 ${folderColors.text} truncate max-w-full px-1`}>
                    {cell.label}
                  </span>
                </button>
              );
            }
            const colors = categoryColors[cell.category];
            return (
              <button
                key={`word-${cell.label}`}
                onClick={() => onWordPress(cell.label)}
                className={`aac-grid-btn ${colors.bg} ${colors.border} border`}
                aria-label={cell.label}
              >
                <span className="text-4xl leading-none">{cell.emoji}</span>
                <span className={`text-[11px] font-semibold mt-1 ${colors.text} truncate max-w-full px-1`}>
                  {cell.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AACGrid;
