import { cn } from "@/lib/utils";
import { verdictLabel, type Verdict } from "@/lib/mock-data";

const styles: Record<Verdict, string> = {
  verificado: "bg-[color:var(--brand-teal)]/15 text-[color:var(--brand-teal)]",
  falso: "bg-primary/15 text-primary",
  enganoso: "bg-[color:var(--brand-yellow)]/40 text-[oklch(0.35_0.08_60)]",
  parcial: "bg-[color:var(--brand-yellow)]/40 text-[oklch(0.35_0.08_60)]",
  apuracao: "bg-muted text-muted-foreground",
};

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        styles[verdict],
        className,
      )}
    >
      {verdictLabel[verdict]}
    </span>
  );
}