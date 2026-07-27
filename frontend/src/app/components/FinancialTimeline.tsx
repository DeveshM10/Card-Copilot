"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Zap, Trophy, PlaneTakeoff, Bell, ArrowRight, Loader2 } from "lucide-react";

export default function FinancialTimeline() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/users/1/feed")
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setFeedItems(data.items);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching feed:", err);
        setLoading(false);
      });
  }, []);

  const colorMap: Record<string, { text: string, bg: string, border: string, badgeBg: string, iconBg: string }> = {
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500", badgeBg: "bg-emerald-500/20", iconBg: "bg-emerald-500/10" },
    blue: { text: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500", badgeBg: "bg-blue-500/20", iconBg: "bg-blue-500/10" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500", badgeBg: "bg-yellow-500/20", iconBg: "bg-yellow-500/10" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500", badgeBg: "bg-purple-500/20", iconBg: "bg-purple-500/10" },
    rose: { text: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500", badgeBg: "bg-rose-500/20", iconBg: "bg-rose-500/10" }
  };

  const getIcon = (type: string, colorStr: string) => {
    const colors = colorMap[colorStr] || colorMap.blue;
    const className = `w-5 h-5 ${colors.text}`;
    switch(type) {
      case "savings": return <CheckCircle2 className={className} />;
      case "alert": return <Zap className={className} />;
      case "milestone": return <Trophy className={className} />;
      case "gamification": return <PlaneTakeoff className={className} />;
      case "tip": return <Bell className={className} />;
      default: return <Bell className={className} />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <h3 className="text-2xl font-black text-white tracking-tighter">Activity Feed</h3>
        <span className="text-white/40 text-sm font-medium uppercase tracking-widest cursor-pointer hover:text-white transition-colors">See All</span>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 border border-white/5 rounded-3xl bg-white/5">
          <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
          <p className="text-white/50 font-medium">Generating intelligence feed...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0 border-l-2 border-white/10 ml-4 relative">
          {feedItems.map((item, i) => {
            const colors = colorMap[item.color_theme] || colorMap.blue;
            return (
            <div key={i} className="relative pl-8 pb-8 group cursor-pointer animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}>
              <div className={`absolute left-[-11px] top-1 w-5 h-5 rounded-full bg-[#0a0a0a] border-2 ${colors.border} flex items-center justify-center transition-transform group-hover:scale-125 z-10`}>
                {item.type === "alert" && <div className={`w-1.5 h-1.5 rounded-full ${colors.bg.replace('/5', '')} animate-pulse`}></div>}
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-white/40 uppercase tracking-wider">{item.time}</p>
                {item.badge && (
                  <span className={`${colors.badgeBg} ${colors.text} text-xs font-bold px-2 py-0.5 rounded-full border border-white/5`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <div className={`${colors.bg} border border-white/5 p-5 rounded-3xl transition-all duration-300 hover:border-white/20 hover:bg-white/10`}>
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white/5 p-2 rounded-xl border border-white/10">
                    {getIcon(item.type, item.color_theme)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-white mb-1.5 tracking-tight">{item.title}</h5>
                    <p className="text-white/60 leading-relaxed text-sm font-medium">{item.description}</p>
                    
                    {item.action && (
                      <button className="mt-4 flex items-center gap-1.5 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-all hover:pr-3">
                        {item.action} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
