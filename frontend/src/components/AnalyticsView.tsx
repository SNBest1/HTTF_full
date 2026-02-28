import { useEffect, useState } from "react";
import { fetchHeatmap, fetchAnalyticsSummary, type HeatmapEntry, type AnalyticsSummary } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const AnalyticsView = () => {
  const [data, setData] = useState<HeatmapEntry[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    fetchHeatmap().then(setData);
    fetchAnalyticsSummary().then(setSummary);
  }, []);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const top5 = [...data].sort((a, b) => b.count - a.count).slice(0, 5);

  const getHeatColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return "hsl(0, 75%, 50%)";
    if (ratio > 0.6) return "hsl(25, 80%, 50%)";
    if (ratio > 0.4) return "hsl(45, 85%, 55%)";
    if (ratio > 0.2) return "hsl(174, 50%, 40%)";
    return "hsl(210, 30%, 30%)";
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <div className="text-2xl font-extrabold text-primary">{summary.total_phrases}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Phrases</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <div className="text-2xl font-extrabold text-primary">
                {Math.round(summary.acceptance_rate * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Acceptance Rate</div>
            </div>
          </div>
          {summary.top_phrases.length > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Top Phrases</div>
              <div className="flex flex-wrap gap-1.5">
                {summary.top_phrases.map((p) => (
                  <span key={p} className="suggestion-pill text-xs px-3 py-1">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Vocabulary Heatmap</h2>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
          {data.map((entry) => (
            <div
              key={entry.word}
              className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold text-foreground/90 cursor-default"
              style={{ backgroundColor: getHeatColor(entry.count) }}
              title={`${entry.word}: ${entry.count}`}
            >
              {entry.word}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Rare</span>
          <div className="flex gap-0.5">
            {["hsl(210,30%,30%)", "hsl(174,50%,40%)", "hsl(45,85%,55%)", "hsl(25,80%,50%)", "hsl(0,75%,50%)"].map((c) => (
              <div key={c} className="w-5 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span>Frequent</span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Top 5 Words</h2>
        <div className="bg-card rounded-xl p-4 border border-border" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top5} layout="vertical">
              <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis type="category" dataKey="word" stroke="hsl(215, 15%, 55%)" fontSize={13} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 18%, 14%)",
                  border: "1px solid hsl(220, 14%, 22%)",
                  borderRadius: 8,
                  color: "hsl(210, 40%, 96%)",
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {top5.map((_, i) => (
                  <Cell key={i} fill={`hsl(174, ${60 - i * 8}%, ${50 + i * 5}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
