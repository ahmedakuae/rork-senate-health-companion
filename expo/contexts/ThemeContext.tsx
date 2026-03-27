import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { lightColors, darkColors, ThemeColors } from '@/constants/colors';

const THEME_KEY = 'sanad_theme';

export type ThemeMode = 'light' | 'dark';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') {
        setModeState(stored);
      }
      setIsLoaded(true);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(THEME_KEY, m);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
  }, [mode, setMode]);

  const isDark = mode === 'dark';

  const colors: ThemeColors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  return { mode, isDark, colors, toggleTheme, setMode, isLoaded };
});
