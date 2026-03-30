import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "menus.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );
`);

export type Menu = {
  id: number;
  title: string;
  created_at: string;
};

export type Dish = {
  id: number;
  menu_id: number;
  title: string;
  image_url: string;
  position: number;
};

export type MenuWithDishes = Menu & { dishes: Dish[] };

export function saveMenu(title: string, dishes: { title: string; image_url: string }[]): Menu {
  const insert = db.prepare("INSERT INTO menus (title, created_at) VALUES (?, datetime('now'))");
  const insertDish = db.prepare(
    "INSERT INTO dishes (menu_id, title, image_url, position) VALUES (?, ?, ?, ?)"
  );

  const run = db.transaction(() => {
    const result = insert.run(title);
    const menuId = result.lastInsertRowid as number;
    dishes.forEach((dish, i) => insertDish.run(menuId, dish.title, dish.image_url, i));
    return menuId;
  });

  const menuId = run();
  return db.prepare("SELECT * FROM menus WHERE id = ?").get(menuId) as Menu;
}

export function getAllMenus(): MenuWithDishes[] {
  const menus = db.prepare("SELECT * FROM menus ORDER BY created_at DESC").all() as Menu[];
  const getDishes = db.prepare("SELECT * FROM dishes WHERE menu_id = ? ORDER BY position");
  return menus.map((menu) => ({
    ...menu,
    dishes: getDishes.all(menu.id) as Dish[],
  }));
}

export function getMenu(id: number): MenuWithDishes | null {
  const menu = db.prepare("SELECT * FROM menus WHERE id = ?").get(id) as Menu | undefined;
  if (!menu) return null;
  const dishes = db.prepare("SELECT * FROM dishes WHERE menu_id = ? ORDER BY position").all(id) as Dish[];
  return { ...menu, dishes };
}

export function deleteMenu(id: number): void {
  db.prepare("DELETE FROM menus WHERE id = ?").run(id);
}

export function updateMenuTitle(id: number, title: string): void {
  db.prepare("UPDATE menus SET title = ? WHERE id = ?").run(title, id);
}

export function getDish(dishId: number): Dish | null {
  return (db.prepare("SELECT * FROM dishes WHERE id = ?").get(dishId) as Dish | undefined) ?? null;
}

export function removeDish(dishId: number): void {
  db.prepare("DELETE FROM dishes WHERE id = ?").run(dishId);
}

export function addDish(menuId: number, title: string, imageUrl: string): Dish {
  const maxPos = (db.prepare("SELECT MAX(position) as m FROM dishes WHERE menu_id = ?").get(menuId) as any)?.m ?? -1;
  const result = db.prepare(
    "INSERT INTO dishes (menu_id, title, image_url, position) VALUES (?, ?, ?, ?)"
  ).run(menuId, title, imageUrl, maxPos + 1);
  return db.prepare("SELECT * FROM dishes WHERE id = ?").get(result.lastInsertRowid) as Dish;
}
