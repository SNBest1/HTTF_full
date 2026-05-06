import { Bell } from "lucide-react";

export function ReminderCard({ payload }: { payload: Record<string, unknown> }) {
  const text = payload.text as string;
  const time = payload.time as string;
  return (
    <div className="mt-2 bg-background rounded-xl p-3 border border-border flex items-center gap-2">
      <Bell size={14} className="text-primary shrink-0" />
      <div>
        <div className="text-xs font-semibold text-foreground">Reminder set!</div>
        <div className="text-xs text-muted-foreground">{text}{time ? ` — ${time}` : ""}</div>
      </div>
    </div>
  );
}
