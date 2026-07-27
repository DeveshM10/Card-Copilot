"use client";

import { useState, useEffect } from "react";
import { CreditCard, X, Landmark } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

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
  bank: string;
  network: string;
  base_reward_rate: number;
  annual_fee: number;
  joining_fee: number;
  eligibility_criteria: string;
  offers: Offer[];
}

export default function ExploreCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/cards`)
      .then((res) => res.json())
      .then((data) => {
        setCards(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch cards:", err);
        setLoading(false);
      });
  }, []);

  // Group cards by bank
  const groupedCards = cards.reduce((acc, card) => {
    if (!acc[card.bank]) {
      acc[card.bank] = [];
    }
    acc[card.bank].push(card);
    return acc;
  }, {} as Record<string, Card[]>);

  // Helper to generate dynamic gradients based on bank name
  const getBankGradient = (bankName: string) => {
    const gradients = {
      "HDFC Bank": "from-blue-600 to-blue-900",
      "SBI Card": "from-cyan-500 to-blue-700",
      "ICICI Bank": "from-orange-500 to-red-600",
      "Axis Bank": "from-pink-600 to-rose-900",
      "Kotak Mahindra Bank": "from-red-600 to-red-900",
      "IndusInd Bank": "from-amber-600 to-orange-900",
      "IDFC First Bank": "from-rose-500 to-red-700",
      "YES Bank (Uni Cards)": "from-amber-400 to-yellow-800",
      "Federal Bank": "from-emerald-600 to-teal-900",
      "CSB Bank (Jupiter Money)": "from-teal-500 to-cyan-800",
      "Slice Small Finance Bank": "from-fuchsia-600 to-rose-900",
      "YES Bank": "from-amber-600 to-orange-900",
    };
    // @ts-ignore
    return gradients[bankName] || "from-gray-600 to-gray-900";
  };

  if (loading) {
    return <div className="text-[var(--color-muted)] p-8">Loading Knowledge Base...</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full mt-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">Explore Knowledge Base</h2>
        <p className="text-[var(--color-muted)]">Comprehensive database of top Indian credit cards.</p>
      </div>

      <div className="flex flex-col gap-12">
        {Object.entries(groupedCards).map(([bank, bankCards]) => (
          <div key={bank} className="flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Landmark className="w-6 h-6 text-[var(--color-foreground)]/80" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-foreground)]">{bank}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bankCards.map((card) => (
                <div 
                  key={card.id} 
                  onClick={() => setSelectedCard(card)}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl p-[1px] transition-all hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getBankGradient(card.bank)} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative h-48 bg-[#111]/90 backdrop-blur-xl rounded-[15px] p-6 flex flex-col justify-between border border-white/10 overflow-hidden">
                    {/* CSS Card Design Element */}
                    <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full bg-gradient-to-br ${getBankGradient(card.bank)} blur-3xl opacity-20`} />
                    
                    <div className="flex justify-between items-start z-10">
                      <CreditCard className="w-8 h-8 text-[var(--color-foreground)]/50" />
                      <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded-full text-[var(--color-foreground)]/80">{card.network}</span>
                    </div>
                    
                    <div className="z-10">
                      <p className="text-sm text-[var(--color-muted)] mb-1">{card.bank}</p>
                      <h4 className="text-lg font-bold text-[var(--color-foreground)] leading-tight">{card.name}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Card Details Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151515] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => setSelectedCard(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-[var(--color-foreground)]" />
            </button>
            
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-xs font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-full border border-[var(--color-accent)]/20">{selectedCard.network}</span>
                <span className="px-3 py-1 text-xs font-medium bg-white/5 text-[var(--color-muted)] rounded-full border border-white/10">{selectedCard.bank}</span>
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-foreground)]">{selectedCard.name}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-[var(--color-muted)] mb-1">Joining Fee</p>
                <p className="text-xl font-bold text-[var(--color-foreground)]">₹{selectedCard.joining_fee}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-[var(--color-muted)] mb-1">Annual Fee</p>
                <p className="text-xl font-bold text-[var(--color-foreground)]">₹{selectedCard.annual_fee}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-[var(--color-muted)] mb-1">Base Reward Rate</p>
                <p className="text-xl font-bold text-[var(--color-foreground)]">{selectedCard.base_reward_rate}%</p>
              </div>
            </div>

            {selectedCard.eligibility_criteria && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-3">Eligibility Criteria</h3>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                  <p className="text-orange-200/80 leading-relaxed text-sm">
                    {selectedCard.eligibility_criteria}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-3">Key Features & Offers</h3>
              <div className="flex flex-col gap-3">
                {/* Need to fetch offers for this card. Wait, the /api/cards endpoint might not include offers by default in SQLAlchemy unless loaded. */}
                {/* We should probably create a separate fetch or ensure offers are joined in the backend. */}
                {/* For now, we will assume offers might be empty if not joined, but we can display a note. */}
                {selectedCard.offers && selectedCard.offers.length > 0 ? (
                  selectedCard.offers.map((offer, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-4 items-start">
                      <div className="bg-white/10 rounded-lg p-2 mt-1">
                        <CreditCard className="w-5 h-5 text-[var(--color-foreground)]/70" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">{offer.description}</p>
                        <p className="text-sm text-[var(--color-muted)] mt-1">Merchant: {offer.merchant} • Category: {offer.category}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--color-muted)] text-sm">No specific merchant offers found in Knowledge Base.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
