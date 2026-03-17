import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Clock,
  CalendarDays,
  Stethoscope,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ClinicSearchInput, { ClinicPlace } from "./ClinicSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// ─── Category metadata ───
const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  "리프팅·보톡스": { emoji: "✨", color: "border-purple-300 bg-purple-50" },
  "필러·실리프팅": { emoji: "🌙", color: "border-indigo-300 bg-indigo-50" },
  스킨부스터: { emoji: "💧", color: "border-cyan-300 bg-cyan-50" },
  "피부 관리": { emoji: "🌿", color: "border-green-300 bg-green-50" },
  "미백·색소": { emoji: "⚡", color: "border-amber-300 bg-amber-50" },
  "여드름·흉터": { emoji: "🔬", color: "border-rose-300 bg-rose-50" },
  지방분해: { emoji: "🔥", color: "border-orange-300 bg-orange-50" },
  제모: { emoji: "🪄", color: "border-slate-300 bg-slate-50" },
  "수액·영양주사": { emoji: "🌱", color: "border-teal-300 bg-teal-50" },
  "주사 관리": { emoji: "💉", color: "border-cyan-300 bg-cyan-50" },
  "탈모·두피": { emoji: "🌱", color: "border-teal-300 bg-teal-50" },
  기타: { emoji: "💊", color: "border-gray-300 bg-gray-50" },
};
const DEFAULT_CAT_META = { emoji: "💊", color: "border-gray-300 bg-gray-50" };

// ─── Category display order (same as AddTreatmentModal) ───
const CATEGORY_ORDER: string[] = [
  '리프팅·보톡스', '미백·색소', '스킨부스터', '피부 관리',
  '필러·실리프팅', '수액·영양주사', '주사 관리', '여드름·흉터',
  '지방분해', '제모', '탈모·두피', '기타',
  // fallback IDs
  'lifting', 'whitening', 'booster', 'skincare',
  'filler', 'iv', 'botox', 'acne',
  'fat', 'hair_removal',
];
const getCatOrder = (id: string) => {
  const idx = CATEGORY_ORDER.indexOf(id);
  return idx === -1 ? 999 : idx;
};

// Hardcoded fallback categories
const FALLBACK_CATEGORIES = [
  {
    id: "lifting",
    label: "레이저 리프팅",
    emoji: "✨",
    color: "border-purple-300 bg-purple-50",
    items: ["슈링크 유니버스", "울쎄라", "써마지 FLX", "인모드", "올리지오"],
  },
  {
    id: "botox",
    label: "보톡스/윤곽주사",
    emoji: "💉",
    color: "border-blue-300 bg-blue-50",
    items: ["보톡스", "윤곽주사"],
  },
  {
    id: "filler",
    label: "필러/실리프팅",
    emoji: "🌙",
    color: "border-indigo-300 bg-indigo-50",
    items: ["필러", "실리프팅", "스컬트라"],
  },
  {
    id: "booster",
    label: "스킨부스터",
    emoji: "💧",
    color: "border-cyan-300 bg-cyan-50",
    items: ["리쥬란 힐러", "쥬베룩", "물광주사", "포텐자"],
  },
  {
    id: "skincare",
    label: "피부관리",
    emoji: "🌿",
    color: "border-green-300 bg-green-50",
    items: ["스케일링", "아쿠아필", "비타민관리", "LED재생레이저"],
  },
  {
    id: "whitening",
    label: "미백/색소",
    emoji: "⚡",
    color: "border-amber-300 bg-amber-50",
    items: ["엑셀V", "피코토닝", "레이저토닝"],
  },
  {
    id: "acne",
    label: "여드름/점제거",
    emoji: "🔬",
    color: "border-rose-300 bg-rose-50",
    items: ["점 제거", "여드름 치료"],
  },
];

interface DisplayItem {
  id: string;
  name: string;
}
interface DisplayCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  items: DisplayItem[];
}

// Time slots
const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSaved?: () => void;
}

export default function AddReservationModal({ open, onClose, defaultDate, onSaved }: Props) {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Date & Time
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState<string | null>(null);

  // Step 2: Clinic
  const [clinic, setClinic] = useState("");
  const [clinicKakaoId, setClinicKakaoId] = useState<string | null>(null);
  const [clinicDistrict, setClinicDistrict] = useState<string | null>(null);
  const [clinicAddress, setClinicAddress] = useState<string | null>(null);

  // Step 3: Treatments (multiple)
  const [treatments, setTreatments] = useState<string[]>([]);
  const [catId, setCatId] = useState<string | null>(null);
  const [customTreatmentName, setCustomTreatmentName] = useState("");

  // Step 4: Memo
  const [memo, setMemo] = useState("");

  // DB categories
  const [dbOptions, setDbOptions] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("package_options")
      .select("id, category, name, category_en, name_en, category_zh, name_zh")
      .is("package_id", null)
      .eq("is_default", true)
      .order("category")
      .order("sort_order")
      .then(({ data, error }) => {
        if (!error && data?.length) setDbOptions(data);
        setDbLoading(false);
      });
  }, []);

  useEffect(() => {
    if (open && defaultDate) setDate(defaultDate);
  }, [open, defaultDate]);

  const displayCategories: DisplayCategory[] = useMemo(() => {
    const customLabel = language === "en" ? "Custom Input" : language === "zh" ? "自定义输入" : "직접 입력";

    if (dbOptions.length === 0) {
      return FALLBACK_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        emoji: c.emoji,
        color: c.color,
        items: [...c.items.map((name, i) => ({ id: `${c.id}_${i}`, name })), { id: "__custom", name: customLabel }],
      }));
    }

    const groups: Record<string, DisplayItem[]> = {};
    const catLabels: Record<string, string> = {};
    for (const opt of dbOptions) {
      const catKey = opt.category;
      const catLabel =
        language === "en"
          ? opt.category_en || opt.category
          : language === "zh"
            ? opt.category_zh || opt.category
            : opt.category;
      const itemName =
        language === "en" ? opt.name_en || opt.name : language === "zh" ? opt.name_zh || opt.name : opt.name;
      if (!groups[catKey]) {
        groups[catKey] = [];
        catLabels[catKey] = catLabel;
      }
      groups[catKey].push({ id: opt.id, name: itemName });
    }
    return Object.entries(groups).map(([catKey, items]) => {
      const meta = CATEGORY_META[catKey] || DEFAULT_CAT_META;
      return {
        id: catKey,
        label: catLabels[catKey],
        emoji: meta.emoji,
        color: meta.color,
        items: [...items, { id: "__custom", name: customLabel }],
      };
    }).sort((a, b) => getCatOrder(a.id) - getCatOrder(b.id));
  }, [dbOptions, language]);

  const selectedCat = displayCategories.find((c) => c.id === catId);

  const reset = () => {
    setStep(1);
    setDate(defaultDate || new Date().toISOString().split("T")[0]);
    setTime(null);
    setClinic("");
    setClinicKakaoId(null);
    setClinicDistrict(null);
    setClinicAddress(null);
    setCatId(null);
    setTreatments([]);
    setCustomTreatmentName("");
    setMemo("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectPlace = (place: ClinicPlace) => {
    setClinic(place.name);
    setClinicKakaoId(place.kakao_id || null);
    setClinicDistrict(place.road_address?.split(" ").slice(0, 2).join(" ") || null);
    setClinicAddress(place.road_address || place.address || null);
  };

  const canNext = () => {
    switch (step) {
      case 1:
        return !!date && !!time;
      case 2:
        return clinic.trim().length > 0;
      case 3:
        return treatments.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const addTreatment = (name: string) => {
    if (name && !treatments.includes(name)) {
      setTreatments((prev) => [...prev, name]);
    }
  };

  const removeTreatment = (name: string) => {
    setTreatments((prev) => prev.filter((t) => t !== name));
  };

  const addCustomTreatment = () => {
    const trimmed = customTreatmentName.trim();
    if (trimmed && !treatments.includes(trimmed)) {
      setTreatments((prev) => [...prev, trimmed]);
      setCustomTreatmentName("");
    }
  };

  const handleSave = async () => {
    if (treatments.length === 0) return;

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const rows = treatments.map((t) => ({
        user_id: user.id,
        date,
        time,
        clinic,
        clinic_kakao_id: clinicKakaoId,
        clinic_district: clinicDistrict,
        clinic_address: clinicAddress,
        treatment_name: t,
        memo: memo || null,
      }));

      const { error } = await supabase.from("reservations").insert(rows);

      if (error) throw error;
      toast.success(`예약 일정 ${treatments.length}건이 등록되었어요 📅`);
      handleClose();
      onSaved?.();
    } catch (err: any) {
      toast.error("저장 실패: " + (err.message || "알 수 없는 오류"));
    } finally {
      setSaving(false);
    }
  };

  const dateObj = new Date(date + "T00:00:00");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-0 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col [&>button:last-of-type]:hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-info" />
              예약 일정 등록
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {step} / {totalSteps}
              </span>
              <button
                onClick={handleClose}
                className="rounded-full p-1 hover:bg-accent transition-colors"
                aria-label="닫기"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn("h-1 flex-1 rounded-full transition-colors", i < step ? "bg-info" : "bg-muted")}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Step 1: Date & Time */}
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <CalendarDays className="h-3.5 w-3.5 text-info" /> 예약 날짜
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-info/40"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {format(dateObj, "yyyy년 M월 d일 EEEE", { locale: ko })}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <Clock className="h-3.5 w-3.5 text-info" /> 예약 시간
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-sm font-medium transition-all active:scale-95",
                        time === t
                          ? "bg-info text-info-foreground border-info shadow-sm"
                          : "border-border bg-card hover:bg-accent/50",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Clinic */}
          {step === 2 && (
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <Stethoscope className="h-3.5 w-3.5 text-info" /> 병원 선택
              </label>
              <ClinicSearchInput
                value={clinic}
                onChange={setClinic}
                onSelectPlace={handleSelectPlace}
                placeholder="병원명을 검색하세요"
              />
              {clinicAddress && <p className="text-xs text-muted-foreground mt-2 px-1">📍 {clinicAddress}</p>}
            </div>
          )}

          {/* Step 3: Treatment selection (multi) */}
          {step === 3 && (
            <div>
              {/* Selected treatments list */}
              {treatments.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    선택된 시술 ({treatments.length}건)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {treatments.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 rounded-full bg-info/10 border border-info/30 px-3 py-1.5 text-xs font-medium text-info"
                      >
                        {t}
                        <button onClick={() => removeTreatment(t)} className="hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!catId && (
                <>
                  <label className="text-sm font-semibold text-foreground mb-3 block">
                    시술 카테고리 선택
                    <span className="text-xs font-normal text-muted-foreground ml-2">여러 개 추가 가능</span>
                  </label>
                  {dbLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {displayCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCatId(cat.id)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all active:scale-95",
                            cat.color,
                          )}
                        >
                          <span className="text-xl">{cat.emoji}</span>
                          <span className="text-[11px] font-medium leading-tight text-center">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {catId && selectedCat && (
                <div>
                  <button onClick={() => setCatId(null)} className="text-xs text-info mb-3 flex items-center gap-1">
                    <ChevronLeft className="h-3 w-3" /> 시술 추가하기
                  </button>
                  <label className="text-sm font-semibold text-foreground mb-3 block">
                    {selectedCat.emoji} {selectedCat.label}
                  </label>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {selectedCat.items.map((item) => {
                      if (item.id === "__custom") {
                        return (
                          <div key="__custom" className="mt-2 flex gap-2">
                            <input
                              placeholder="시술명 직접 입력"
                              value={customTreatmentName}
                              onChange={(e) => setCustomTreatmentName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomTreatment();
                                }
                              }}
                              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-info/40"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={addCustomTreatment}
                              disabled={!customTreatmentName.trim()}
                              className="rounded-xl shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      }
                      const isSelected = treatments.includes(item.name);
                      return (
                        <button
                          key={item.id}
                          onClick={() => (isSelected ? removeTreatment(item.name) : addTreatment(item.name))}
                          className={cn(
                            "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all active:scale-[0.98]",
                            isSelected
                              ? "bg-info/10 border-info text-info font-semibold"
                              : "border-border bg-card hover:bg-accent/50",
                          )}
                        >
                          <span>{item.name}</span>
                          {isSelected && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Memo */}
          {step === 4 && (
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-info" /> 메모 (선택)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예약 관련 메모를 남겨보세요"
                rows={3}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-info/40"
              />

              {/* Summary preview */}
              <div className="mt-4 rounded-2xl bg-accent/30 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">예약 요약</p>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-info shrink-0" />
                  <span>
                    {format(dateObj, "yyyy년 M월 d일 (EEEE)", { locale: ko })} {time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-3.5 w-3.5 text-info shrink-0" />
                  <span>{clinic}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-info shrink-0 mt-0.5">💉</span>
                  <div className="flex flex-wrap gap-1.5">
                    {treatments.map((t) => (
                      <span
                        key={t}
                        className="inline-block rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-xl">
              <ChevronLeft className="h-4 w-4 mr-1" /> 이전
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex-1 rounded-xl bg-info hover:bg-info/90 text-info-foreground"
            >
              다음 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-info hover:bg-info/90 text-info-foreground"
            >
              {saving ? "저장 중..." : "예약 등록"} <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
