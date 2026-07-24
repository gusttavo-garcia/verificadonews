import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  createComment,
  deleteComment,
  listComments,
} from "@/lib/comments.functions";

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function CommentsSection({ slug }: { slug: string }) {
  const { session, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const listFn = useServerFn(listComments);
  const createFn = useServerFn(createComment);
  const deleteFn = useServerFn(deleteComment);
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["comments", slug],
    queryFn: () => listFn({ data: { slug } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["comments", slug] });

  const mCreate = useMutation({
    mutationFn: () => createFn({ data: { slug, content: text.trim() } }),
    onSuccess: () => {
      setText("");
      toast.success("Comentário publicado.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Comentário removido.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const comments = data?.comments ?? [];

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-foreground">
        Comentários ({comments.length})
      </h2>

      <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4">
        {session ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              mCreate.mutate();
            }}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Deixe seu comentário construtivo..."
              rows={4}
              maxLength={2000}
              className="bg-background"
            />
            <div className="mt-3 flex justify-end">
              <Button type="submit" disabled={mCreate.isPending || !text.trim()}>
                Publicar comentário
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-start gap-3 py-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Para comentar, você precisa criar uma conta ou entrar.</p>
            <Link to="/auth">
              <Button size="sm">Entrar / Criar conta</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando comentários…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum comentário ainda. Seja o primeiro a comentar.
          </p>
        ) : (
          comments.map((c: any) => {
            const canDelete = isAdmin || c.is_own === true;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.author_name}</span>
                  <span>{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                  {c.content}
                </p>
                {canDelete && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Remover este comentário?")) mDelete.mutate(c.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}