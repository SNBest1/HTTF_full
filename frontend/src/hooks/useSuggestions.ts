import { useState, useEffect } from "react";
import { fetchSuggestions } from "@/lib/api";

const DEFAULT_SUGGESTIONS = ["I want water", "Good morning", "Can you help me?"];

export function useSuggestions(location: string, sentence: string) {
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(location, sentence).then(setSuggestions);
    }, 400);
    return () => clearTimeout(timer);
  }, [sentence, location]);

  return { suggestions, setSuggestions };
}
