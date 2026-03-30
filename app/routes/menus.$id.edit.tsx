import { useState, useRef } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/menus.$id.edit";
import { getMenu } from "~/lib/db.server";
import type { Dish } from "~/lib/db.server";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Edit ${data?.menu?.title ?? "Menu"} — Weekly Meal Planner` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const menu = getMenu(Number(params.id));
  if (!menu) throw new Response("Not Found", { status: 404 });
  return { menu };
}

type Phase =
  | { type: "idle" }
  | { type: "input" }
  | { type: "generating"; dishTitle: string }
  | { type: "review"; dishTitle: string; imageUrl: string };

export default function EditMenu() {
  const { menu } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [title, setTitle] = useState(menu.title);
  const [dishes, setDishes] = useState<Dish[]>(menu.dishes);
  const [phase, setPhase] = useState<Phase>({ type: "idle" });
  const [dishInput, setDishInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/update-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", menuId: menu.id, title }),
    });
  }

  async function handleRemoveDish(dishId: number) {
    setRemovingId(dishId);
    await fetch("/api/update-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove-dish", dishId }),
    });
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
    setRemovingId(null);
  }

  async function generateImage(dishTitle: string) {
    setError(null);
    setPhase({ type: "generating", dishTitle });
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: dishTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate image");
      setPhase({ type: "review", dishTitle, imageUrl: data.imageUrl });
    } catch (e: any) {
      setError(e.message);
      setPhase({ type: "input" });
    }
  }

  async function handleApprove() {
    if (phase.type !== "review") return;
    setSaving(true);
    const res = await fetch("/api/update-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-dish", menuId: menu.id, title: phase.dishTitle, imageUrl: phase.imageUrl }),
    });
    const data = await res.json();
    setDishes((prev) => [...prev, data.dish]);
    setDishInput("");
    setPhase({ type: "idle" });
    setSaving(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleTryAgain() {
    if (phase.type !== "review") return;
    generateImage(phase.dishTitle);
  }

  function handleSubmitDish(e: React.FormEvent) {
    e.preventDefault();
    const t = dishInput.trim();
    if (t) generateImage(t);
  }

  const isGenerating = phase.type === "generating";
  const isReviewing = phase.type === "review";

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/menus" className="text-stone-400 hover:text-stone-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-stone-800">Edit Menu</h1>
          </div>
          <button
            onClick={() => navigate("/menus")}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            Done
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Rename */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">Menu Title</h2>
          <form onSubmit={handleRename} className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-stone-800 hover:bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Save
            </button>
          </form>
        </div>

        {/* Existing dishes */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
            Dishes ({dishes.length})
          </h2>
          {dishes.length === 0 ? (
            <p className="text-stone-400 text-sm">No dishes yet. Add one below.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dishes.map((dish) => (
                <div key={dish.id} className="relative group rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                  <img src={dish.image_url} alt={dish.title} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute bottom-0 left-0 right-0 px-2.5 py-2 text-white text-xs font-medium leading-tight line-clamp-2">
                    {dish.title}
                  </p>
                  <button
                    onClick={() => handleRemoveDish(dish.id)}
                    disabled={removingId === dish.id}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 disabled:opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add dish */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">Add a Dish</h2>

          {phase.type === "idle" && (
            <button
              onClick={() => { setPhase({ type: "input" }); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Dish
            </button>
          )}

          {(phase.type === "input" || isGenerating) && (
            <div className="space-y-4">
              <form onSubmit={handleSubmitDish} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={dishInput}
                  onChange={(e) => setDishInput(e.target.value)}
                  placeholder="e.g. teriyaki salmon with steamed asparagus"
                  disabled={isGenerating}
                  className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !dishInput.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
                >
                  {isGenerating ? "Generating…" : "Generate Photo"}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhase({ type: "idle" }); setDishInput(""); }}
                  className="px-4 bg-stone-100 hover:bg-stone-200 text-stone-500 font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </form>
              {isGenerating && (
                <div className="flex items-center gap-3 text-stone-500">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Creating a photo of "{(phase as any).dishTitle}"…</span>
                </div>
              )}
            </div>
          )}

          {isReviewing && (
            <div className="space-y-4">
              <div className="relative w-1/2 rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                <img
                  src={(phase as any).imageUrl}
                  alt={(phase as any).dishTitle}
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-0 left-0 right-0 px-3 py-2.5 text-white font-semibold drop-shadow text-sm">
                  {(phase as any).dishTitle}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={saving}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                </div>
                <button
                  onClick={() => { setPhase({ type: "idle" }); setDishInput(""); }}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-500 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
