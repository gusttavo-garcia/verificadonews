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
      <Search
        className="h-10 w-10 text-[#e96052]"
        style={{
          animation: "preloader-bounce 0.8s infinite ease-in-out both",
        }}
      />
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Carregando...
      </p>
    </div>
  );
}
