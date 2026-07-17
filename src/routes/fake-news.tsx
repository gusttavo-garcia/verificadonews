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
  head: () => ({
    meta: [
      { title: "Fake News — Verificado News" },
      { name: "description", content: "Fake news e boatos checados pela equipe do Verificado News." },
    ],
  }),
});