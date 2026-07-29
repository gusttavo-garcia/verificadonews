import { createFileRoute, redirect } from "@tanstack/react-router";
import { getRedirectTarget } from "@/lib/splitter.functions";

export const Route = createFileRoute("/r/$folder")({
  loader: async ({ params }) => {
    try {
      const res = await getRedirectTarget({ data: { folderSlug: params.folder } });
      if (res?.targetPath) {
        throw redirect({ href: res.targetPath, statusCode: 302 });
      }
    } catch (e: any) {
      if (e && typeof e === "object" && "statusCode" in e) {
        throw e;
      }
      throw redirect({ to: "/", statusCode: 302 });
    }
    throw redirect({ to: "/", statusCode: 302 });
  },
});