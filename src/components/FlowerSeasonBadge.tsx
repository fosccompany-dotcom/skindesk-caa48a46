import { useEffect, useState } from "react";

type SeasonType = "reset" | "recovery" | "maintain" | "boost" | "special";

const SEASON_FLOWERS: Record<SeasonType, { emoji: string; name: string; latin: string; color: string; glow: string }> = {
  reset:    { emoji: "🌵", name: "Cactus",   latin: "Cactaceae",   color: "#7EC8A0", glow: "rgba(126,200,160,0.35)" },
  recovery: { emoji: "🌿", name: "Aloe",     latin: "Aloe Vera",   color: "#A8D5A2", glow: "rgba(168,213,162,0.35)" },
  maintain: { emoji: "💜", name: "Lavender", latin: "Lavandula",   color: "#C9A8E0", glow: "rgba(201,168,224,0.35)" },
  boost:    { emoji: "🌹", name: "Rose",     latin: "Rosa",        color: "#E8A0A0", glow: "rgba(232,160,160,0.4)"  },
  special:  { emoji: "🌸", name: "Orchid",   latin: "Orchidaceae", color: "#F0B8D8", glow: "rgba(240,184,216,0.4)"  },
};

export const FlowerSeasonBadge = ({ season }: { season: string | null }) => {
  const [visible, setVisible] = useState(false);
  const f = season ? SEASON_FLOWERS[season as SeasonType] : null;

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, [season]);

  if (!f) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap');
        .fb{display:flex;flex-direction:column;align-items:flex-end;gap:3px;opacity:0;transform:translateY(-8px);transition:opacity .7s ease,transform .7s ease}
        .fb.fb-in{opacity:1;transform:translateY(0)}
        .fb-ring{position:relative;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;animation:fbFloat 4s ease-in-out infinite}
        .fb-ring::before{content:'';position:absolute;inset:-4px;border-radius:50%;background:radial-gradient(circle,var(--fg) 0%,transparent 70%);opacity:.5;animation:fbGlow 4s ease-in-out infinite}
        .fb-emoji{font-size:22px;position:relative;z-index:1}
        .fb-name{font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:300;letter-spacing:.14em;color:var(--fc);text-align:right;line-height:1.2}
        .fb-latin{font-family:'Cormorant Garamond',serif;font-size:9px;font-style:italic;letter-spacing:.08em;color:rgba(255,255,255,.3);text-align:right}
        @keyframes fbFloat{0%,100%{transform:translateY(0) rotate(0deg)}33%{transform:translateY(-4px) rotate(2deg)}66%{transform:translateY(-2px) rotate(-1deg)}}
        @keyframes fbGlow{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.65;transform:scale(1.2)}}
      `}</style>
      <div className={`fb ${visible ? "fb-in" : ""}`} style={{ "--fc": f.color, "--fg": f.glow } as React.CSSProperties}>
        <div className="fb-ring"><span className="fb-emoji">{f.emoji}</span></div>
        <span className="fb-name">{f.name}</span>
        <span className="fb-latin">{f.latin}</span>
      </div>
    </>
  );
};