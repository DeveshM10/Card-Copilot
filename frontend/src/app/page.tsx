"use client";

import { useState, useEffect } from 'react';
import ChatBox from './components/ChatBox';
import ExploreCards from './components/ExploreCards';
import Onboarding from './components/Onboarding';
import WalletSetup from './components/WalletSetup';
import ActionableIntelligence from './components/ActionableIntelligence';
import FinancialTimeline from './components/FinancialTimeline';
import ScenarioSimulator from './components/ScenarioSimulator';
import SmartWallet from './components/SmartWallet';

export default function Home() {
  const [flowState, setFlowState] = useState<"onboarding" | "wallet" | "dashboard">("onboarding");
  const [hydrated, setHydrated] = useState(false);
  const [wallet, setWallet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("cardpilot_onboarded") === "true") {
      setFlowState("dashboard");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/users/1/wallet')
      .then(res => res.json())
      .then(data => {
        setWallet(data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const completeFlow = () => {
    localStorage.setItem("cardpilot_onboarded", "true");
    setFlowState("dashboard");
  };

  // Avoid flashing the onboarding screen before we've checked localStorage
  if (!hydrated) {
    return <div className="fixed inset-0 bg-[var(--color-background)]" />;
  }

  if (flowState === "onboarding") {
    return <Onboarding onComplete={() => setFlowState("wallet")} />;
  }

  if (flowState === "wallet") {
    return <WalletSetup onComplete={completeFlow} />;
  }

  const walletEfficiency = wallet.length > 0
    ? Math.round((wallet.filter((uc: any) => uc.card?.offers?.length > 0).length / wallet.length) * 100)
    : 0;

  return (
    <div id="dashboard" className="flex flex-col gap-10 h-full p-8 md:p-12 bg-[var(--color-background)] max-w-7xl mx-auto">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display italic text-3xl text-[var(--color-foreground)] tracking-tight">Good Morning Devesh</h2>
          <p className="text-[var(--color-muted)] mt-1 text-lg">You saved <strong className="text-[var(--color-positive)]">₹4,250</strong> this month.</p>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-end justify-center">
            <span className="text-sm font-bold text-[var(--color-foreground)] tracking-widest uppercase">Wallet Efficiency</span>
            <span className="text-2xl font-bold text-[var(--color-positive)]">{walletEfficiency}<span className="text-sm text-[var(--color-muted)]">%</span></span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3">
          <ActionableIntelligence />
        </div>
        <div className="md:col-span-1 flex items-end">
          <ScenarioSimulator />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
        {/* Left Col: Timeline & Wallet */}
        <div className="flex flex-col gap-12">
          <FinancialTimeline />

          <SmartWallet wallet={wallet} loading={loading} />
        </div>

        {/* Right Col: AI Copilot (The Core Focus) */}
        <div id="agent-chat" className="flex flex-col h-[600px] bg-white/5 border border-white/10 rounded-3xl overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-[var(--color-background)] to-transparent z-10">
              <h3 className="font-display italic text-lg text-[var(--color-foreground)] text-center tracking-tight">Ask CardPilot AI</h3>
              <p className="text-xs text-[var(--color-muted)] text-center">Powered by Financial Decision Engine</p>
           </div>
           <div className="flex-1 mt-12">
             <ChatBox />
           </div>
        </div>

      </div>

      <div id="explore" className="mt-12 border-t border-white/10 pt-12">
        <ExploreCards />
      </div>

    </div>
  );
}
