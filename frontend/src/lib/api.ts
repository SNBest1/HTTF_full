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
      body: JSON.stringify({ phrase, location, timestamp: new Date().toISOString() }),
    });
  } catch {
    // silent fail
  }
}

export async function logAccepted(suggestion: string, partial: string, location: string): Promise<void> {
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


export async function logDismissed(suggestion: string, partial: string, location: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/autocomplete/dismissed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Change 'suggestion' to 'suggested_phrase' 
      // and remove partial/location to match AutocompleteRequest
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
}

export interface HeatmapEntry {
  word: string;
  count: number;
}

export interface AnalyticsSummary {
  total_phrases: number;
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
