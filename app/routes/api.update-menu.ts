import type { Route } from "./+types/api.update-menu";
import { updateMenuTitle, removeDish, addDish, getDish } from "~/lib/db.server";
import { deleteImage } from "~/lib/storage.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { action: act, ...payload } = await request.json();

  if (act === "rename") {
    const { menuId, title } = payload;
    updateMenuTitle(menuId, title.trim() || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
    return Response.json({ success: true });
  }

  if (act === "remove-dish") {
    const { dishId } = payload;
    const dish = getDish(dishId);
    removeDish(dishId);
    if (dish) await deleteImage(dish.image_url);
    return Response.json({ success: true });
  }

  if (act === "add-dish") {
    const { menuId, title, imageUrl } = payload;
    const dish = addDish(menuId, title, imageUrl);
    return Response.json({ dish });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
