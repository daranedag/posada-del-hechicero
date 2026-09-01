import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo.png"
      alt=""
      aria-hidden="true"
      width={236}
      height={210}
      className={cn(
        "h-16 w-auto object-contain drop-shadow-[0_8px_16px_hsl(var(--primary)/0.22)]",
        className,
      )}
    />
  );
}
