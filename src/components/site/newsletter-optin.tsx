import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyNewsletterOptIn,
  setNewsletterOptIn,
} from "@/lib/comments.functions";

export function NewsletterOptIn() {
  const { session } = useAuth();
  const getFn = useServerFn(getMyNewsletterOptIn);
  const setFn = useServerFn(setNewsletterOptIn);
  const qc = useQueryClient();
  const [checked, setChecked] = useState(false);

  const { data } = useQuery({
    queryKey: ["newsletter-optin", session?.user?.id],
    queryFn: () => getFn(),
    enabled: !!session,
  });

  useEffect(() => {
    if (data) setChecked(data.optIn);
  }, [data]);

  const mutate = useMutation({
    mutationFn: (v: boolean) => setFn({ data: { optIn: v } }),
    onSuccess: (_r, v) => {
      toast.success(v ? "Você receberá nossas notícias por email." : "Preferência atualizada.");
      qc.invalidateQueries({ queryKey: ["newsletter-optin"] });
    },
    onError: (e) => {
      setChecked((c) => !c);
      toast.error(e instanceof Error ? e.message : "Erro");
    },
  });

  if (!session) return null;

  return (
    <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--brand-teal)]/30 bg-[color:var(--brand-teal)]/5 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[color:var(--brand-teal)]/15 p-2 text-[color:var(--brand-teal)]">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-foreground">Receber notícias por email</p>
          <p className="text-sm text-muted-foreground">
            Ative para receber as verificações mais recentes na sua caixa de entrada.
          </p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(v) => {
          setChecked(v);
          mutate.mutate(v);
        }}
        disabled={mutate.isPending}
      />
    </div>
  );
}