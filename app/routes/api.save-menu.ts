import type { Route } from "./+types/api.save-menu";
import { saveMenu } from "~/lib/db.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { title, dishes } = await request.json();
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return Response.json({ error: "At least one dish is required" }, { status: 400 });
  }

  const menuTitle = title?.trim() || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const menu = saveMenu(menuTitle, dishes);
  return Response.json({ menu });
}
