import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { ListingPage } from "@/components/site/listing-page";

export const Route = createFileRoute("/golpes")({
  component: () => (
    <ListingPage
      title="Golpes verificados"
      subtitle="Fique atento aos golpes e fraudes identificados pela nossa equipe de verificação e proteja-se."
      icon={<AlertTriangle className="h-6 w-6" />}
      filter={(a) => a.type === "golpe" || (a.type === "empresa" && a.verdict === "falso")}
    />
  ),
  head: () => pageHead({
    title: "Golpes verificados — Verificado News",
    description: "Golpes e fraudes identificados pela equipe do Verificado News: PIX, WhatsApp, falsos prêmios, lojas fantasma e outras armadilhas online.",
    path: "/golpes",
  }),
});