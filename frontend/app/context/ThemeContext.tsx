"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { authApi } from '../lib/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const { userData, isLoggedIn, updateUserPreference } = useAppContext();

  // 1. Initial theme load from localStorage or media query
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.body.classList.add('dark-theme');
    }
  }, []);

  // 2. Synchronize theme with backend profile preferences when logged in
  useEffect(() => {
    if (isLoggedIn && userData?.preference?.theme) {
      const userTheme = userData.preference.theme as Theme;
      if (userTheme !== theme) {
        setTheme(userTheme);
        localStorage.setItem('app-theme', userTheme);
        document.body.classList.toggle('dark-theme', userTheme === 'dark');
      }
    }
  }, [userData, isLoggedIn]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.body.classList.toggle('dark-theme', newTheme === 'dark');

    // Sync theme update to backend if logged in
    if (isLoggedIn && userData) {
      try {
        await authApi.updateProfile({ theme: newTheme });
        updateUserPreference({ theme: newTheme });
      } catch (err) {
        console.error("Lỗi đồng bộ theme lên server:", err);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
