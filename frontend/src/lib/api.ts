const BASE_URL = "http://localhost:8000";

export async function fetchSuggestions(location: string, partial: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/suggestions?location=${encodeURIComponent(location)}&partial=${encodeURIComponent(partial)}`);
    if (!res.ok) throw new Error("Failed to fetch suggestions");
    const data = await res.json();
    // Backend returns { predictions: string[], source: string }
    return data.predictions ?? data;
  } catch {
    return ["I want water", "Good morning", "Can you help me?"];
  }
}

export async function fetchLLMSuggest(partial: string, location: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/llm_suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partial_input: partial, location }),
  });
  if (!res.ok) throw new Error("LLM suggest failed");
  const data = await res.json();
  return data.suggestions ?? data;
}

export async function logPhrase(phrase: string, location: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/log_phrase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase, location }),
    });
  } catch {
    // silent fail
  }
}

export async function logAccepted(suggestion: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/autocomplete/accepted`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggested_phrase: suggestion }),
    });
  } catch {
    // silent fail
  }
}


export async function logDismissed(suggestion: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/autocomplete/dismissed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggested_phrase: suggestion }),
    });
  } catch {
    // silent fail
  }
}

export async function speakText(text: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("TTS failed");
  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("audio/")) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Audio playback failed")); };
      audio.play().catch(reject);
    });
  }
  // offline mode: backend speaks via system TTS; nothing for the browser to play
}

export interface HeatmapEntry {
  word: string;
  count: number;
}

export interface AnalyticsSummary {
  total_phrases: number;
  total_suggestions: number;
  acceptance_rate: number;
  top_phrases: string[];
  top_locations: Record<string, number>;
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const res = await fetch(`${BASE_URL}/analytics/summary`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return { total_phrases: 0, acceptance_rate: 0, top_phrases: [], top_locations: {} };
  }
}

export async function fetchHeatmap(): Promise<HeatmapEntry[]> {
  try {
    const res = await fetch(`${BASE_URL}/analytics/heatmap`);
    if (!res.ok) throw new Error("Failed");
    const body = await res.json();
    return body.data ?? body;
  } catch {
    // Return mock data for demo
    return [
      { word: "I", count: 120 }, { word: "want", count: 95 }, { word: "water", count: 80 },
      { word: "help", count: 72 }, { word: "yes", count: 65 }, { word: "no", count: 60 },
      { word: "bathroom", count: 55 }, { word: "eat", count: 50 }, { word: "please", count: 48 },
      { word: "thank you", count: 45 }, { word: "more", count: 40 }, { word: "stop", count: 38 },
      { word: "go", count: 35 }, { word: "happy", count: 30 }, { word: "sad", count: 28 },
      { word: "mom", count: 25 }, { word: "dad", count: 22 }, { word: "love", count: 20 },
      { word: "play", count: 18 }, { word: "home", count: 15 },
    ];
  }
}

export interface AgentResponse {
  reply: string;
  action_type: "make_call" | "order_food" | "set_reminder" | "general_chat";
  action_payload: Record<string, unknown>;
}

export interface ReminderItem {
  id: number;
  text: string;
  time: string;
  created_at: string;
}

export async function sendAgentMessage(
  message: string,
  location: string
): Promise<AgentResponse> {
  try {
    const res = await fetch(`${BASE_URL}/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, location }),
    });
    if (!res.ok) throw new Error("Agent request failed");
    return (await res.json()) as AgentResponse;
  } catch {
    return {
      reply: "I'm offline right now. Please try again later.",
      action_type: "general_chat",
      action_payload: {},
    };
  }
}

export async function fetchReminders(): Promise<ReminderItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/reminders`);
    if (!res.ok) throw new Error("Failed to fetch reminders");
    const data = await res.json();
    return (data.reminders ?? []) as ReminderItem[];
  } catch {
    return [];
  }
}

export async function deleteReminder(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface AppConfig {
  locations: string[];
  default_location: string;
  tts_mode: string;
}

export async function fetchConfig(): Promise<AppConfig> {
  try {
    const res = await fetch(`${BASE_URL}/config`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return { locations: ["Home", "School", "Hospital", "Work"], default_location: "Home", tts_mode: "offline" };
  }
}
