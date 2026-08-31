import type { LucideIcon } from "lucide-react";

export function PageHero({
  kicker,
  title,
  description,
  icon: Icon,
}: {
  kicker: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section className="border-b border-foreground/10 bg-[#132a23] text-[#f6ecda]">
      <div className="pdh-container grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#dc9666]">
            <Icon className="size-4" /> {kicker}
          </p>
          <h1 className="mt-4 max-w-4xl text-balance text-5xl leading-[0.94] sm:text-6xl">{title}</h1>
        </div>
        <p className="max-w-lg text-sm leading-7 text-white/62 sm:text-base">{description}</p>
      </div>
    </section>
  );
}
