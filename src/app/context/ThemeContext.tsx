import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ThemeStyle = 'classic' | 'mesh';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
  toggleThemeStyle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    const saved = localStorage.getItem('themeStyle');
    if (saved === 'classic' || saved === 'mesh') return saved;
    return 'classic';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeStyle === 'mesh') {
      root.classList.add('theme-mesh');
    } else {
      root.classList.remove('theme-mesh');
    }
    localStorage.setItem('themeStyle', themeStyle);
  }, [themeStyle]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
  const toggleThemeStyle = () => setThemeStyle(s => (s === 'classic' ? 'mesh' : 'classic'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark', themeStyle, setThemeStyle, toggleThemeStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
