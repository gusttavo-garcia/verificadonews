import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "vn-cookie-consent";

type ConsentValue = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(CONSENT_KEY) as ConsentValue;
      if (stored === "accepted" || stored === "rejected") {
        setConsent(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      // ignore
    }
    setConsent("accepted");
  };

  const handleReject = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "rejected");
    } catch {
      // ignore
    }
    setConsent("rejected");
  };

  if (!mounted || consent === "accepted" || consent === "rejected") {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Política de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80 md:p-5"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Política de cookies</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Utilizamos cookies para melhorar sua experiência, analisar o tráfego e personalizar
              conteúdo. Ao continuar navegando, você concorda com nossa{" "}
              <Link
                to="/privacidade"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="flex-1 md:flex-none"
          >
            <X className="mr-1.5 h-4 w-4" />
            Recusar
          </Button>
          <Button size="sm" onClick={handleAccept} className="flex-1 md:flex-none">
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
