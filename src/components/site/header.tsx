import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Search, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "./theme-toggle";
import { useAuth, useIsStaff } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Início" },
  { to: "/golpes", label: "Golpes" },
  { to: "/fake-news", label: "Fake News" },
  { to: "/categorias", label: "Categorias" },
] as const;

const institucional = [
  { to: "/sobre", label: "Sobre nós" },
  { to: "/metodologia", label: "Metodologia" },
  { to: "/transparencia", label: "Transparência" },
  { to: "/contato", label: "Contato" },
] as const;

function HeaderSearch({ onSubmitted }: { onSubmitted?: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitted?.();
        navigate({ to: "/pesquisar", search: { q } as never });
      }}
      className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
      role="search"
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Pesquisar..."
        aria-label="Pesquisar verificações"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground lg:w-40"
      />
    </form>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [instOpen, setInstOpen] = useState(false);
  const { session, signOut, loading } = useAuth();
  const isStaff = useIsStaff();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logotipo Verificado News" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3 py-1.5 text-sm text-foreground/70 transition hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setInstOpen(true)}
            onMouseLeave={() => setInstOpen(false)}
          >
            <button
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-foreground/70 hover:bg-muted"
              aria-expanded={instOpen}
              aria-label="Abrir menu institucional"
              onClick={() => setInstOpen((v) => !v)}
            >
              Institucional <ChevronDown className="h-4 w-4" />
            </button>
            {instOpen && (
              <div className="absolute right-0 top-full w-52 pt-2">
                <div className="rounded-xl border border-border bg-popover p-2 shadow-lg">
                {institucional.map((i) => (
                  <Link
                    key={i.to}
                    to={i.to}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
                  >
                    {i.label}
                  </Link>
                ))}
                </div>
              </div>
            )}
          </div>
          <div className="ml-2">
            <HeaderSearch />
          </div>
          <ThemeToggle className="ml-1" />
          <div className="ml-2 flex items-center gap-2">
            {loading ? null : session ? (
              <>
                {isStaff && (
                  <Link to="/painel">
                    <Button size="sm" variant="outline">
                      <LayoutDashboard className="mr-1.5 h-4 w-4" /> Painel
                    </Button>
                  </Link>
                )}
                <Button size="sm" variant="ghost" onClick={() => void signOut()}>
                  <LogOut className="mr-1.5 h-4 w-4" /> Sair
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">
                  <LogIn className="mr-1.5 h-4 w-4" /> Entrar
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            className="rounded-md p-2"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu de navegação" : "Abrir menu de navegação"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <div className="pb-2">
              <HeaderSearch onSubmitted={() => setOpen(false)} />
            </div>
            {[...nav, ...institucional].map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
              >
                {i.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              {session ? (
                <>
                  {isStaff && (
                    <Link
                      to="/painel"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
                    >
                      Painel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setOpen(false);
                      void signOut();
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground/80 hover:bg-muted"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}