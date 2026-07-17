import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const nav = [
  { to: "/", label: "Início" },
  { to: "/pesquisar", label: "Pesquisar" },
  { to: "/golpes", label: "Golpes" },
  { to: "/fake-news", label: "Fake News" },
  { to: "/empresas", label: "Empresas" },
  { to: "/sites", label: "Sites" },
  { to: "/videos", label: "Vídeos" },
  { to: "/categorias", label: "Categorias" },
] as const;

const institucional = [
  { to: "/sobre", label: "Sobre nós" },
  { to: "/metodologia", label: "Metodologia" },
  { to: "/transparencia", label: "Transparência" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [instOpen, setInstOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Verificado News" className="h-9 w-auto" />
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
              onClick={() => setInstOpen((v) => !v)}
            >
              Institucional <ChevronDown className="h-4 w-4" />
            </button>
            {instOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-popover p-2 shadow-lg">
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
            )}
          </div>
        </nav>

        <button
          className="rounded-md p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
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
          </div>
        </div>
      )}
    </header>
  );
}