import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createEmptyDraft } from "@/lib/articles.functions";

export const Route = createFileRoute("/_authenticated/painel/novo")({
  component: NovoArtigoPage,
  head: () => ({ meta: [{ title: "Novo rascunho — Painel" }] }),
});

function NovoArtigoPage() {
  const navigate = useNavigate();
  const createDraft = useServerFn(createEmptyDraft);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createDraft()
      .then(({ id }) => {
        navigate({ to: "/painel/editar/$id", params: { id }, replace: true });
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Não foi possível criar o rascunho.");
        navigate({ to: "/painel", replace: true });
      });
  }, [createDraft, navigate]);

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <span className="sr-only" role="status" aria-live="polite">
        Criando rascunho…
      </span>
    </div>
  );
}
