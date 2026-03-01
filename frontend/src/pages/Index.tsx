import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import SuggestionRow from "@/components/SuggestionRow";
import AACGrid from "@/components/AACGrid";
import BottomBar from "@/components/BottomBar";
import NavTabs, { type TabId } from "@/components/NavTabs";
import AnalyticsView from "@/components/AnalyticsView";
import ProfileView from "@/components/ProfileView";
import AgentView from "@/components/AgentView";
import SOSModal from "@/components/SOSModal";
import { fetchSuggestions, fetchLLMSuggest, logPhrase, logAccepted, logDismissed, speakText, fetchConfig } from "@/lib/api";
import type { Settings } from "@/components/SettingsMenu";

const Index = () => {
  const [tab, setTab] = useState<TabId>("aac");
  const [sentence, setSentence] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    "I want water",
    "Good morning",
    "Can you help me?",
  ]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  // Persist settings across sessions
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("aac_settings");
      return saved ? (JSON.parse(saved) as Settings) : { theme: "dark", dyslexia: false, highContrast: false };
    } catch {
      return { theme: "dark", dyslexia: false, highContrast: false };
    }
  });

  // Persist last-used location across sessions
  const [location, setLocation] = useState<string>(
    () => localStorage.getItem("aac_location") ?? "Home"
  );

  const [locations, setLocations] = useState<string[]>(["Home", "School", "Hospital", "Work"]);

  const [pendingAgentMessage, setPendingAgentMessage] = useState<string | null>(null);
  // Set to true after speak; consumed (and reset) on the very next word/suggestion press
  const justSpoke = useRef(false);

  // Fetch config from backend on mount; override default location only if nothing is persisted
  useEffect(() => {
    fetchConfig().then((cfg) => {
      setLocations(cfg.locations);
      if (!localStorage.getItem("aac_location")) {
        setLocation(cfg.default_location);
      }
    });
  }, []);

  // Apply settings to <html> element so CSS selectors can target them; persist to localStorage
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", settings.theme);
    if (settings.dyslexia) html.setAttribute("data-dyslexia", "");
    else html.removeAttribute("data-dyslexia");
    if (settings.highContrast) html.setAttribute("data-contrast", "high");
    else html.removeAttribute("data-contrast");
    localStorage.setItem("aac_settings", JSON.stringify(settings));
  }, [settings]);

  // Persist location whenever it changes
  useEffect(() => {
    localStorage.setItem("aac_location", location);
  }, [location]);

  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Re-fetch suggestions as the sentence or location changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(location, sentence).then(setSuggestions);
    }, 400);
    return () => clearTimeout(timer);
  }, [sentence, location]);

  const addWord = useCallback((word: string) => {
    const isPhrase = word.trim().includes(" ");
    if (justSpoke.current || isPhrase) {
      justSpoke.current = false;
      setSentence(word);
    } else {
      setSentence((s) => (s ? `${s} ${word}` : word));
    }
  }, []);

  const addSuggestion = useCallback((text: string) => {
    logAccepted(text);
    const isPhrase = text.trim().includes(" ");
    if (justSpoke.current || isPhrase) {
      justSpoke.current = false;
      setSentence(text);
    } else {
      setSentence((prev) => (prev ? `${prev} ${text}` : text));
    }
  }, [sentence, location]);

  const handleBackspace = useCallback(() => {
    setSentence((s) => {
      const words = s.trim().split(" ");
      words.pop();
      return words.join(" ");
    });
  }, []);

  const handleClear = useCallback(() => setSentence(""), []);

  const handleSendToAgent = useCallback(() => {
    if (!sentence.trim()) return;
    setPendingAgentMessage(sentence);
    setTab("agent");
    setSentence("");
    justSpoke.current = false;
  }, [sentence]);

  const handleAISuggest = useCallback(async () => {
    setLlmLoading(true);
    try {
      const results = await fetchLLMSuggest(sentence, location);
      setSuggestions(results);
    } finally {
      setLlmLoading(false);
    }
  }, [sentence, location]);

  const handleSpeak = useCallback(async () => {
    if (!sentence.trim()) return;
    try {
      await speakText(sentence);
    } catch {
      // fallback to browser TTS
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(sentence);
        speechSynthesis.speak(u);
      }
    }
    suggestions.forEach((s) => logDismissed(s));
    await logPhrase(sentence, location);
    justSpoke.current = true;
  }, [sentence, suggestions, location]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar
        location={location}
        locations={locations}
        onLocationChange={setLocation}
        time={time}
        settingsOpen={settingsOpen}
        onSettingsClick={() => setSettingsOpen((o) => !o)}
        onSOSClick={() => setSosOpen(true)}
        settings={settings}
        onSettingsChange={setSettings}
      />
      <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} />

      {tab === "aac" && (
        <>
          <div className="flex items-center">
            <SuggestionRow suggestions={suggestions} onSelect={addSuggestion} />
            <button
              onClick={handleAISuggest}
              disabled={llmLoading}
              className="shrink-0 mr-3 p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-40"
              aria-label="AI suggestions"
              title="Get AI suggestions (requires ollama)"
            >
              {llmLoading
                ? <Loader2 size={18} className="text-primary animate-spin" />
                : <Sparkles size={18} className="text-primary" />}
            </button>
          </div>
          <AACGrid onButtonPress={addWord} />
          <BottomBar
            sentence={sentence}
            onSentenceChange={setSentence}
            onSpeak={handleSpeak}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onSendToAgent={handleSendToAgent}
          />
        </>
      )}

      {tab === "analytics" && <AnalyticsView />}
      {tab === "profile" && <ProfileView />}
      {tab === "agent" && (
        <AgentView
          location={location}
          pendingMessage={pendingAgentMessage}
          onPendingConsumed={() => setPendingAgentMessage(null)}
        />
      )}

      <NavTabs active={tab} onChange={setTab} />
    </div>
  );
};

export default Index;
