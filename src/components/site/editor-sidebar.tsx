import { Link } from "@tanstack/react-router";
import { FileText, LayoutDashboard, PenLine, Plus } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

type Props = {
  /** Rótulo do estado atual, ex.: "Novo artigo" ou "Editando artigo" */
  currentLabel: string;
  userLabel?: string | null;
  roleLabel?: string;
};

export function EditorSidebar({ currentLabel, userLabel, roleLabel }: Props) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" className="flex items-center gap-2 px-2">
        <img src={logo} alt="Verificado News" className="h-8 w-auto object-contain" />
      </Link>

      <Button className="w-full justify-start" asChild>
        <Link to="/painel/novo">
          <Plus className="mr-2 h-4 w-4" /> Novo rascunho
        </Link>
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          <PenLine className="h-4 w-4 shrink-0" />
          <span className="truncate">{currentLabel}</span>
          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />
        </div>
        <Link
          to="/painel"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" /> Dashboard
        </Link>
        <Link
          to="/painel"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <FileText className="h-4 w-4 shrink-0" /> Artigos
        </Link>
      </nav>

      <div className="border-t border-border pt-3 text-xs text-muted-foreground">
        {userLabel && <div className="truncate font-medium text-foreground">{userLabel}</div>}
        {roleLabel}
      </div>
    </div>
  );
}
