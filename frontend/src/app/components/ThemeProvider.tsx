import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeColor = 'peach' | 'lavender' | 'blue' | 'beige';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  color: ThemeColor;
  mode: ThemeMode;
  setColor: (color: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = {
  peach: {
    light: {
      gradient: 'linear-gradient(135deg, #FFB5A7, #FCD5CE)',
      primary: '#FFB5A7',
      secondary: '#FCD5CE',
      accent: '#F8AD9D',
      background: '#FFF5F3',
      surface: '#FFFFFF',
      text: '#4A3933',
      textSecondary: '#8B7D77',
    },
    dark: {
      gradient: 'linear-gradient(135deg, #D4837A, #6B5953)',
      primary: '#D4837A',
      secondary: '#6B5953',
      accent: '#C67366',
      background: '#2A2220',
      surface: '#3D3330',
      text: '#F5EBE8',
      textSecondary: '#C4B5B0',
    },
  },
  lavender: {
    light: {
      gradient: 'linear-gradient(135deg, #C4B5FD, #E9D5FF)',
      primary: '#C4B5FD',
      secondary: '#E9D5FF',
      accent: '#A78BFA',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#3D3348',
      textSecondary: '#7C6F8C',
    },
    dark: {
      gradient: 'linear-gradient(135deg, #9F7AEA, #5A4A6B)',
      primary: '#9F7AEA',
      secondary: '#5A4A6B',
      accent: '#8B5CF6',
      background: '#1F1B29',
      surface: '#2E2838',
      text: '#F3EFF7',
      textSecondary: '#C4B8D1',
    },
  },
  blue: {
    light: {
      gradient: 'linear-gradient(135deg, #93C5FD, #DBEAFE)',
      primary: '#93C5FD',
      secondary: '#DBEAFE',
      accent: '#60A5FA',
      background: '#F0F9FF',
      surface: '#FFFFFF',
      text: '#1E3A5F',
      textSecondary: '#64748B',
    },
    dark: {
      gradient: 'linear-gradient(135deg, #6BA3D9, #4A5A6B)',
      primary: '#6BA3D9',
      secondary: '#4A5A6B',
      accent: '#5B9DD9',
      background: '#1A2332',
      surface: '#283548',
      text: '#E8F2FF',
      textSecondary: '#B8D0E8',
    },
  },
  beige: {
    light: {
      gradient: 'linear-gradient(135deg, #D4C5B9, #E8DDD1)',
      primary: '#D4C5B9',
      secondary: '#E8DDD1',
      accent: '#B8A490',
      background: '#FAF7F3',
      surface: '#FFFFFF',
      text: '#4A433A',
      textSecondary: '#7C746A',
    },
    dark: {
      gradient: 'linear-gradient(135deg, #A89885, #5A5349)',
      primary: '#A89885',
      secondary: '#5A5349',
      accent: '#9B8776',
      background: '#252218',
      surface: '#383229',
      text: '#F0EBE3',
      textSecondary: '#C9BFB3',
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('theme-color');
    return (saved as ThemeColor) || 'peach';
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-color', color);
    localStorage.setItem('theme-mode', mode);

    const theme = themes[color][mode];
    const root = document.documentElement;

    root.style.setProperty('--color-gradient', theme.gradient);
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);

    document.body.style.background = theme.gradient;
    document.body.style.color = theme.text;
  }, [color, mode]);

  return (
    <ThemeContext.Provider value={{ color, mode, setColor, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
