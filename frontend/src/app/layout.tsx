import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "CardPilot AI | Financial Copilot",
  description: "The AI Financial Copilot That Optimizes Every Payment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 glass-panel m-4 flex flex-col">
          <div className="p-6">
            <h1 className="font-display italic text-2xl text-gradient tracking-tight">CardPilot</h1>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 uppercase tracking-[0.2em] font-semibold">AI Copilot</p>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 mt-4">
            <a href="#dashboard" className="flex items-center gap-3 px-4 py-3 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl text-[var(--color-foreground)] font-medium transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Dashboard
            </a>
            <a href="#smart-wallet" className="flex items-center gap-3 px-4 py-3 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-foreground)] rounded-xl transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Smart Wallet
            </a>
            <a href="#agent-chat" className="flex items-center gap-3 px-4 py-3 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-foreground)] rounded-xl transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Agent Chat
            </a>
            <a href="#explore" className="flex items-center gap-3 px-4 py-3 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-foreground)] rounded-xl transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Explore Cards
            </a>
          </nav>

          <div className="p-4 mt-auto">
            <div className="flex items-center gap-3 p-3 glass-panel border-none bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-emerald-500 flex items-center justify-center font-bold text-[#12100C]">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground)]">John Doe</p>
                <p className="text-xs text-[var(--color-muted)]">Pro Member</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 pl-0">
          <div className="h-full rounded-2xl glass-panel bg-black/20 p-8 overflow-y-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
