import { useState, useEffect } from "react";
import { fetchConfig } from "@/lib/api";
import type { Settings } from "@/components/SettingsMenu";

const DEFAULT_SETTINGS: Settings = { theme: "dark", dyslexia: false, highContrast: false };
const DEFAULT_LOCATIONS = ["Home", "Coffee", "Work"];

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("aac_settings");
      return saved ? (JSON.parse(saved) as Settings) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [location, setLocation] = useState<string>(
    () => localStorage.getItem("aac_location") ?? "Home"
  );
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);

  useEffect(() => {
    fetchConfig().then((cfg) => {
      setLocations(cfg.locations);
      if (!localStorage.getItem("aac_location")) {
        setLocation(cfg.default_location);
      }
    });
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", settings.theme);
    if (settings.dyslexia) html.setAttribute("data-dyslexia", "");
    else html.removeAttribute("data-dyslexia");
    if (settings.highContrast) html.setAttribute("data-contrast", "high");
    else html.removeAttribute("data-contrast");
    localStorage.setItem("aac_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("aac_location", location);
  }, [location]);

  return { settings, setSettings, location, setLocation, locations };
}
