import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useRecords } from "@/context/RecordsContext";
import { SkinType, BodyArea, BODY_AREA_LABELS, SKIN_LAYER_LABELS } from "@/types/skin";
import {
  User,
  Target,
  AlertCircle,
  MapPin,
  Navigation,
  X,
  ClipboardList,
  Star,
  ChevronDown,
  ChevronUp,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Check,
  Settings,
  Share2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import logoImg from "@/assets/logo.png";
import { format, differenceInYears } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language, LANGUAGE_LABELS } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import { useSeason, SeasonKey } from "@/context/SeasonContext";
import { useNavigate, Link } from "react-router-dom";
import BloomAvatar from "@/components/BloomAvatar";
import { getBloomInfo, getActiveDays, STAGES } from "@/utils/bloomLevel";
import { Progress } from "@/components/ui/progress";

const skinTypes: SkinType[] = ["건성", "지성", "복합성", "민감성", "중성"];
// MECE 피부과 용어 기반 관리 관심사 (주요 고민 + 관리 목표 통합)
const skinCareInterests = [
  "모공/피지",
  "색소/톤",
  "탄력/리프팅",
  "주름",
  "트러블/여드름",
  "홍조/혈관",
  "보습/장벽",
  "흉터/자국",
  "다크서클",
  "제모",
  "바디컨투어링",
  "튼살",
];

const bodyAreaOptions: BodyArea[] = ["face", "neck", "arm", "leg", "abdomen", "back", "chest", "hip"];

const REGION_DATA: Record<string, Record<string, string[]>> = {
  서울특별시: {
    강남구: ["역삼동", "삼성동", "논현동", "청담동", "압구정동", "신사동", "대치동"],
    서초구: ["서초동", "반포동", "잠원동", "방배동"],
    송파구: ["잠실동", "문정동", "가락동", "석촌동"],
    강동구: ["천호동", "길동", "명일동", "상일동"],
    마포구: ["합정동", "망원동", "연남동", "상수동", "홍대입구"],
    용산구: ["이태원동", "한남동", "용산동", "후암동"],
    성동구: ["성수동", "왕십리", "옥수동", "금호동"],
    광진구: ["건대입구", "자양동", "구의동", "화양동"],
    동대문구: ["회기동", "전농동", "이문동", "장안동"],
    중랑구: ["면목동", "상봉동", "망우동", "신내동"],
    종로구: ["종로", "인사동", "삼청동", "혜화동", "창신동"],
    중구: ["명동", "을지로", "충무로", "신당동"],
    성북구: ["길음동", "정릉동", "돈암동", "석관동"],
    강북구: ["수유동", "미아동", "번동", "우이동"],
    도봉구: ["창동", "방학동", "도봉동"],
    노원구: ["상계동", "중계동", "하계동", "월계동"],
    은평구: ["불광동", "녹번동", "응암동", "구산동"],
    서대문구: ["신촌동", "홍제동", "남가좌동", "북가좌동"],
    양천구: ["목동", "신정동"],
    강서구: ["마곡동", "화곡동", "방화동", "개화동"],
    구로구: ["구로동", "고척동", "개봉동", "오류동", "항동"],
    금천구: ["시흥동", "독산동", "가산동"],
    영등포구: ["여의도동", "영등포동", "당산동", "문래동"],
    동작구: ["노량진동", "사당동", "상도동", "흑석동"],
    관악구: ["신림동", "봉천동", "낙성대"],
  },
  경기도: {
    "성남시 분당구": ["서현동", "정자동", "판교동"],
    "성남시 수정구": ["태평동", "수진동"],
    "성남시 중원구": ["성남동", "금광동"],
    "수원시 팔달구": ["인계동", "매산동"],
    "수원시 영통구": ["영통동", "광교"],
    "수원시 권선구": ["권선동", "세류동"],
    "수원시 장안구": ["정자동", "연무동"],
    "고양시 일산동구": ["정발산동", "마두동"],
    "고양시 일산서구": ["주엽동", "대화동"],
    "고양시 덕양구": ["화정동", "행신동"],
    "용인시 수지구": ["동천동", "성복동"],
    "용인시 기흥구": ["구성동", "신갈동"],
    "안양시 동안구": ["평촌동", "비산동"],
    "안양시 만안구": ["안양동", "박달동"],
    부천시: ["상동", "중동", "소사동"],
    광명시: ["철산동", "하안동"],
    시흥시: ["정왕동", "배곧동"],
    "안산시 단원구": ["고잔동", "선부동"],
    "안산시 상록구": ["사동", "본오동"],
    남양주시: ["다산동", "별내동"],
    하남시: ["미사동", "풍산동", "위례"],
    화성시: ["동탄", "병점"],
    오산시: ["원동", "세마동"],
    평택시: ["비전동", "모곡동"],
    파주시: ["운정동", "금촌동"],
    김포시: ["장기동", "구래동"],
    의정부시: ["의정부동", "가능동"],
    포천시: ["신읍동", "소흘읍"],
    이천시: ["중리동", "관고동"],
    광주시: ["경안동", "오포읍"],
  },
  인천광역시: {
    연수구: ["송도동", "동춘동", "연수동"],
    남동구: ["구월동", "간석동", "논현동"],
    부평구: ["부평동", "십정동"],
    서구: ["청라동", "검단동"],
    미추홀구: ["주안동", "숭의동"],
    계양구: ["계산동", "작전동"],
    중구: ["운서동", "신포동"],
  },
  부산광역시: {
    해운대구: ["우동", "중동", "좌동", "반여동"],
    부산진구: ["서면", "부전동", "전포동"],
    수영구: ["광안동", "남천동", "민락동"],
    남구: ["대연동", "용호동"],
    사하구: ["하단동", "괴정동"],
    동래구: ["명륜동", "온천동"],
    북구: ["화명동", "덕천동"],
    강서구: ["명지동", "대저동"],
    연제구: ["연산동", "거제동"],
    기장군: ["기장읍", "정관읍"],
  },
  대구광역시: {
    수성구: ["범어동", "만촌동", "수성동"],
    중구: ["동성로", "삼덕동"],
    달서구: ["월성동", "상인동", "성당동"],
    동구: ["신암동", "신천동"],
    북구: ["칠성동", "침산동"],
    달성군: ["다사읍", "화원읍"],
  },
  울산광역시: {
    남구: ["삼산동", "달동", "옥동"],
    북구: ["진장동", "명촌동"],
    중구: ["성남동", "학성동"],
    동구: ["일산동", "방어동"],
    울주군: ["언양읍", "온산읍"],
  },
  대전광역시: {
    서구: ["둔산동", "월평동", "갈마동"],
    유성구: ["봉명동", "궁동", "노은동"],
    중구: ["대흥동", "은행동"],
    동구: ["용전동", "판암동"],
    대덕구: ["법동", "중리동"],
  },
  광주광역시: {
    서구: ["치평동", "농성동", "상무동"],
    동구: ["충장로", "금남로"],
    남구: ["봉선동", "주월동"],
    북구: ["용봉동", "운암동"],
    광산구: ["수완동", "첨단동"],
  },
  세종특별자치시: {
    세종시: ["어진동", "도담동", "새롬동", "아름동"],
  },
  강원도: {
    춘천시: ["효자동", "퇴계동", "석사동"],
    원주시: ["단계동", "무실동", "혁신도시"],
    강릉시: ["교동", "포남동", "내곡동"],
    동해시: ["천곡동", "송정동"],
    속초시: ["조양동", "교동"],
    삼척시: ["남양동", "교동"],
  },
  충청북도: {
    "청주시 흥덕구": ["가경동", "복대동"],
    "청주시 청원구": ["내덕동", "율량동"],
    "청주시 상당구": ["용암동", "방서동"],
    충주시: ["호암동", "연수동"],
    제천시: ["의림동", "화산동"],
    음성군: ["음성읍", "금왕읍"],
    진천군: ["진천읍", "덕산읍"],
  },
  충청남도: {
    "천안시 서북구": ["불당동", "두정동", "성정동"],
    "천안시 동남구": ["신부동", "청룡동"],
    아산시: ["온양동", "배방읍", "탕정면"],
    서산시: ["동문동", "읍내동"],
    당진시: ["당진동", "합덕읍"],
    홍성군: ["홍성읍", "광천읍"],
    논산시: ["논산동", "강경읍"],
    공주시: ["반죽동", "웅진동"],
  },
  전라북도: {
    "전주시 완산구": ["효자동", "서신동", "삼천동"],
    "전주시 덕진구": ["금암동", "송천동"],
    익산시: ["영등동", "모현동"],
    군산시: ["나운동", "수송동"],
    완주군: ["삼례읍", "이서면"],
    정읍시: ["시기동", "연지동"],
    남원시: ["도통동", "향교동"],
  },
  전라남도: {
    순천시: ["조례동", "풍덕동", "신대동"],
    여수시: ["돌산읍", "문수동"],
    광양시: ["중마동", "광영동"],
    목포시: ["상동", "옥암동", "하당동"],
    나주시: ["빛가람동", "남평읍"],
    화순군: ["화순읍", "능주면"],
  },
  경상북도: {
    "포항시 남구": ["대잠동", "오천읍"],
    "포항시 북구": ["흥해읍", "죽도동"],
    경주시: ["황성동", "안강읍"],
    구미시: ["원평동", "형곡동"],
    안동시: ["명륜동", "옥동"],
    경산시: ["중방동", "진량읍"],
    칠곡군: ["왜관읍", "북삼읍"],
  },
  경상남도: {
    "창원시 성산구": ["상남동", "중앙동"],
    "창원시 의창구": ["팔용동", "봉림동"],
    "창원시 마산합포구": ["월포동", "신포동"],
    "창원시 마산회원구": ["합성동", "양덕동"],
    "창원시 진해구": ["석동", "태백동"],
    김해시: ["부원동", "장유동"],
    진주시: ["초전동", "상대동"],
    양산시: ["물금읍", "호계동"],
    거제시: ["옥포동", "고현동"],
    통영시: ["무전동", "도남동"],
  },
  제주특별자치도: {
    제주시: ["연동", "노형동", "이도동", "아라동"],
    서귀포시: ["중문동", "대정읍", "성산읍"],
  },
};

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: 1 | 2 | 3 | 4 | 5) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly && !onChange}
          className={cn("p-0.5 transition-colors", !readonly && "cursor-pointer")}
          onClick={() => onChange?.(star as 1 | 2 | 3 | 4 | 5)}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              star <= value ? "fill-amber text-amber" : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

const Profile = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { nickname, setNickname } = useSeason();
  const [skinType, setSkinType] = useState<SkinType>("중성");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [targetAreas, setTargetAreas] = useState<BodyArea[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const { currentSeason, setCurrentSeason: setSeasonGlobal } = useSeason();
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedGugun, setSelectedGugun] = useState("");

  const { records, updateRecord } = useRecords();
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<Record<string, string>>({});

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records],
  );

  const age = useMemo(() => {
    if (!birthDate) return null;
    return differenceInYears(new Date("2026-03-08"), birthDate);
  }, [birthDate]);

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addRegion = () => {
    if (!selectedSido || !selectedGugun) return;
    const full = `${selectedSido} ${selectedGugun}`;
    if (!regions.includes(full)) {
      setRegions([...regions, full]);
    }
    setSelectedSido("");
    setSelectedGugun("");
  };

  const removeRegion = (region: string) => {
    setRegions(regions.filter((r) => r !== region));
  };

  const gugunOptions = selectedSido ? Object.keys(REGION_DATA[selectedSido] || {}) : [];

  const updateSatisfaction = async (id: string, satisfaction: 1 | 2 | 3 | 4 | 5) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;
    await updateRecord(id, { ...rec, satisfaction });
  };

  const updateMemo = async (id: string) => {
    const memo = editingMemo[id];
    if (memo !== undefined) {
      const rec = records.find((r) => r.id === id);
      if (rec) await updateRecord(id, { ...rec, memo });
      setEditingMemo((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const profileLoaded = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const [bloomStage, setBloomStage] = useState(1);
  const [totalLogCount, setTotalLogCount] = useState(0);

  // ── Supabase 프로필 로드 ─────────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;
      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
      if (error || !data) {
        profileLoaded.current = true;
        return;
      }
      if (data.skin_type) setSkinType(data.skin_type as SkinType);
      if (data.birth_date) setBirthDate(new Date(data.birth_date));
      if (data.concerns) setConcerns(data.concerns as string[]);
      if (data.goals) setGoals(data.goals as string[]);
      if (data.target_areas) setTargetAreas(data.target_areas as BodyArea[]);
      if (data.regions) setRegions(data.regions as string[]);
      // current_season은 SeasonContext에서 관리하므로 여기서 로드하지 않음
      if (data.name) setNickname(data.name);
      setBloomStage(data.bloom_stage || 1);
      setTotalLogCount(data.total_log_count || 0);
      // 로드 완료 후 다음 렌더부터 자동저장 활성화
      requestAnimationFrame(() => {
        profileLoaded.current = true;
      });
    };
    loadProfile();
  }, []);

  // ── Supabase 프로필 자동저장 ─────────────────────────────────────────
  useEffect(() => {
    // 프로필 로드 완료 전에는 저장하지 않음
    if (!profileLoaded.current) return;
    const userId = userIdRef.current;
    if (!userId) return;

    setSaved(false);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          name: nickname || null,
          skin_type: skinType,
          birth_date: birthDate ? birthDate.toISOString().split("T")[0] : null,
          concerns,
          goals,
          target_areas: targetAreas,
          regions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        console.error("프로필 저장 실패:", error);
      }
    }, 600);
    return () => clearTimeout(saveTimeout.current);
  }, [nickname, skinType, birthDate, concerns, goals, targetAreas, regions]);

  const avgSatisfaction = useMemo(() => {
    const rated = records.filter((r) => r.satisfaction);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / rated.length;
  }, [records]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative safe-top">
        <img
          src={logoImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: "inset(0)" }}
        />
        <div className="absolute inset-0 bg-black/40" style={{ clipPath: "inset(0)" }} />
        <div
          className="page-header-gradient relative z-10 flex items-center justify-between"
          style={{ background: "transparent" }}
        >
          <h1 className="text-lg font-bold text-justify">{nickname ? `${nickname}님의 페이지` : t("my_page")}</h1>
        </div>
      </div>

      {/* ── Bloom Stage Badge ── */}
      {(() => {
        const BLOOM_STAGES = [
          {
            stage: 1,
            emoji: "🌱",
            ko: "씨앗",
            en: "Seed",
            zh: "种子",
            color: "bg-gray-100 text-gray-600 border-gray-300",
          },
          {
            stage: 2,
            emoji: "🌿",
            ko: "새싹",
            en: "Sprout",
            zh: "嫩芽",
            color: "bg-green-100 text-green-700 border-green-300",
          },
          {
            stage: 3,
            emoji: "🌼",
            ko: "봉오리",
            en: "Bud",
            zh: "花蕾",
            color: "bg-yellow-100 text-yellow-700 border-yellow-300",
          },
          {
            stage: 4,
            emoji: "🌸",
            ko: "반개화",
            en: "Blooming",
            zh: "含苞待放",
            color: "bg-pink-100 text-pink-700 border-pink-300",
          },
          {
            stage: 5,
            emoji: "✨",
            ko: "Bloom",
            en: "Bloom",
            zh: "盛放",
            color: "bg-amber-100 text-amber-700 border-amber-300",
          },
        ];
        const STAGE_THRESHOLDS = [0, 1, 6, 16, 30];
        const current = BLOOM_STAGES[bloomStage - 1] || BLOOM_STAGES[0];
        const stageName = language === "en" ? current.en : language === "zh" ? current.zh : current.ko;

        const nextThreshold = bloomStage < 5 ? STAGE_THRESHOLDS[bloomStage] : null;
        const remaining = nextThreshold !== null ? Math.max(0, nextThreshold - totalLogCount) : 0;

        const recordingText =
          language === "en"
            ? `Recording #${totalLogCount}`
            : language === "zh"
              ? `第${totalLogCount}次记录`
              : `${totalLogCount}번째 기록 중`;

        const maxText = language === "en" ? "Max Level Reached" : language === "zh" ? "已达最高等级" : "최고 등급 달성";

        const remainingText =
          language === "en"
            ? `${remaining} more to next level`
            : language === "zh"
              ? `距下一等级还需${remaining}条`
              : `다음 단계까지 ${remaining}건`;

        const progressPct =
          bloomStage >= 5
            ? 100
            : nextThreshold !== null
              ? Math.min(
                  ((totalLogCount - STAGE_THRESHOLDS[bloomStage - 1]) /
                    (nextThreshold - STAGE_THRESHOLDS[bloomStage - 1])) *
                    100,
                  100,
                )
              : 100;

        return (
          <div className="px-4 pt-3 pb-1 space-y-2">
            <div className="flex items-start gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="focus:outline-none">
                    <BloomAvatar size="md" showDays={false} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-52 rounded-xl border-0 bg-black/70 backdrop-blur-md text-white p-3 shadow-xl"
                  sideOffset={8}
                >
                  <p className="text-[11px] font-semibold mb-2 text-white/80">🌱 등급 기준</p>
                  <ul className="space-y-1 text-[11px]">
                    {BLOOM_STAGES.map((s, idx) => {
                      const name = language === "en" ? s.en : language === "zh" ? s.zh : s.ko;
                      const threshold = STAGE_THRESHOLDS[idx];
                      const nextT = idx < 4 ? STAGE_THRESHOLDS[idx + 1] - 1 : null;
                      const rangeText = idx === 0 ? "0건" : idx === 4 ? `${threshold}건+` : `${threshold}~${nextT}건`;
                      return (
                        <li key={s.stage} className={bloomStage === s.stage ? "text-accent font-semibold" : ""}>
                          {s.emoji} {name} — {rangeText}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-[10px] text-white/50">
                    {language === "en"
                      ? "Based on total records"
                      : language === "zh"
                        ? "基于总记录数"
                        : "총 기록 수 기준"}
                  </p>
                </PopoverContent>
              </Popover>

              <div className="flex-1 space-y-2">
                {/* Badge + recording count */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold",
                      current.color,
                    )}
                  >
                    {current.emoji} {stageName}
                  </span>
                  <span className="text-xs text-muted-foreground">{recordingText}</span>
                  <button
                    type="button"
                    className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    onClick={async () => {
                      const shareText = `${nickname || "사용자"}님의 관리 레벨: ${stageName} 🌸 피부과도 앱으로 관리하는 편 — Bloomlog`;
                      const shareData = { title: "Bloomlog 🌸", text: shareText, url: "https://bloomlog.kr" };
                      if (navigator.share) {
                        try { await navigator.share(shareData); } catch {}
                      } else {
                        try {
                          await navigator.clipboard.writeText(`${shareText}\nhttps://bloomlog.kr`);
                          toast({ title: "복사됐어요!", duration: 1500 });
                        } catch {}
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  {bloomStage < 5 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{remainingText}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {totalLogCount}/{nextThreshold}
                        </span>
                      </div>
                      <Progress value={progressPct} className="h-2" />
                    </>
                  ) : (
                    <div className="text-[10px] font-semibold text-rose">✨ {maxText}</div>
                  )}

                  {/* Journey line */}
                  <div className="flex items-center justify-between gap-0.5">
                    {BLOOM_STAGES.map((s, idx) => {
                      const name = language === "en" ? s.en : language === "zh" ? s.zh : s.ko;
                      return (
                        <span
                          key={s.stage}
                          className={cn(
                            "text-[9px] font-medium transition-colors whitespace-nowrap",
                            idx + 1 < bloomStage
                              ? "text-muted-foreground"
                              : idx + 1 === bloomStage
                                ? "font-bold"
                                : "text-muted-foreground/40",
                          )}
                          style={idx + 1 === bloomStage ? { color: "hsl(var(--rose))" } : undefined}
                        >
                          {idx + 1 < bloomStage ? "✅" : s.emoji} {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="page-content pt-2">
        <div className="space-y-3">
          {/* ── 기본 정보 ── */}
          <Card className="glass-card">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
                <h2 className="font-bold text-sm">프로필</h2>
              </div>

              {/* 닉네임 */}
              <div className="space-y-2">
                <Label className="text-xs">닉네임</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  className="rounded-xl text-sm"
                  maxLength={20}
                />
              </div>

              {/* 생년월일 */}
              <div className="space-y-2">
                <Label className="text-xs">{t("birth_date")}</Label>
                <div className="flex gap-2">
                  <Select
                    value={birthDate ? String(birthDate.getFullYear()) : ""}
                    onValueChange={(y) => {
                      const prev = birthDate || new Date(1994, 0, 1);
                      const maxDay = new Date(Number(y), prev.getMonth() + 1, 0).getDate();
                      setBirthDate(new Date(Number(y), prev.getMonth(), Math.min(prev.getDate(), maxDay)));
                    }}
                  >
                    <SelectTrigger className="rounded-xl text-xs h-10 flex-1">
                      <SelectValue placeholder="년도 선택" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from(
                        { length: new Date().getFullYear() - 1939 },
                        (_, i) => new Date().getFullYear() - i,
                      ).map((y) => (
                        <SelectItem key={y} value={String(y)} className="text-xs">
                          {y}년
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={birthDate ? String(birthDate.getMonth() + 1) : ""}
                    onValueChange={(m) => {
                      const prev = birthDate || new Date(new Date().getFullYear() - 30, 0, 1);
                      const month = Number(m) - 1;
                      const maxDay = new Date(prev.getFullYear(), month + 1, 0).getDate();
                      setBirthDate(new Date(prev.getFullYear(), month, Math.min(prev.getDate(), maxDay)));
                    }}
                    disabled={!birthDate}
                  >
                    <SelectTrigger className="rounded-xl text-xs h-10 w-20">
                      <SelectValue placeholder="월" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)} className="text-xs">
                          {m}월
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={birthDate ? String(birthDate.getDate()) : ""}
                    onValueChange={(d) => {
                      const prev = birthDate || new Date(new Date().getFullYear() - 30, 0, 1);
                      setBirthDate(new Date(prev.getFullYear(), prev.getMonth(), Number(d)));
                    }}
                    disabled={!birthDate}
                  >
                    <SelectTrigger className="rounded-xl text-xs h-10 w-20">
                      <SelectValue placeholder="일" />
                    </SelectTrigger>
                    <SelectContent className="max-h-52">
                      {Array.from(
                        {
                          length: birthDate
                            ? new Date(birthDate.getFullYear(), birthDate.getMonth() + 1, 0).getDate()
                            : 31,
                        },
                        (_, i) => i + 1,
                      ).map((d) => (
                        <SelectItem key={d} value={String(d)} className="text-xs">
                          {d}일
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {age !== null && (
                  <div className="shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-xl">
                    <span className="text-sm font-bold">
                      {t("age_prefix")}
                      {age}
                      {t("age_suffix")}
                    </span>
                  </div>
                )}
              </div>

              {/* 주요 활동 지역 */}
              <div className="space-y-3 pt-1 border-t border-border">
                <div className="flex items-center gap-2 pt-3">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-xs">{t("active_regions")}</h3>
                    <p className="text-[10px] text-muted-foreground">{t("region_desc")}</p>
                  </div>
                </div>

                {regions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {regions.map((r) => (
                      <Badge
                        key={r}
                        variant="default"
                        className="rounded-full px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        {r}
                        <X className="h-3 w-3 cursor-pointer tap-target" onClick={() => removeRegion(r)} />
                      </Badge>
                    ))}
                  </div>
                )}

                {regions.length < 7 && (
                  <>
                    <p className="text-[10px] text-muted-foreground px-0.5">{t("dense_areas")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "서울특별시 강남구",
                        "서울특별시 서초구",
                        "서울특별시 송파구",
                        "경기도 성남시 분당구",
                        "부산광역시 해운대구",
                      ]
                        .filter((r) => !regions.includes(r))
                        .map((r) => (
                          <Badge
                            key={r}
                            variant="outline"
                            className="cursor-pointer transition-all tap-target rounded-full px-3 py-1.5 text-xs"
                            onClick={() => regions.length < 7 && setRegions([...regions, r])}
                          >
                            {r.replace("특별시 ", " ").replace("광역시 ", " ").replace("도 ", " ")}
                          </Badge>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t("sido")}</Label>
                        <Select
                          value={selectedSido}
                          onValueChange={(v) => {
                            setSelectedSido(v);
                            setSelectedGugun("");
                          }}
                        >
                          <SelectTrigger className="rounded-xl text-xs h-9">
                            <SelectValue placeholder={t("sido")} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(REGION_DATA).map((sido) => (
                              <SelectItem key={sido} value={sido} className="text-xs">
                                {sido}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t("gugun")}</Label>
                        <Select
                          value={selectedGugun}
                          onValueChange={(v) => {
                            setSelectedGugun(v);
                            if (selectedSido && v) {
                              const full = `${selectedSido} ${v}`;
                              if (!regions.includes(full) && regions.length < 7) {
                                setRegions((prev) => [...prev, full]);
                              }
                              setSelectedSido("");
                              setSelectedGugun("");
                            }
                          }}
                          disabled={!selectedSido}
                        >
                          <SelectTrigger className="rounded-xl text-xs h-9">
                            <SelectValue placeholder={t("gugun")} />
                          </SelectTrigger>
                          <SelectContent>
                            {gugunOptions.map((gu) => (
                              <SelectItem key={gu} value={gu} className="text-xs">
                                {gu}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl text-xs tap-target"
                      onClick={addRegion}
                      disabled={!selectedSido || !selectedGugun}
                    >
                      + {t("add_region")} ({regions.length}/7)
                    </Button>
                  </>
                )}
                {regions.length >= 7 && (
                  <p className="text-[11px] text-muted-foreground text-center py-1">{t("max_region")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── 현재 관리 모드 ── */}
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                  <Target className="h-4 w-4 text-accent-foreground" />
                </div>
                <h2 className="font-bold text-sm">현재 관리 모드</h2>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(
                  [
                    {
                      key: "reset",
                      emoji: "🌵",
                      title: "Reset Mode",
                      sub: "피부 리셋 모드",
                      desc: "최근 시술이 많았거나 피부를 쉬게 하고 싶을 때. 홈케어 중심으로 피부 균형 회복.",
                    },
                    {
                      key: "recovery",
                      emoji: "🌿",
                      title: "Recovery Mode",
                      sub: "회복 모드",
                      desc: "시술 후 예민해진 피부를 진정시키고 피부 장벽을 회복하는 관리 단계.",
                    },
                    {
                      key: "maintain",
                      emoji: "💜",
                      title: "Maintain Mode",
                      sub: "유지 모드",
                      desc: "현재 피부 컨디션을 안정적으로 유지하기 위한 기본 관리 단계.",
                    },
                    {
                      key: "boost",
                      emoji: "🌹",
                      title: "Boost Mode",
                      sub: "관리 끌올 모드",
                      desc: "피부톤, 탄력, 수분 등 피부 상태를 한 단계 끌어올리는 집중 관리 단계.",
                    },
                    {
                      key: "special",
                      emoji: "🌸",
                      title: "Special Mode",
                      sub: "스페셜 모드",
                      desc: "웨딩, 촬영, 중요한 모임 등 특별한 이벤트를 위한 최고 집중 관리 단계.",
                    },
                  ] as const
                ).map(({ key, emoji, title, sub, desc }) => {
                  const isSelected = currentSeason === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSeasonGlobal(isSelected ? ("maintain" as SeasonKey) : (key as SeasonKey))}
                      className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${
                        isSelected
                          ? "border-amber/60 bg-amber/10"
                          : "border-border bg-muted hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base shrink-0">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isSelected ? "text-amber" : "text-foreground"}`}>
                              {title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{sub}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                            isSelected ? "border-amber bg-amber" : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── 관리 세팅 ── */}
          <Card className="glass-card">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                  <Settings className="h-4 w-4 text-accent-foreground" />
                </div>
                <h2 className="font-bold text-sm">관리 세팅</h2>
              </div>

              {/* 피부 타입 */}
              <div className="space-y-2">
                <Label className="text-xs">{t("skin_type")}</Label>
                <Select value={skinType} onValueChange={(v) => setSkinType(v as SkinType)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skinTypes.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 주요 관심사 (고민 + 목표 통합, MECE) */}
              <div className="space-y-2">
                <Label className="text-xs">주요 관심사</Label>
                <p className="text-[10px] text-muted-foreground -mt-1">관리하고 싶은 피부 고민을 선택하세요</p>
                <div className="flex flex-wrap gap-2">
                  {skinCareInterests.map((item) => (
                    <Badge
                      key={item}
                      variant={concerns.includes(item) ? "default" : "outline"}
                      className="cursor-pointer transition-all tap-target rounded-full px-3 py-1.5 text-xs"
                      onClick={() => toggleItem(concerns, item, setConcerns)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full rounded-xl text-sm text-muted-foreground gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>

          {/* Terms & Privacy Links */}
          <div className="border-t mt-4 pt-4 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs">
              <Link to="/terms" className="text-muted-foreground underline-offset-2 hover:underline">
                {t("terms_title")}
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link to="/privacy" className="text-muted-foreground underline-offset-2 hover:underline">
                {t("privacy_title")}
              </Link>
            </div>
            <button
              onClick={() => setDeleteOpen(true)}
              className="text-xs text-destructive hover:underline underline-offset-2 text-center w-full"
            >
              {t("delete_account")}
            </button>
            <p className="text-xs text-muted-foreground text-center">v1.0.0-beta</p>
          </div>

          {/* Auto-save indicator */}
          <div
            className={cn(
              "text-center text-xs py-2 transition-opacity duration-300",
              saved ? "opacity-100 text-sage-dark" : "opacity-0",
            )}
          >
            {t("auto_saved")}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_account_confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_account_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  const {
                    data: { session },
                  } = await supabase.auth.refreshSession();
                  if (!session) {
                    console.error("세션이 없습니다.");
                    navigate("/");
                    return;
                  }
                  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session.access_token}` },
                  });
                  if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "탈퇴 처리 중 오류가 발생했습니다.");
                  }
                  await supabase.auth.signOut();
                  navigate("/farewell");
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : "탈퇴 처리 중 오류가 발생했습니다.";
                  console.error("탈퇴 실패", message);
                }
              }}
            >
              {t("delete_account")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
