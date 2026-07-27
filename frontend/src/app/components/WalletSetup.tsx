"use client";

import { useState, useEffect } from "react";
import { Check, Search, Plus, CreditCard, Loader2 } from "lucide-react";

export default function WalletSetup({ onComplete }: { onComplete: () => void }) {
  const [cards, setCards] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/cards")
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setLoading(false);
      });
  }, []);

  const toggleCard = (id: number) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCards(newSelected);
  };

  const handleAddCustom = async () => {
    setAddingCustom(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/cards/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: search })
      });
      const newCard = await res.json();
      setCards([...cards, newCard]);
      toggleCard(newCard.id);
      setSearch("");
    } catch (e) {
      console.error(e);
    }
    setAddingCustom(false);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch("http://127.0.0.1:8000/api/users/1/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_ids: Array.from(selectedCards) })
      });
      onComplete();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const filteredCards = cards.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.bank.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-background)] flex flex-col p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[var(--color-accent)]/5 blur-[120px] mix-blend-screen" />
         <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[120px] mix-blend-screen" />
      </div>

      <div className="max-w-3xl w-full mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col relative z-10">

        <h1 className="font-display italic text-5xl md:text-6xl text-[var(--color-foreground)] tracking-tight mb-4 text-balance">
          Build Your Wallet.
        </h1>
        <p className="text-xl text-[var(--color-muted)] leading-relaxed mb-8 font-medium">
          The Intelligence Engine needs your cards to optimize your spend.
        </p>

        <div className="relative mb-8 group">
          <div className="absolute -inset-0.5 bg-[var(--color-accent)]/40 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
          <div className="relative flex items-center bg-[#151310] rounded-2xl">
            <Search className="absolute left-5 text-[var(--color-muted)] w-6 h-6" />
            <input
              type="text"
              placeholder="Search IDFC, HDFC, SBI, OneCard, Jupiter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-5 pl-14 pr-5 text-[var(--color-foreground)] text-lg font-medium focus:outline-none rounded-2xl placeholder:text-[var(--color-muted)]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-32 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center mt-20 gap-4">
              <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
              <p className="text-[var(--color-muted)] font-medium">Loading catalog...</p>
            </div>
          ) : filteredCards.length > 0 ? (
            filteredCards.map(card => {
              const isSelected = selectedCards.has(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className={`w-full text-left p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${isSelected ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] shadow-[0_0_30px_rgba(201,162,77,0.15)] scale-[1.02]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#221d15] to-black flex items-center justify-center border border-white/10 shadow-inner">
                      <CreditCard className={`w-7 h-7 ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} />
                    </div>
                    <div>
                      <h4 className="text-[var(--color-foreground)] font-bold text-xl tracking-tight">{card.name}</h4>
                      <p className="text-[var(--color-muted)] text-sm font-medium mt-0.5 uppercase tracking-wider">{card.bank} • {card.network}</p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[#12100C] scale-110' : 'border-white/20 text-transparent'}`}>
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center mt-12 bg-white/5 border border-white/10 border-dashed rounded-3xl p-10 text-center">
              <p className="text-[var(--color-muted)] text-lg mb-6">We don't have "{search}" in our verified catalog yet.</p>
              <button
                onClick={handleAddCustom}
                disabled={addingCustom}
                className="bg-white/10 hover:bg-white/20 text-[var(--color-foreground)] font-bold py-4 px-8 rounded-xl transition-colors flex items-center gap-2"
              >
                {addingCustom ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Add Custom Card
              </button>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)] to-transparent z-20">
          <div className="max-w-3xl mx-auto flex gap-4">
             <button
                onClick={onComplete}
                className="px-8 py-5 rounded-2xl font-bold text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/5 transition-colors tracking-wide"
             >
                SKIP
             </button>
             <button
                onClick={handleFinish}
                disabled={saving || selectedCards.size === 0}
                className="flex-1 bg-[var(--color-foreground)] text-[#12100C] font-black py-5 rounded-2xl text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest shadow-[0_0_40px_rgba(242,239,233,0.15)]"
             >
                {saving ? "Processing..." : `Link ${selectedCards.size} Cards`}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
