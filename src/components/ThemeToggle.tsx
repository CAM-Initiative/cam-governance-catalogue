import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export type CamTheme = "light" | "dark";

const STORAGE_KEY = "cam-appearance";

function currentTheme(): CamTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<CamTheme>(() => currentTheme());

  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    window.addEventListener("cam-theme-change", sync);
    return () => window.removeEventListener("cam-theme-change", sync);
  }, []);

  const toggleTheme = () => {
    const nextTheme: CamTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent("cam-theme-change", { detail: nextTheme }));
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${isDark ? "light" : "dark"} appearance`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} appearance`}
      onClick={toggleTheme}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span className="sr-only">{isDark ? "Dark appearance active" : "Light appearance active"}</span>
    </button>
  );
}
