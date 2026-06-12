"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ColorTheme = "blue" | "purple" | "green" | "orange";
type Mode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  colorTheme: ColorTheme;
  setColorTheme: (c: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => {},
  colorTheme: "blue",
  setColorTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("blue");

  // Sync React state from what the inline script already applied
  useEffect(() => {
    const savedMode = localStorage.getItem("theme") as Mode | null;
    const savedColor = localStorage.getItem("colorTheme") as ColorTheme | null;
    if (savedMode) setModeState(savedMode);
    if (savedColor) setColorThemeState(savedColor);
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    localStorage.setItem("theme", m);
    document.documentElement.classList.toggle("dark", m === "dark");
  }, []);

  const setColorTheme = useCallback((c: ColorTheme) => {
    setColorThemeState(c);
    localStorage.setItem("colorTheme", c);
    if (c === "blue") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", c);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
