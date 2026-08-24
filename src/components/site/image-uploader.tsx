import { useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5 MB).");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("article-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("article-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 anos
      if (sErr || !signed) throw sErr ?? new Error("URL falhou");
      onChange(signed.signedUrl);
      toast.success("Imagem enviada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-muted">
          <img src={value} alt="Prévia" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow hover:bg-background"
            title="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-muted-foreground">
          <Upload className="mb-2 h-8 w-8 opacity-50" />
          <span className="text-xs">Nenhuma imagem selecionada</span>
        </div>
      )}
      <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
        <Upload className="h-4 w-4" />
        {uploading ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
