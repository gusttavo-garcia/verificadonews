import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { ListingPage } from "@/components/site/listing-page";

export const Route = createFileRoute("/fake-news")({
  component: () => (
    <ListingPage
      title="Fake News desmentidas"
      subtitle="Boatos, imagens manipuladas e notícias falsas checadas com evidências e fontes oficiais."
      icon={<Newspaper className="h-6 w-6" />}
      filter={(a) => a.verdict === "falso" || a.verdict === "enganoso"}
    />
  ),
  head: () => pageHead({
    title: "Fake News desmentidas — Verificado News",
    description: "Boatos, imagens manipuladas e notícias falsas checadas pelo Verificado News com evidências, fontes oficiais e explicação do que é verdade.",
    path: "/fake-news",
  }),
});