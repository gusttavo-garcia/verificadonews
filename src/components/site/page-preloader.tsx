import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function PagePreloader() {
  const isPending = useRouterState({
    select: (s) => s.status === "pending",
  });

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isPending) {
      const t = setTimeout(() => setShow(true), 120);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [isPending]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando página"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200"
    >
      <div className="relative mb-2 flex items-end gap-2">
        <Search
          className="absolute -left-10 -top-7 h-6 w-6 text-muted-foreground"
          style={{
            animation: "preloader-bounce 0.8s infinite ease-in-out both",
            animationDelay: "0.08s",
          }}
        />
        <span
          className="h-4 w-4 rounded-full bg-[#e96052]"
          style={{
            animation: "preloader-bounce 0.8s infinite ease-in-out both",
            animationDelay: "0s",
          }}
        />
        <span
          className="h-4 w-4 rounded-full bg-[#eed977]"
          style={{
            animation: "preloader-bounce 0.8s infinite ease-in-out both",
            animationDelay: "0.16s",
          }}
        />
        <span
          className="h-4 w-4 rounded-full bg-[#2f9e8d]"
          style={{
            animation: "preloader-bounce 0.8s infinite ease-in-out both",
            animationDelay: "0.32s",
          }}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Carregando...
      </p>
    </div>
  );
}
