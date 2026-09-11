"use client";

import { useLayoutEffect } from "react";

export function ThemeInitializer() {
  useLayoutEffect(() => {
    let savedTheme: string | null = null;
    try {
      savedTheme = window.localStorage.getItem("pdh-theme");
    } catch {
      // Use the system preference when browser storage is unavailable.
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, []);

  return null;
}
