import { useEffect, useRef } from "react";
import type { AdSlot } from "@/lib/ads.functions";

function SingleAd({ slot }: { slot: AdSlot }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slot || !ref.current) return;
    ref.current.innerHTML = slot.code;
    // Re-executa scripts inline/externos do bloco (AdSense, GPT, etc.)
    ref.current.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value);
      s.text = old.textContent ?? "";
      old.replaceWith(s);
    });
  }, [slot?.id, slot?.code]);

  return (
    <div className="my-8">
      <div className="mb-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        Publicidade
      </div>
      <div ref={ref} className="flex min-h-[90px] w-full items-center justify-center overflow-hidden" />
    </div>
  );
}

export function AdBlock({ slots, position }: { slots: AdSlot[]; position: string }) {
  const active = slots.filter((s) => s.position === position && s.enabled && s.code.trim());
  if (active.length === 0) return null;
  return (
    <>
      {active.map((slot) => (
        <SingleAd key={slot.id} slot={slot} />
      ))}
    </>
  );
}
