import { Moon, Sun, Laptop } from "lucide-react";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("tamva-theme") as Theme | null;
    return saved || "dark";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let isDark = false;
      if (theme === "system") {
        isDark = mediaQuery.matches;
      } else {
        isDark = theme === "dark";
      }

      if (isDark) {
        root.classList.add("dark");
        setResolvedTheme("dark");
      } else {
        root.classList.remove("dark");
        setResolvedTheme("light");
      }
    };

    applyTheme();
    localStorage.setItem("tamva-theme", theme);

    const listener = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className="inline-flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-0.5 text-xs select-none"
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
          theme === "light"
            ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        }`}
        title="Light Mode"
        aria-label="Light mode"
      >
        <Sun className="size-3.5" />
        <span className="hidden xl:inline text-xs">Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
          theme === "dark"
            ? "bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-sm font-semibold"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        }`}
        title="Dark Mode"
        aria-label="Dark mode"
      >
        <Moon className="size-3.5" />
        <span className="hidden xl:inline text-xs">Dark</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "system"}
        onClick={() => setTheme("system")}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
          theme === "system"
            ? "bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-sm font-semibold"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        }`}
        title="System Preference"
        aria-label="System theme preference"
      >
        <Laptop className="size-3.5" />
        <span className="hidden xl:inline text-xs">System</span>
      </button>
    </div>
  );
}
