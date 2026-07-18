import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar({
  defaultValue = "",
  className = "",
}: {
  defaultValue?: string;
  className?: string;
}) {
  const [q, setQ] = useState(defaultValue);
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/pesquisar", search: { q } as never });
      }}
      className={`mx-auto flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-border bg-background p-1.5 shadow-sm ${className}`}
    >
      <div className="flex flex-1 items-center gap-3 px-4">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Essa notícia é verdadeira?"
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Button type="submit" className="rounded-full px-6">
        Verificar
      </Button>
    </form>
  );
}