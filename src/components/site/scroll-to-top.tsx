import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 300);
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <Button
      type="button"
      size="icon"
      aria-label="Voltar ao topo"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full shadow-lg transition hover:scale-105"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
