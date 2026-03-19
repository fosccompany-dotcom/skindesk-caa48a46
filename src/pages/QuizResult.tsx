import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SKIN_TRIBE_LABELS, type SkinTribe } from "@/lib/skinTribeClassifier";
import { Link2, RefreshCw, ArrowRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const TRIBE_CARDS: Record<SkinTribe, { quote: string }> = {
  desert_sensitive: {
    quote: "세상 모든 제품이 내 피부의 적.\n당기고, 빨개지고, 각질까지.\n근데 그래서 더 열심히 관리하잖아.",
  },
  dry_calm: {
    quote: "각질은 있는데 트러블은 없어.\n그냥 건조한 거라 생각하고 살았는데\n알고 보면 수분이 많이 부족한 상태.",
  },
  combo_sensitive: {
    quote: "T존은 기름, 볼은 사막.\n어떤 날은 번들, 어떤 날은 당겨.\n피부가 매일 다른 말을 해.",
  },
  combo_balanced: {
    quote: "T존만 좀 기름지거나, 그냥 평범하거나.\n큰 트러블 없이 살아왔는데\n관리하면 확실히 달라지는 피부야.",
  },
  oily_sensitive: {
    quote: "번들거리면서 트러블도 잘 나.\n지성인 줄 알고 강한 제품 썼다가\n더 예민해진 경험 있잖아.",
  },
  oily_strong: {
    quote: "번들거려도 트러블은 없어.\n모공이랑 피지가 고민이지\n예민하진 않아서 회복은 빠른 편.",
  },
};

export default function QuizResult() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tribe, setTribe] = useState<SkinTribe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("user_profiles")
      .select("skin_tribe")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setTribe((data?.skin_tribe as SkinTribe) ?? "combo_balanced");
        setLoading(false);
      });
  }, [user]);

  // OG meta
  useEffect(() => {
    if (!tribe) return;
    const info = SKIN_TRIBE_LABELS[tribe];
    document.title = `나는 ${info.name} | Bloom Log 피부족 테스트`;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("og:title", `나는 ${info.name} | Bloom Log 피부족 테스트`);
    setMeta("og:description", TRIBE_CARDS[tribe].quote.split("\n")[0]);
    setMeta("og:image", "/og-image.png");
    return () => {
      document.title = "Bloom Log";
    };
  }, [tribe]);

  const handleShare = async () => {
    const info = tribe ? SKIN_TRIBE_LABELS[tribe] : null;
    const text = info ? `나는 ${info.name}이래! 너는? bloomlog.kr/quiz` : "";
    try {
      if (navigator.share) {
        await navigator.share({ text, url: "https://bloomlog.kr/quiz" });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("링크가 복사되었어요!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("링크가 복사되었어요!");
      } catch {
        toast.error("공유에 실패했어요");
      }
    }
  };

  const handleRetakeQuiz = async () => {
    if (!user) return;
    await supabase.from("user_profiles").update({ quiz_completed_at: null }).eq("id", user.id);
    navigate("/quiz", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const effectiveTribe = tribe ?? "combo_balanced";
  const info = SKIN_TRIBE_LABELS[effectiveTribe];
  const card = TRIBE_CARDS[effectiveTribe];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center px-4 pt-[calc(var(--safe-top)+12px)] pb-3">
        <button onClick={() => navigate("/")} className="p-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-foreground pr-6">퀴즈 결과</h1>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center pt-8 pb-8 px-6 text-center">
        <div className="text-6xl mb-5">{info.emoji}</div>
        <p className="text-sm text-muted-foreground mb-1">나의 피부족은</p>
        <h1 className="text-2xl font-extrabold text-foreground mb-4">{info.name}</h1>

        {/* Quote card */}
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl px-6 py-5 shadow-sm">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line italic">"{card.quote}"</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-6 space-y-3 max-w-sm mx-auto w-full">
        {/* Main CTA */}
        <Button
          className="w-full rounded-xl h-13 text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
          onClick={handleShare}
        >
          <Link2 className="w-5 h-5 mr-2" />내 결과 공유하기
        </Button>

        {/* Sub CTA */}
        <Button
          variant="ghost"
          className="w-full rounded-xl h-11 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/skin-match")}
        >
          내 시술 궁합 보러가기 <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        {/* Retake */}
        <Button
          variant="outline"
          className="w-full rounded-xl h-10 text-xs text-muted-foreground border-border"
          onClick={handleRetakeQuiz}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          퀴즈 다시 하기
        </Button>

        <button
          onClick={() => navigate("/")}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          다음에 하기
        </button>
      </div>
    </div>
  );
}
