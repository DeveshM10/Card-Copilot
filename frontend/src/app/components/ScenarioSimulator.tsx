import { useState } from "react";
import { Calculator, X, TrendingUp, Award, Activity } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

export default function ScenarioSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(50000);
  const [category, setCategory] = useState("Electronics");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1, category, amount }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-[var(--color-accent)] hover:brightness-110 text-[#12100C] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/20"
      >
        <Calculator className="w-5 h-5" />
        Launch Scenario Simulator
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151310] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">

            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-display italic text-xl text-[var(--color-foreground)] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[var(--color-accent)]" />
                Scenario Simulator
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {!result ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <label className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-2 block">What are you buying?</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[var(--color-foreground)] text-lg focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option className="bg-[#151310]">Electronics</option>
                      <option className="bg-[#151310]">Travel</option>
                      <option className="bg-[#151310]">Dining</option>
                      <option className="bg-[#151310]">Jewelry</option>
                      <option className="bg-[#151310]">Utility Bills</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-widest">How much?</label>
                      <span className="text-2xl font-bold text-[var(--color-positive)]">₹{amount.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="500000"
                      step="1000"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                    />
                  </div>

                  <button
                    onClick={handleSimulate}
                    disabled={loading}
                    className="w-full bg-[var(--color-foreground)] text-[#12100C] font-bold text-lg py-4 rounded-xl mt-4 hover:brightness-95 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Simulating..." : "Calculate Impact"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">

                  <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 p-6 rounded-2xl text-center">
                    <p className="text-[var(--color-accent)]/80 font-medium mb-1">Optimal Card</p>
                    <h2 className="text-3xl font-bold text-[var(--color-foreground)] tracking-widest uppercase">{result.best_card_name}</h2>
                    <p className="text-[var(--color-positive)] font-bold text-xl mt-2">Total Savings: ₹{result.total_savings_inr.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col gap-2">
                      <TrendingUp className="text-[var(--color-accent)] w-6 h-6" />
                      <span className="text-[var(--color-muted)] text-sm">Reward Points (the math)</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[var(--color-muted)] text-xs">Base: {result.base_points_earned} pts</span>
                        <span className="text-[var(--color-muted)] text-xs">Bonus: {result.bonus_points_earned} pts</span>
                        <span className="text-[var(--color-foreground)] font-bold text-xl mt-1">{result.base_points_earned + result.bonus_points_earned} pts total</span>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col gap-2">
                      <Activity className="text-[var(--color-positive)] w-6 h-6" />
                      <span className="text-[var(--color-muted)] text-sm">Annual Fee Impact</span>
                      <span className="text-[var(--color-foreground)] font-bold text-sm leading-tight">{result.annual_fee_impact}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-start gap-4">
                     <Award className="text-[var(--color-positive)] w-8 h-8 flex-shrink-0" />
                     <div>
                       <h4 className="text-[var(--color-foreground)] font-bold mb-1">Milestone Impact</h4>
                       <p className="text-[var(--color-muted)] text-sm">{result.milestone_impact}</p>
                     </div>
                  </div>

                  <p className="text-[var(--color-muted)] text-sm text-center italic mt-2">"{result.explanation}"</p>

                  <button
                    onClick={() => setResult(null)}
                    className="w-full bg-white/10 text-[var(--color-foreground)] font-bold text-lg py-4 rounded-xl mt-2 hover:bg-white/20 transition-colors"
                  >
                    Simulate Another
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
