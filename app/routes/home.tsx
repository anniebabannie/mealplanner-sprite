import { useState, useRef } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Weekly Meal Planner" },
    { name: "description", content: "Plan your weekly meals with AI-generated dish photos" },
  ];
}

type ApprovedDish = {
  title: string;
  image_url: string;
};

type Phase =
  | { type: "idle" }
  | { type: "input" }
  | { type: "generating"; dishTitle: string }
  | { type: "review"; dishTitle: string; imageUrl: string }
  | { type: "saving" };

export default function Home() {
  const [phase, setPhase] = useState<Phase>({ type: "idle" });
  const [approvedDishes, setApprovedDishes] = useState<ApprovedDish[]>([]);
  const [dishInput, setDishInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [menuTitle, setMenuTitle] = useState("");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function generateImage(title: string) {
    setError(null);
    setPhase({ type: "generating", dishTitle: title });
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate image");
      setPhase({ type: "review", dishTitle: title, imageUrl: data.imageUrl });
    } catch (e: any) {
      setError(e.message);
      setPhase({ type: "input" });
    }
  }

  function handleSubmitDish(e: React.FormEvent) {
    e.preventDefault();
    const title = dishInput.trim();
    if (!title) return;
    generateImage(title);
  }

  function handleApprove() {
    if (phase.type !== "review") return;
    setApprovedDishes((prev) => [
      ...prev,
      { title: phase.dishTitle, image_url: phase.imageUrl },
    ]);
    setDishInput("");
    setPhase({ type: "input" });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleTryAgain() {
    if (phase.type !== "review") return;
    generateImage(phase.dishTitle);
  }

  function handleCancel() {
    setDishInput("");
    setPhase({ type: "input" });
  }

  function handleRemoveDish(index: number) {
    setApprovedDishes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveMenu(e: React.FormEvent) {
    e.preventDefault();
    setPhase({ type: "saving" });
    try {
      const res = await fetch("/api/save-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: menuTitle.trim(), dishes: approvedDishes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save menu");
      setSaveSuccess(data.menu.title);
      setApprovedDishes([]);
      setMenuTitle("");
      setShowSaveModal(false);
      setPhase({ type: "idle" });
    } catch (e: any) {
      setError(e.message);
      setPhase({ type: "input" });
      setShowSaveModal(false);
    }
  }

  const isGenerating = phase.type === "generating";
  const isReviewing = phase.type === "review";

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Weekly Meal Planner</h1>
            <p className="text-sm text-stone-500 mt-0.5">Build your weekly menu with AI-generated dish photos</p>
          </div>
          <Link
            to="/menus"
            className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Saved Menus
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Success banner */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Menu "{saveSuccess}" saved successfully!</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/menus" className="text-sm font-medium text-green-700 hover:text-green-900 underline">
                View Menus
              </Link>
              <button onClick={() => setSaveSuccess(null)} className="text-green-600 hover:text-green-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Idle state: big Create Menu button */}
        {phase.type === "idle" && approvedDishes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-3">Start Your Weekly Menu</h2>
            <p className="text-stone-500 mb-8 max-w-sm">
              Add dishes to your meal plan and get beautiful AI-generated overhead photos for each one.
            </p>
            <button
              onClick={() => setPhase({ type: "input" })}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors shadow-sm"
            >
              Create Menu
            </button>
          </div>
        )}

        {/* Active create session */}
        {(phase.type !== "idle" || approvedDishes.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column: form / generation / review */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dish input form */}
              {(phase.type === "input" || phase.type === "generating") && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-stone-800 mb-4">Add a Dish</h2>
                  <form onSubmit={handleSubmitDish} className="flex gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={dishInput}
                      onChange={(e) => setDishInput(e.target.value)}
                      placeholder="e.g. teriyaki salmon with steamed asparagus"
                      className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      disabled={isGenerating}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isGenerating || !dishInput.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
                    >
                      {isGenerating ? "Generating…" : "Generate Photo"}
                    </button>
                  </form>

                  {isGenerating && (
                    <div className="mt-5 flex items-center gap-3 text-stone-500">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Creating an overhead photo of "{(phase as any).dishTitle}"…</span>
                    </div>
                  )}
                </div>
              )}

              {/* Image review */}
              {isReviewing && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden w-1/2">
                  <div className="relative">
                    <img
                      src={(phase as any).imageUrl}
                      alt={(phase as any).dishTitle}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-white font-semibold text-lg drop-shadow">{(phase as any).dishTitle}</p>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={handleTryAgain}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                      </button>
                    </div>
                    <button
                      onClick={handleCancel}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-500 font-semibold py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Approved dishes grid */}
              {approvedDishes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
                    Menu ({approvedDishes.length} dish{approvedDishes.length !== 1 ? "es" : ""})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {approvedDishes.map((dish, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                        <img
                          src={dish.image_url}
                          alt={dish.title}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <p className="absolute bottom-0 left-0 right-0 px-2.5 py-2 text-white text-xs font-medium leading-tight line-clamp-2">
                          {dish.title}
                        </p>
                        <button
                          onClick={() => handleRemoveDish(i)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: actions */}
            <div className="space-y-4">
              {(phase.type === "idle" || phase.type === "input" || phase.type === "generating") && approvedDishes.length > 0 && phase.type !== "generating" && (
                <button
                  onClick={() => setPhase({ type: "input" })}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  + Add Another Dish
                </button>
              )}

              {approvedDishes.length > 0 && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={phase.type === "saving"}
                  className="w-full bg-stone-800 hover:bg-stone-900 disabled:bg-stone-300 text-white font-semibold px-5 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Menu
                </button>
              )}

              {approvedDishes.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-stone-700 mb-1">
                    {approvedDishes.length} dish{approvedDishes.length !== 1 ? "es" : ""} added
                  </p>
                  <p className="text-xs text-stone-400">
                    Hover over a dish to remove it. Click "Save Menu" when done.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Save Menu Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-2">Save Menu</h2>
            <p className="text-stone-500 text-sm mb-5">
              Give your menu a name, or leave it blank to use today's date.
            </p>
            <form onSubmit={handleSaveMenu}>
              <input
                type="text"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                placeholder={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent mb-5"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-stone-800 hover:bg-stone-900 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Save Menu
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
