import { useState } from "react";
import { Link, useLoaderData, useRevalidator, useNavigate } from "react-router";
import type { Route } from "./+types/menus";
import { getAllMenus } from "~/lib/db.server";
import type { MenuWithDishes } from "~/lib/db.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Saved Menus — Weekly Meal Planner" }];
}

export async function loader() {
  return { menus: getAllMenus() };
}

export default function Menus() {
  const { menus } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [expandedId, setExpandedId] = useState<number | null>(menus[0]?.id ?? null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this menu? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch("/api/delete-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      revalidator.revalidate();
      if (expandedId === id) setExpandedId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Saved Menus</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {menus.length} menu{menus.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Menu
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {menus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-700 mb-3">No menus yet</h2>
            <p className="text-stone-500 mb-8 max-w-sm">
              Create your first weekly meal plan to see it here.
            </p>
            <Link
              to="/"
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors shadow-sm"
            >
              Create Your First Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                expanded={expandedId === menu.id}
                onToggle={() => setExpandedId(expandedId === menu.id ? null : menu.id)}
                onDelete={() => handleDelete(menu.id)}
                isDeleting={deletingId === menu.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MenuCard({
  menu,
  expanded,
  onToggle,
  onDelete,
  isDeleting,
}: {
  menu: MenuWithDishes;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const date = new Date(menu.created_at + "Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Preview thumbnails */}
          {menu.dishes.length > 0 && (
            <div className="flex -space-x-2 shrink-0">
              {menu.dishes.slice(0, 3).map((dish, i) => (
                <img
                  key={dish.id}
                  src={dish.image_url}
                  alt={dish.title}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  style={{ zIndex: 3 - i }}
                />
              ))}
              {menu.dishes.length > 3 && (
                <div className="w-10 h-10 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-stone-600">
                  +{menu.dishes.length - 3}
                </div>
              )}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-stone-800 truncate">{menu.title}</h2>
            <p className="text-sm text-stone-400">
              {date} · {menu.dishes.length} dish{menu.dishes.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-stone-400 shrink-0 ml-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded dish grid */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-stone-100">
          {menu.dishes.length === 0 ? (
            <p className="text-stone-400 text-sm py-4">No dishes in this menu.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-5">
              {menu.dishes.map((dish) => (
                <div key={dish.id} className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                  <div className="relative">
                    <img
                      src={dish.image_url}
                      alt={dish.title}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-0 left-0 right-0 px-2.5 py-2 text-white text-xs font-medium leading-tight">
                      {dish.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <Link
              to={`/menus/${menu.id}/edit`}
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Menu
            </Link>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? "Deleting…" : "Delete Menu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
