import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ListingPage } from "@/components/site/listing-page";

export const Route = createFileRoute("/empresas")({
  component: () => (
    <ListingPage
      title="Empresas verificadas"
      subtitle="Consulte se uma empresa é confiável antes de fechar negócio ou fazer uma compra online."
      icon={<Building2 className="h-6 w-6" />}
      filter={(a) => a.type === "empresa"}
    />
  ),
  head: () => ({ meta: [{ title: "Empresas verificadas — Verificado News" }] }),
});