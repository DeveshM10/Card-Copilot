"use client";

import { useState } from "react";
import { Plane, ShieldCheck, CreditCard, Check } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

type Profile = {
  age_group: string;
  income_range: string;
  travel_frequency: string;
  dining_frequency: string;
  online_shopping_spend: string;
  high_freq_categories: string;
  financial_goals: string;
  risk_attitude: string;
  has_external_income: string;
  external_income_sources: string;
  investment_goals: string;
};

const EMPTY_PROFILE: Profile = {
  age_group: "",
  income_range: "",
  travel_frequency: "",
  dining_frequency: "",
  online_shopping_spend: "",
  high_freq_categories: "",
  financial_goals: "",
  risk_attitude: "",
  has_external_income: "",
  external_income_sources: "",
  investment_goals: "",
};

// The question flow is dynamic: the external-income-sources step only appears
// if the user says they have external income, so progress is computed against
// whichever path is actually being traversed.
function buildFlow(hasExternalIncome: string) {
  const flow = ["age", "income", "travel", "dining", "spend", "categories", "priorities", "attitude", "external_gate"];
  if (hasExternalIncome === "Yes") flow.push("external_sources");
  flow.push("expense");
  return flow;
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState("welcome");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [multiDraft, setMultiDraft] = useState<Set<string>>(new Set());

  const flow = buildFlow(profile.has_external_income);
  const stepIndex = flow.indexOf(step);
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / flow.length) * 100 : 0;

  const goNext = (from: string) => {
    const idx = flow.indexOf(from);
    if (idx >= 0 && idx < flow.length - 1) {
      setStep(flow[idx + 1]);
    } else {
      setStep("wallet");
    }
    setMultiDraft(new Set());
  };

  const selectSingle = (key: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    // Answering has_external_income can change the flow itself (adds/removes
    // the external_sources step), so recompute against the *new* value.
    const nextFlow = buildFlow(key === "has_external_income" ? value : profile.has_external_income);
    const idx = nextFlow.indexOf(step);
    setStep(idx >= 0 && idx < nextFlow.length - 1 ? nextFlow[idx + 1] : "wallet");
    setMultiDraft(new Set());
  };

  const toggleMulti = (value: string) => {
    setMultiDraft((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const confirmMulti = (key: keyof Profile) => {
    setProfile((prev) => ({ ...prev, [key]: Array.from(multiDraft).join(",") }));
    goNext(step);
  };

  const finishOnboarding = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/api/users/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
    } catch (e) {
      console.error("Failed to save persona:", e);
    }
    setSaving(false);
    onComplete();
  };

  const SingleOption = ({ opt, onClick, icon }: { opt: string; onClick: () => void; icon?: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/30 transition-colors text-[var(--color-foreground)] font-medium text-left flex items-center gap-3"
    >
      {icon}
      {opt}
    </button>
  );

  const MultiOption = ({ opt }: { opt: string }) => {
    const active = multiDraft.has(opt);
    return (
      <button
        onClick={() => toggleMulti(opt)}
        className={`p-5 rounded-2xl border font-medium text-left flex items-center justify-between transition-all ${
          active
            ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/50 text-[var(--color-foreground)]"
            : "bg-white/5 border-white/10 text-[var(--color-foreground)] hover:bg-white/10"
        }`}
      >
        {opt}
        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[#12100C]" : "border-white/20 text-transparent"}`}>
          <Check className="w-4 h-4" />
        </span>
      </button>
    );
  };

  const ContinueButton = ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-2 w-full bg-[var(--color-accent)] text-[#12100C] font-bold py-4 rounded-2xl text-lg hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      Continue
    </button>
  );

  let title = "";
  let subtitle = "";
  let content: React.ReactNode = null;

  switch (step) {
    case "welcome":
      title = "Welcome to CardPilot AI";
      subtitle = "Your AI Financial Copilot.";
      content = (
        <div className="flex flex-col gap-4 mt-8">
          <button onClick={() => setStep("trust")} className="w-full bg-[var(--color-foreground)] text-[#12100C] font-semibold py-4 rounded-2xl text-lg hover:brightness-95 transition-colors">
            Continue with Google
          </button>
          <button onClick={() => setStep("trust")} className="w-full bg-white/5 text-[var(--color-foreground)] border border-white/20 font-semibold py-4 rounded-2xl text-lg hover:bg-white/10 transition-colors">
            Continue with Apple
          </button>
        </div>
      );
      break;

    case "trust":
      title = "Secure Setup";
      subtitle = "All your data is encrypted and never sold. You control what to share.";
      content = (
        <div className="flex flex-col gap-4 mt-8">
          <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 text-[var(--color-positive)] flex-shrink-0" />
            <div>
              <h4 className="text-[var(--color-foreground)] font-bold mb-1">Bank-Level Encryption</h4>
              <p className="text-[var(--color-muted)] text-sm">We use 256-bit encryption to secure your financial profile. We do not store your bank credentials.</p>
            </div>
          </div>
          <button onClick={() => setStep("age")} className="mt-6 bg-[var(--color-accent)] text-[#12100C] font-bold py-4 rounded-2xl text-lg hover:brightness-110 transition-colors">
            I Understand
          </button>
        </div>
      );
      break;

    case "age":
      title = "Which age group are you in?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length}`;
      content = (
        <div className="flex flex-col gap-4 mt-8">
          {["Under 21", "21-25", "26-30", "31-35", "36-45", "46-60", "60+"].map((opt) => (
            <SingleOption key={opt} opt={opt} onClick={() => selectSingle("age_group", opt)} />
          ))}
        </div>
      );
      break;

    case "income":
      title = "Monthly Income Range?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length}`;
      content = (
        <div className="grid grid-cols-2 gap-3 mt-8">
          {["< ₹25k", "₹25k - 50k", "₹50k - 75k", "₹75k - 1L", "₹1L - 1.5L", "₹1.5L - 2L", "₹2L - 3L", "₹3L+"].map((opt) => (
            <SingleOption key={opt} opt={opt} onClick={() => selectSingle("income_range", opt)} />
          ))}
        </div>
      );
      break;

    case "travel":
      title = "How often do you travel?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length}`;
      content = (
        <div className="grid grid-cols-2 gap-4 mt-8">
          {["Never", "1-2 times/yr", "3-6 times/yr", "Monthly+"].map((opt) => (
            <button key={opt} onClick={() => selectSingle("travel_frequency", opt)} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/30 transition-colors text-[var(--color-foreground)] font-medium text-lg flex flex-col items-center gap-3">
              <Plane className="w-8 h-8 text-[var(--color-accent)]" />
              {opt}
            </button>
          ))}
        </div>
      );
      break;

    case "dining":
      title = "Dining out or food delivery?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length}`;
      content = (
        <div className="flex flex-col gap-4 mt-8">
          {["Daily", "1-3 times/week", "Occasionally", "Rarely"].map((opt) => (
            <SingleOption key={opt} opt={opt} onClick={() => selectSingle("dining_frequency", opt)} />
          ))}
        </div>
      );
      break;

    case "spend":
      title = "Monthly Online Shopping?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length}`;
      content = (
        <div className="grid grid-cols-2 gap-3 mt-8">
          {["₹0 - 2k", "₹2k - 5k", "₹5k - 10k", "₹10k - 15k", "₹15k - 20k", "₹20k - 30k", "₹30k - 50k", "₹50k+"].map((opt) => (
            <SingleOption key={opt} opt={opt} onClick={() => selectSingle("online_shopping_spend", opt)} />
          ))}
        </div>
      );
      break;

    case "categories":
      title = "Where do you spend the most?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length} — select all that apply`;
      content = (
        <div className="flex flex-col gap-3 mt-8">
          <div className="grid grid-cols-2 gap-3">
            {["Groceries", "Fuel", "Movies & Entertainment", "Online Shopping", "Travel", "Dining", "Bills & Utilities", "Healthcare"].map((opt) => (
              <MultiOption key={opt} opt={opt} />
            ))}
          </div>
          <ContinueButton onClick={() => confirmMulti("high_freq_categories")} disabled={multiDraft.size === 0} />
        </div>
      );
      break;

    case "priorities":
      title = "What matters most to you?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length} — select all that apply`;
      content = (
        <div className="flex flex-col gap-3 mt-8">
          <div className="grid grid-cols-2 gap-3">
            {["Max Cashback", "Free Travel", "Airport Lounges", "Luxury Rewards", "Zero Annual Fee", "Fuel Surcharge Waiver"].map((opt) => (
              <MultiOption key={opt} opt={opt} />
            ))}
          </div>
          <ContinueButton onClick={() => confirmMulti("financial_goals")} disabled={multiDraft.size === 0} />
        </div>
      );
      break;

    case "attitude":
      title = "Your spend attitude?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length}`;
      content = (
        <div className="flex flex-col gap-4 mt-8">
          {["I only buy on discounts", "I splurge on travel", "I maintain high balances for perks", "I want zero annual fees"].map((opt) => (
            <SingleOption key={opt} opt={opt} onClick={() => selectSingle("risk_attitude", opt)} />
          ))}
        </div>
      );
      break;

    case "external_gate":
      title = "Any income beyond your salary?";
      subtitle = "Investments, freelance work, or a side business — this unlocks more relevant recommendations";
      content = (
        <div className="flex flex-col gap-4 mt-8">
          {["Yes", "No"].map((opt) => (
            <SingleOption key={opt} opt={opt} onClick={() => selectSingle("has_external_income", opt)} />
          ))}
        </div>
      );
      break;

    case "external_sources":
      title = "Where does it come from?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length} — select all that apply`;
      content = (
        <div className="flex flex-col gap-3 mt-8">
          <div className="grid grid-cols-2 gap-3">
            {["Stocks & Mutual Funds", "Real Estate / Rental", "Freelance / Consulting", "Own Business", "Crypto", "Other Investments"].map((opt) => (
              <MultiOption key={opt} opt={opt} />
            ))}
          </div>
          <ContinueButton onClick={() => confirmMulti("external_income_sources")} disabled={multiDraft.size === 0} />
        </div>
      );
      break;

    case "expense":
      title = "Upcoming big expense?";
      subtitle = `Question ${stepIndex + 1} of ${flow.length}`;
      content = (
        <div className="flex flex-col gap-4 mt-8">
          {["Wedding", "Car", "Education", "Travel", "None yet"].map((opt) => (
            <SingleOption key={opt} opt={opt} onClick={() => selectSingle("investment_goals", opt)} />
          ))}
        </div>
      );
      break;

    case "wallet":
      title = "Setup Your Wallet";
      subtitle = "Add your credit cards to unleash AI power. You can skip any and come back later.";
      content = (
        <div className="flex flex-col gap-4 mt-8">
          <button onClick={finishOnboarding} disabled={saving} className="w-full bg-[var(--color-foreground)] text-[#12100C] font-bold py-4 rounded-2xl text-lg hover:brightness-95 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <CreditCard className="w-5 h-5" />
            {saving ? "Saving your profile..." : "Add Cards Manually"}
          </button>
          <button onClick={finishOnboarding} disabled={saving} className="w-full bg-white/5 text-[var(--color-foreground)] border border-white/20 font-semibold py-4 rounded-2xl text-lg hover:bg-white/10 transition-colors disabled:opacity-50">
            Skip for now
          </button>
        </div>
      );
      break;
  }

  const showProgress = step !== "welcome" && step !== "trust" && step !== "wallet";

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-background)] flex flex-col items-center justify-center p-6">
      {showProgress && (
        <div className="absolute top-12 w-full max-w-md px-6">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="font-display text-4xl md:text-5xl italic text-[var(--color-foreground)] tracking-tight mb-4 leading-tight text-balance">
          {title}
        </h1>
        <p className="text-lg text-[var(--color-muted)] leading-relaxed">{subtitle}</p>

        {content}
      </div>
    </div>
  );
}
