import { createFileRoute } from "@tanstack/react-router";
import { Video } from "lucide-react";
import { ListingPage } from "@/components/site/listing-page";

export const Route = createFileRoute("/videos")({
  component: () => (
    <ListingPage
      title="Vídeos analisados"
      subtitle="Vídeos verificados quadro a quadro para identificar deepfakes, edições e manipulações."
      icon={<Video className="h-6 w-6" />}
      filter={(a) => a.type === "video"}
    />
  ),
  head: () => ({ meta: [{ title: "Vídeos analisados — Verificado News" }] }),
});