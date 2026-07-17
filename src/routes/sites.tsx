import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { ListingPage } from "@/components/site/listing-page";

export const Route = createFileRoute("/sites")({
  component: () => (
    <ListingPage
      title="Sites verificados"
      subtitle="Descubra quais sites são seguros e quais aplicam golpes com domínios clonados e ofertas falsas."
      icon={<Globe className="h-6 w-6" />}
      filter={(a) => a.type === "site"}
    />
  ),
  head: () => ({ meta: [{ title: "Sites verificados — Verificado News" }] }),
});