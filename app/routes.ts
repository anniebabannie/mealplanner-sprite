import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("menus", "routes/menus.tsx"),
  route("api/generate-image", "routes/api.generate-image.ts"),
  route("api/save-menu", "routes/api.save-menu.ts"),
  route("api/delete-menu", "routes/api.delete-menu.ts"),
  route("api/update-menu", "routes/api.update-menu.ts"),
  route("menus/:id/edit", "routes/menus.$id.edit.tsx"),
] satisfies RouteConfig;
