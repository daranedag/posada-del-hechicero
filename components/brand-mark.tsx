import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-10 rotate-45 place-items-center rounded-[0.7rem] border border-copper/55 bg-primary text-primary-foreground shadow-sm",
        className,
      )}
    >
      <Sparkles className="size-5 -rotate-45" strokeWidth={1.7} />
    </span>
  );
}
