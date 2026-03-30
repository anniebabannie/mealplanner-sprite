import type { Route } from "./+types/api.delete-menu";
import { deleteMenu, getMenu } from "~/lib/db.server";
import { deleteImages } from "~/lib/storage.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { id } = await request.json();
  if (!id || typeof id !== "number") {
    return Response.json({ error: "Menu ID is required" }, { status: 400 });
  }

  const menu = getMenu(id);
  deleteMenu(id);
  if (menu) await deleteImages(menu.dishes.map((d) => d.image_url));
  return Response.json({ success: true });
}
