"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pdh-theme";

export function ThemeToggle({ className }: { className?: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");

    root.style.colorScheme = isDark ? "dark" : "light";
    window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema claro u oscuro"
      title="Cambiar tema"
      className={cn(
        "grid size-10 place-items-center rounded-full border border-foreground/15 bg-card text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-copper/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Moon className="size-4.5 dark:hidden" />
      <Sun className="hidden size-4.5 dark:block" />
    </button>
  );
}
