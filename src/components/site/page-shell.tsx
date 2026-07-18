import type { ReactNode } from "react";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { SearchBar } from "./search-bar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  icon,
  showSearch = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  showSearch?: boolean;
}) {
  return (
    <section className="border-b border-border bg-[color:var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {showSearch && (
          <div className="mt-8">
            <SearchBar />
          </div>
        )}
      </div>
    </section>
  );
}