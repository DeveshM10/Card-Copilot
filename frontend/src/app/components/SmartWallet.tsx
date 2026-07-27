"use client";

import { useState, useEffect } from "react";
import { ChevronDown, CheckCircle2, Sparkles } from "lucide-react";

interface Offer {
  id: number;
  merchant: string;
  category: string;
  reward_multiplier: number;
  is_absolute: boolean;
  description: string;
}

interface Card {
  id: number;
  name: string;
  base_reward_rate: number;
  annual_fee: number;
  offers: Offer[];
}

interface WalletProps {
  wallet: { id: number; card: Card }[];
  loading: boolean;
}

export default function SmartWallet({ wallet, loading }: WalletProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [topCategories, setTopCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/users/1")
      .then((res) => res.json())
      .then((data) => {
        const cats = (data?.high_freq_categories || "")
          .split(",")
          .map((c: string) => c.trim().toLowerCase())
          .filter(Boolean);
        setTopCategories(cats);
      })
      .catch(() => {});
  }, []);

  const getBestFor = (card: Card) => {
    if (!card.offers || card.offers.length === 0) return "Everyday Spend";
    const top = [...card.offers].sort((a, b) => b.reward_multiplier - a.reward_multiplier)[0];
    return top.category;
  };

  const matchesPersona = (offer: Offer) =>
    topCategories.some((cat) => offer.category.toLowerCase().includes(cat) || cat.includes(offer.category.toLowerCase()));

  return (
    <div id="smart-wallet" className="flex flex-col gap-4">
      <h3 className="font-display italic text-xl text-[var(--color-foreground)] tracking-tight">Your Smart Wallet</h3>
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-[var(--color-muted)]">Loading wallet...</p>
        ) : wallet.length === 0 ? (
          <p className="text-[var(--color-muted)]">No cards in wallet.</p>
        ) : (
          wallet.map((userCard, idx) => {
            const card = userCard.card;
            const isPremium = card.name.toLowerCase().includes("infinia") || card.name.toLowerCase().includes("black");
            const gradientClass = isPremium ? "from-[#2b2416] to-black" : "from-[#1c1b19] to-[#0d0c0a]";
            const isExpanded = expandedId === userCard.id;
            const offers = card.offers || [];

            return (
              <div
                key={userCard.id}
                className={`w-full rounded-2xl overflow-hidden bg-gradient-to-br ${gradientClass} border border-white/10 shadow-2xl transition-all`}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : userCard.id)}
                  className="p-6 relative cursor-pointer hover:brightness-110 transition-all"
                >
                  {isPremium && <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/15 rounded-full blur-3xl"></div>}
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-lg tracking-widest text-[var(--color-foreground)]/90 uppercase">{card.name}</span>
                    <div className="flex flex-col items-end">
                      <span className="text-[var(--color-positive)] text-sm font-bold">Best For</span>
                      <span className="text-[var(--color-foreground)] font-medium text-sm">{getBestFor(card)}</span>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-between items-end">
                    <div>
                      <p className="text-[var(--color-muted)] text-xs tracking-widest mb-1">**** **** **** {1000 + idx * 231}</p>
                      <p className="text-[var(--color-foreground)] font-medium text-sm">Base Reward: {card.base_reward_rate}%</p>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-[var(--color-muted)] mb-1">Annual Fee</p>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {card.annual_fee > 0 ? `₹${card.annual_fee.toLocaleString()}` : "Lifetime Free"}
                        </p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-[var(--color-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-black/40 border-t border-white/10 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs uppercase tracking-widest text-[var(--color-muted)] font-bold mb-3">Benefits Included on This Card</p>
                    {offers.length === 0 ? (
                      <p className="text-[var(--color-muted)] text-sm">No specific offers on file for this card yet — it earns the flat base reward rate above on every spend.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {offers.map((offer) => {
                          const relevant = matchesPersona(offer);
                          return (
                            <div key={offer.id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                              <CheckCircle2 className="w-4 h-4 text-[var(--color-positive)] mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[var(--color-foreground)] font-medium text-sm">
                                    {offer.merchant} ({offer.category})
                                  </span>
                                  <span className="text-[var(--color-positive)] text-xs font-bold">
                                    {offer.reward_multiplier}{offer.is_absolute ? "%" : "x"}
                                  </span>
                                  {relevant && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 px-2 py-0.5 rounded-full">
                                      <Sparkles className="w-3 h-3" /> Matches your top spend
                                    </span>
                                  )}
                                </div>
                                {offer.description && <p className="text-[var(--color-muted)] text-xs mt-1">{offer.description}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
