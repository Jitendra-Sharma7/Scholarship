"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemeSetting = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ResolvedTheme;
  setting: ThemeSetting;
  setTheme: (setting: ThemeSetting) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "gs-theme";

function getStoredSetting(): ThemeSetting {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeSetting | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // fall through to system default
  }
  return "system";
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [setting, setSetting] = useState<ThemeSetting>(getStoredSetting);
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  const toggleTheme = useCallback(() => {
    setSetting((current) =>
      current === "light" ? "dark" : current === "dark" ? "system" : "light",
    );
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (next: ResolvedTheme) => {
      setResolved(next);
      root.setAttribute("data-theme", next);
    };

    const recompute = () => {
      apply(
        setting === "system"
          ? media.matches ? "dark" : "light"
          : setting,
      );
    };

    recompute();

    const persist = () => {
      try {
        localStorage.setItem(STORAGE_KEY, setting);
      } catch {
        // storage unavailable: keep in-memory only
      }
    };

    persist();
    media.addEventListener("change", recompute);
    return () => media.removeEventListener("change", recompute);
  }, [setting]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: resolved, setting, setTheme: setSetting, toggleTheme }),
    [resolved, setting, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
