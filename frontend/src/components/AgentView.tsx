import { useState, useRef, useEffect } from "react";
import { Bell, Sparkles, Bot, Send, Loader2, Phone, ShoppingBag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendAgentMessage, fetchReminders, AgentResponse, ReminderItem } from "@/lib/api";

interface Message {
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

// ── Action card sub-components ────────────────────────────────────────────────

function CallCard({ payload }: { payload: Record<string, unknown> }) {
  const telUri = payload.tel_uri as string;
  const contactName = payload.contact_name as string;
  const phoneNumber = payload.phone_number as string;
  return (
    <div className="mt-2 bg-background rounded-xl p-3 border border-border flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Phone size={12} />
        <span>{contactName || "Contact"}{phoneNumber ? ` · ${phoneNumber}` : ""}</span>
      </div>
      {telUri && telUri !== "tel:" ? (
        <a href={telUri}>
          <Button size="sm" className="w-full gap-2">
            <Phone size={14} />
            Call Now
          </Button>
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">No phone number found.</span>
      )}
    </div>
  );
}

function FoodCard({ payload }: { payload: Record<string, unknown> }) {
  const items = payload.items as Array<{ name: string; price: string }>;
  const total = payload.total as string;
  const eta = payload.eta as string;
  return (
    <div className="mt-2 bg-background rounded-xl p-3 border border-border space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShoppingBag size={12} />
        <span>Order Summary</span>
      </div>
      <div className="space-y-1">
        {items?.map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs text-foreground">
            <span>{item.name}</span>
            <span className="text-muted-foreground">{item.price}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs font-semibold text-foreground border-t border-border pt-2">
        <span>Total</span>
        <span>{total}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock size={10} />
        <span>ETA: {eta}</span>
      </div>
    </div>
  );
}

function ReminderCard({ payload }: { payload: Record<string, unknown> }) {
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
  const [messages, setMessages] = useState<Message[]>([
    {
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

  // Auto-send pending message from AAC board
  useEffect(() => {
    if (pendingMessage) {
      handleSend(pendingMessage);
      onPendingConsumed?.();
    }
  }, [pendingMessage]);

  const refreshReminders = () => {
    fetchReminders().then(setReminders);
  };

  const handleSend = async (text: string = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const agentResponse = await sendAgentMessage(trimmed, location);

    const agentMsg: Message = {
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
            <div key={r.id} className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0 text-xs">
                {r.time || "Anytime"}
              </Badge>
              <span className="text-sm text-foreground">{r.text}</span>
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
            {messages.map((msg, i) => (
              <div
                key={i}
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
