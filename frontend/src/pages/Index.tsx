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
import { fetchSuggestions, fetchLLMSuggest, logPhrase, logAccepted, logDismissed, speakText } from "@/lib/api";
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
  const [settings, setSettings] = useState<Settings>({ theme: "dark", dyslexia: false, highContrast: false });
  // Set to true after speak; consumed (and reset) on the very next word/suggestion press
  const justSpoke = useRef(false);

  // Apply settings to <html> element so CSS selectors can target them
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", settings.theme);
    if (settings.dyslexia) html.setAttribute("data-dyslexia", "");
    else html.removeAttribute("data-dyslexia");
    if (settings.highContrast) html.setAttribute("data-contrast", "high");
    else html.removeAttribute("data-contrast");
  }, [settings]);

  const location = "Home";
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Re-fetch suggestions as the sentence changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(location, sentence).then(setSuggestions);
    }, 400);
    return () => clearTimeout(timer);
  }, [sentence]);

  const addWord = useCallback((word: string) => {
    if (justSpoke.current) {
      justSpoke.current = false;
      setSentence(word);
    } else {
      setSentence((s) => (s ? `${s} ${word}` : word));
    }
  }, []);

  const addSuggestion = useCallback((text: string) => {
    logAccepted(text, sentence, location);
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

  const handleAISuggest = useCallback(async () => {
    setLlmLoading(true);
    try {
      const results = await fetchLLMSuggest(sentence, location);
      setSuggestions(results);
    } finally {
      setLlmLoading(false);
    }
  }, [sentence]);

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
    suggestions.forEach((s) => logDismissed(s, sentence, location));
    await logPhrase(sentence, location);
    justSpoke.current = true;
  }, [sentence, suggestions]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar
        location={location}
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
            onSpeak={handleSpeak}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        </>
      )}

      {tab === "analytics" && <AnalyticsView />}
      {tab === "profile" && <ProfileView />}
      {tab === "agent" && <AgentView location={location} />}

      <NavTabs active={tab} onChange={setTab} />
    </div>
  );
};

export default Index;
