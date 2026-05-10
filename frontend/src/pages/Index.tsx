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
import { fetchLLMSuggest, logPhrase, logAccepted, logDismissed, speakText } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { useSuggestions } from "@/hooks/useSuggestions";
import { boards, ROOT_BOARD_ID } from "@/lib/aac-data";

const Index = () => {
  const [tab, setTab] = useState<TabId>("aac");
  const [sentence, setSentence] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [pendingAgentMessage, setPendingAgentMessage] = useState<string | null>(null);
  const [boardStack, setBoardStack] = useState<string[]>([ROOT_BOARD_ID]);
  const justSpoke = useRef(false);

  const currentBoardId = boardStack[boardStack.length - 1];
  const currentBoard = boards[currentBoardId] ?? boards[ROOT_BOARD_ID];

  const goToFolder = useCallback((boardId: string) => {
    setBoardStack((s) => [...s, boardId]);
  }, []);
  const goBack = useCallback(() => {
    setBoardStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);
  const goHome = useCallback(() => {
    setBoardStack([ROOT_BOARD_ID]);
  }, []);

  const { settings, setSettings, location, setLocation, locations } = useSettings();
  const { suggestions, setSuggestions } = useSuggestions(location, sentence);

  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

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
  }, []);

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
  }, [sentence, location, setSuggestions]);

  const handleSpeak = useCallback(async () => {
    if (!sentence.trim()) return;
    try {
      await speakText(sentence);
    } catch {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(sentence);
        speechSynthesis.speak(u);
      }
    }
    suggestions.forEach((s) => logDismissed(s));
    await logPhrase(sentence, location);
    justSpoke.current = true;
    setBoardStack([ROOT_BOARD_ID]);
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
          <AACGrid
            board={currentBoard}
            canGoBack={boardStack.length > 1}
            onWordPress={addWord}
            onFolderPress={goToFolder}
            onBack={goBack}
            onHome={goHome}
          />
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
