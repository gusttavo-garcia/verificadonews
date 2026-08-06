import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { ListingPage } from "@/components/site/listing-page";

export const Route = createFileRoute("/noticias")({
  component: () => (
    <ListingPage
      title="Notícias verificadas"
      subtitle="Notícias reais e checadas pela nossa equipe de jornalismo e fact-checking."
      icon={<Newspaper className="h-6 w-6" />}
      filter={(a) => a.type === "noticia"}
    />
  ),
  head: () => pageHead({
    title: "Notícias verificadas — Verificado News",
    description: "Notícias verificadas e checadas pelo Verificado News: informação confiável, com fontes e contexto para você entender os fatos.",
    path: "/noticias",
  }),
});
