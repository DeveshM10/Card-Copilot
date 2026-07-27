"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Recommendation {
  category: string;
  best_card_name: string;
  total_savings_inr: number;
  explanation: string;
}

const DEFAULT_CATEGORIES: Record<string, number> = {
  Travel: 25000,
  Dining: 2000,
  Shopping: 5000,
  Online: 5000,
  Groceries: 3000,
  Fuel: 3000,
  Movies: 1000,
};

const THEME_BY_INDEX = [
  { border: "border-[var(--color-accent)]/20", glow: "bg-[var(--color-accent)]/10", accent: "text-[var(--color-positive)]" },
  { border: "border-white/5", glow: "bg-[var(--color-accent)]/10", accent: "text-[var(--color-accent)]" },
  { border: "border-white/5", glow: "bg-rose-500/10", accent: "text-rose-400" },
];

export default function ActionableIntelligence() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      const wallet = await fetch("http://127.0.0.1:8000/api/users/1/wallet")
        .then((res) => res.json())
        .catch(() => []);

      if (!wallet || wallet.length === 0) {
        if (!cancelled) {
          setHasWallet(false);
          setLoading(false);
        }
        return;
      }

      const persona = await fetch("http://127.0.0.1:8000/api/users/1")
        .then((res) => res.json())
        .catch(() => null);

      const personaCategories = (persona?.high_freq_categories || "")
        .split(",")
        .map((c: string) => c.trim())
        .filter(Boolean);

      const categories = [...new Set([...personaCategories, ...Object.keys(DEFAULT_CATEGORIES)])].slice(0, 3);

      const results = await Promise.all(
        categories.map((category) =>
          fetch("http://127.0.0.1:8000/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: 1,
              category,
              amount: DEFAULT_CATEGORIES[category] || 5000,
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) =>
              data
                ? {
                    category,
                    best_card_name: data.best_card_name,
                    total_savings_inr: data.total_savings_inr,
                    explanation: data.explanation,
                  }
                : null
            )
            .catch(() => null)
        )
      );

      if (!cancelled) {
        setRecommendations(results.filter((r): r is Recommendation => r !== null));
        setLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-white tracking-tight">Today's Recommendations</h3>

      {loading ? (
        <div className="flex items-center gap-3 text-white/50 py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Calculating your best moves...
        </div>
      ) : !hasWallet ? (
        <p className="text-white/50 py-4">Add cards to your wallet to see personalized recommendations.</p>
      ) : recommendations.length === 0 ? (
        <p className="text-white/50 py-4">No recommendations available right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, idx) => {
            const theme = THEME_BY_INDEX[idx % THEME_BY_INDEX.length];
            return (
              <div
                key={rec.category}
                className={`bg-gradient-to-br from-[#1a1a24] to-[#101015] p-5 rounded-3xl border ${theme.border} relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${theme.glow} blur-2xl rounded-full`}></div>
                <p className="text-white/60 text-sm font-medium mb-1">{rec.category}</p>
                <h4 className="text-xl font-bold text-white mb-2">Use {rec.best_card_name}</h4>
                <div className="flex justify-between items-end">
                  <div>
                    <p className={`${theme.accent} font-semibold`}>Save ₹{rec.total_savings_inr.toLocaleString()}</p>
                  </div>
                </div>
                {rec.explanation && (
                  <p className="text-white/40 text-xs mt-3 leading-relaxed line-clamp-2">{rec.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
