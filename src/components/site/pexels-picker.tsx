import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPexelsPhotos, type PexelsPhoto } from "@/lib/integrations.functions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (photo: PexelsPhoto) => void;
};

export function PexelsPicker({ open, onOpenChange, onSelect }: Props) {
  const searchFn = useServerFn(searchPexelsPhotos);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);

  const run = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await searchFn({ data: { query: query.trim(), page: 1 } });
      setPhotos(res.photos);
      if (res.photos.length === 0) toast.info("Nenhuma imagem encontrada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na busca");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Imagens gratuitas do Pexels</DialogTitle>
          <DialogDescription>
            Busque fotos livres de direitos e insira no artigo. O crédito ao fotógrafo é
            recomendado.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: celular, golpe, urna eletrônica…"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        <div className="max-h-[55vh] overflow-y-auto">
          {photos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Digite um termo e clique em buscar.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    onOpenChange(false);
                  }}
                  className="group overflow-hidden rounded-lg border border-border text-left transition hover:ring-2 hover:ring-primary"
                >
                  <img
                    src={p.thumb}
                    alt={p.alt}
                    loading="lazy"
                    className="h-32 w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="block truncate px-2 py-1 text-[11px] text-muted-foreground">
                    {p.photographer}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
