import { useState, useRef, useEffect } from "react";
import { Bell, Sparkles, Bot, Send, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendAgentMessage, fetchReminders, deleteReminder, AgentResponse, ReminderItem } from "@/lib/api";
import { CallCard } from "@/components/agent/CallCard";
import { FoodCard } from "@/components/agent/FoodCard";
import { ReminderCard } from "@/components/agent/ReminderCard";

interface Message {
  id: number;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
  agentResponse?: AgentResponse;
}

interface AgentViewProps {
  location: string;
  pendingMessage?: string | null;
  onPendingConsumed?: () => void;
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function AgentBubble({ msg }: { msg: Message }) {
  const r = msg.agentResponse;
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex flex-col gap-0.5 items-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground">
        {msg.text}
        {r?.action_type === "make_call" && <CallCard payload={r.action_payload} />}
        {r?.action_type === "order_food" && <FoodCard payload={r.action_payload} />}
        {r?.action_type === "set_reminder" && <ReminderCard payload={r.action_payload} />}
      </div>
      <span className="text-xs text-muted-foreground px-1">{fmt(msg.timestamp)}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Call mom",
  "Order a pizza",
  "Remind me to take medication at 9 AM",
];

const AgentView = ({ location, pendingMessage, onPendingConsumed }: AgentViewProps) => {
  // Monotonically increasing ID counter for stable message keys
  const nextMsgId = useRef(1);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "agent",
      text: "Hi! I can make calls, order food, set reminders, or just chat. How can I help?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReminders().then(setReminders);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshReminders = () => {
    fetchReminders().then(setReminders);
  };

  const handleSend = async (text: string = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: nextMsgId.current++, role: "user", text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const agentResponse = await sendAgentMessage(trimmed, location);

    const agentMsg: Message = {
      id: nextMsgId.current++,
      role: "agent",
      text: agentResponse.reply,
      timestamp: new Date(),
      agentResponse,
    };
    setMessages((prev) => [...prev, agentMsg]);
    setLoading(false);

    if (agentResponse.action_type === "set_reminder") {
      refreshReminders();
    }
  };

  // Keep a ref to the latest handleSend so the pending-message effect always
  // calls the current closure without adding handleSend to its dep array
  // (which would cause infinite re-runs since it's not memoised).
  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  // Auto-send pending message from AAC board
  useEffect(() => {
    if (pendingMessage) {
      handleSendRef.current(pendingMessage);
      onPendingConsumed?.();
    }
  }, [pendingMessage, onPendingConsumed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">

      {/* ── Reminders ─────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-primary" />
          <span className="font-semibold text-foreground text-sm">Reminders</span>
        </div>
        <div className="space-y-2">
          {reminders.length === 0 && (
            <span className="text-xs text-muted-foreground">No reminders yet. Ask the agent to set one!</span>
          )}
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {r.time || "Anytime"}
                </Badge>
                <span className="text-sm text-foreground truncate">{r.text}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-7"
                onClick={async () => {
                  await deleteReminder(r.id);
                  refreshReminders();
                }}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Proactive Suggestions ──────────────────────────────────────────── */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" />
          <span className="font-semibold text-foreground text-sm">Suggestions</span>
        </div>
        {SUGGESTIONS.map((s) => (
          <div key={s} className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground">{s}</span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-xs h-7"
              onClick={() => handleSend(s)}
            >
              Do it
            </Button>
          </div>
        ))}
      </div>

      {/* ── Agent Chat ────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border flex flex-col" style={{ minHeight: 320 }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Bot size={16} className="text-primary" />
          <span className="font-semibold text-foreground text-sm">Agent</span>
        </div>

        <ScrollArea className="flex-1 px-4 py-3" style={{ maxHeight: 300 }}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {msg.role === "agent" ? (
                  <AgentBubble msg={msg} />
                ) : (
                  <>
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-br-sm">
                      {msg.text}
                    </div>
                    <span className="text-xs text-muted-foreground px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-sm px-4 py-2 text-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="flex items-end gap-2 px-4 py-3 border-t border-border">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your agent anything…"
            className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentView;
