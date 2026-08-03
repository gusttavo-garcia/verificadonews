import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import logo from "@/assets/logo.png";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/verificadonews.com.br/?hl=pt-br" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[color:var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <img src={logo} alt="Logotipo Verificado News" className="h-10 w-auto" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Plataforma brasileira de checagem de fatos. Verificamos notícias, golpes, empresas
              e sites para combater a desinformação.
            </p>
          </div>
          <FooterCol
            title="Navegação"
            links={[
              { to: "/", label: "Início" },
              { to: "/pesquisar", label: "Pesquisar" },
              { to: "/golpes", label: "Golpes" },
              { to: "/fake-news", label: "Fake News" },
              { to: "/categorias", label: "Categorias" },
            ]}
          />
          <FooterCol
            title="Institucional"
            links={[
              { to: "/sobre", label: "Sobre nós" },
              { to: "/metodologia", label: "Metodologia" },
              { to: "/transparencia", label: "Transparência" },
              { to: "/contato", label: "Contato" },
            ]}
          />
          <div>
            <h4 className="text-sm font-semibold text-foreground">Redes sociais</h4>
            <div className="mt-4 flex gap-2">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Verificado News no ${label}`}
                  title={`Verificado News no ${label}`}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <h4 className="mt-6 text-sm font-semibold text-foreground">Contato</h4>
            <p className="mt-2 text-sm text-muted-foreground">contato@verificadonews.com.br</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Verificado News. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to="/privacidade">Política de Privacidade</Link>
            <Link to="/termos">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}