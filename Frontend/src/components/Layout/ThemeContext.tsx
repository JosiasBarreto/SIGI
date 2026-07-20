import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Palette = "default" | "theme-green";

interface ThemeContextType {
  theme: Theme;
  palette: Palette;
  toggleTheme: () => void;
  setPalette: (p: Palette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [palette, setPaletteState] = useState<Palette>("default");

  useEffect(() => {
    // Check local storage or system preference on mount
    const storedTheme = localStorage.getItem("theme") as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    const storedPalette = localStorage.getItem("palette") as Palette;
    if (storedPalette) {
      setPaletteState(storedPalette);
      if (storedPalette !== "default") {
        document.documentElement.classList.add(storedPalette);
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const setPalette = (newPalette: Palette) => {
    // Remove previous palette
    if (palette !== "default") {
      document.documentElement.classList.remove(palette);
    }
    
    setPaletteState(newPalette);
    localStorage.setItem("palette", newPalette);
    
    // Add new palette
    if (newPalette !== "default") {
      document.documentElement.classList.add(newPalette);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
