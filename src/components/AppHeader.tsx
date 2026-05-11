import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Globe, Plus, SunMoon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language, LANGUAGE_LABELS } from "@/i18n/translations";
import { useSeason, SeasonKey } from "@/context/SeasonContext";
import ParseTreatmentModal from "@/components/ParseTreatmentModal";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

interface AppHeaderProps {
  /** When provided, replaces the Bloomlog logo with a back button + title (sub-page style). */
  title?: string;
  /** Show a back chevron on the left when in title mode. Defaults to true when title is provided. */
  showBack?: boolean;
  onBack?: () => void;
}

const MODES: { key: SeasonKey; emoji: string; label: string }[] = [
  { key: "no_care", emoji: "💤", label: "Rest" },
  { key: "maintain", emoji: "💜", label: "Maintain" },
  { key: "boost", emoji: "🌹", label: "Boost" },
  { key: "special", emoji: "🌸", label: "Special" },
];

export default function AppHeader({ title, showBack = true, onBack }: AppHeaderProps) {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { currentSeason, setCurrentSeason } = useSeason();
  const [langOpen, setLangOpen] = useState(false);
  const [parseOpen, setParseOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Left */}
          {title ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {showBack && (
                <button
                  onClick={() => (onBack ? onBack() : navigate(-1))}
                  aria-label="뒤로"
                  className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground" />
                </button>
              )}
              <h1
                className="text-base font-extrabold tracking-tight text-foreground truncate"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                {title}
              </h1>
            </div>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 focus:outline-none active:opacity-70 transition-opacity"
            >
              <img src={logoImg} alt="Bloomlog" className="h-6 w-6 rounded-md object-cover" />
              <span
                className="text-base font-extrabold tracking-tight text-foreground"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                Bloomlog
              </span>
            </button>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setParseOpen(true)}
              aria-label="시술 추가"
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition"
            >
              <Plus className="h-5 w-5 text-foreground" strokeWidth={2.2} />
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="모드 변경"
                  className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition"
                >
                  <SunMoon className="h-5 w-5 text-foreground" strokeWidth={2} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={6} className="w-48 p-1 rounded-xl">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setCurrentSeason(m.key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors text-left",
                      currentSeason === m.key
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <span>{m.label} Mode</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                aria-label="언어 변경"
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition"
              >
                <Globe className="h-5 w-5 text-foreground" strokeWidth={2} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                  {(["ko", "en", "zh"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",
                        language === lang
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {LANGUAGE_LABELS[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {parseOpen && <ParseTreatmentModal onClose={() => setParseOpen(false)} />}
    </>
  );
}
