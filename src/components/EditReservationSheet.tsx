import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Stethoscope, Check, ChevronLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import ClinicSearchInput, { ClinicPlace } from "./ClinicSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Time slots 07:00–22:00, 30min ───
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

// ─── Category metadata & order ───
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

const CATEGORY_ORDER: string[] = [
  '리프팅·보톡스', '미백·색소', '스킨부스터', '피부 관리',
  '필러·실리프팅', '수액·영양주사', '주사 관리', '여드름·흉터',
  '지방분해', '제모', '탈모·두피', '기타',
];
const getCatOrder = (id: string) => {
  const idx = CATEGORY_ORDER.indexOf(id);
  return idx === -1 ? 999 : idx;
};

interface DisplayItem { id: string; name: string; }
interface DisplayCategory { id: string; label: string; emoji: string; color: string; items: DisplayItem[]; }

interface Reservation {
  id: string;
  date: string;
  time: string | null;
  treatment_name: string;
  clinic: string;
  memo: string | null;
  body_area: string | null;
  skin_layer: string | null;
  clinic_kakao_id?: string | null;
  clinic_district?: string | null;
  clinic_address?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onSaved?: () => void;
}

export default function EditReservationSheet({ open, onClose, reservation, onSaved }: Props) {
  const { language } = useLanguage();
  const [clinic, setClinic] = useState("");
  const [clinicKakaoId, setClinicKakaoId] = useState<string | null>(null);
  const [clinicDistrict, setClinicDistrict] = useState<string | null>(null);
  const [clinicAddress, setClinicAddress] = useState<string | null>(null);
  const [treatmentName, setTreatmentName] = useState("");
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Two-step treatment picker
  const [showTreatmentPicker, setShowTreatmentPicker] = useState(false);
  const [catId, setCatId] = useState<string | null>(null);
  const [customTreatmentName, setCustomTreatmentName] = useState("");

  const [dbOptions, setDbOptions] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

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
    if (reservation && open) {
      setClinic(reservation.clinic);
      setClinicKakaoId(reservation.clinic_kakao_id || null);
      setClinicDistrict(reservation.clinic_district || null);
      setClinicAddress(reservation.clinic_address || null);
      setTreatmentName(reservation.treatment_name);
      setTime(reservation.time || null);
      setShowTreatmentPicker(false);
      setCatId(null);
      setCustomTreatmentName("");
    }
  }, [reservation, open]);

  const displayCategories: DisplayCategory[] = useMemo(() => {
    const customLabel = language === "en" ? "Custom Input" : language === "zh" ? "自定义输入" : "직접 입력";
    if (dbOptions.length === 0) return [];
    const groups: Record<string, DisplayItem[]> = {};
    const catLabels: Record<string, string> = {};
    for (const opt of dbOptions) {
      const catKey = opt.category;
      const catLabel = language === "en" ? opt.category_en || opt.category : language === "zh" ? opt.category_zh || opt.category : opt.category;
      const itemName = language === "en" ? opt.name_en || opt.name : language === "zh" ? opt.name_zh || opt.name : opt.name;
      if (!groups[catKey]) { groups[catKey] = []; catLabels[catKey] = catLabel; }
      groups[catKey].push({ id: opt.id, name: itemName });
    }
    return Object.entries(groups).map(([catKey, items]) => {
      const meta = CATEGORY_META[catKey] || DEFAULT_CAT_META;
      return { id: catKey, label: catLabels[catKey], emoji: meta.emoji, color: meta.color, items: [...items, { id: "__custom", name: customLabel }] };
    }).sort((a, b) => getCatOrder(a.id) - getCatOrder(b.id));
  }, [dbOptions, language]);

  const selectedCat = displayCategories.find((c) => c.id === catId);

  const handleSelectPlace = (place: ClinicPlace) => {
    setClinic(place.name);
    setClinicKakaoId(place.kakao_id || null);
    setClinicDistrict(place.road_address?.split(" ").slice(0, 2).join(" ") || null);
    setClinicAddress(place.road_address || place.address || null);
  };

  const handleSelectTreatment = (name: string) => {
    setTreatmentName(name);
    setShowTreatmentPicker(false);
    setCatId(null);
  };

  const handleCustomTreatmentConfirm = () => {
    if (customTreatmentName.trim()) {
      setTreatmentName(customTreatmentName.trim());
      setCustomTreatmentName("");
      setShowTreatmentPicker(false);
      setCatId(null);
    }
  };

  const handleSave = async () => {
    if (!reservation || !clinic.trim() || !treatmentName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          clinic,
          clinic_kakao_id: clinicKakaoId,
          clinic_district: clinicDistrict,
          clinic_address: clinicAddress,
          treatment_name: treatmentName,
          time,
        })
        .eq("id", reservation.id);
      if (error) throw error;
      toast.success("예약이 수정되었어요 ✏️");
      onClose();
      onSaved?.();
    } catch (err: any) {
      toast.error("수정 실패: " + (err.message || "알 수 없는 오류"));
    } finally {
      setSaving(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 gap-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base font-semibold">예약 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-5 py-4">
          {/* 병원 */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Stethoscope className="h-3.5 w-3.5 text-info" /> 병원
            </label>
            <ClinicSearchInput
              value={clinic}
              onChange={setClinic}
              onSelectPlace={handleSelectPlace}
              placeholder="병원명을 검색하세요"
            />
            {clinicAddress && (
              <p className="text-xs text-muted-foreground mt-1.5 px-1">📍 {clinicAddress}</p>
            )}
          </div>

          {/* 시술명 - 2단계 선택 */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Stethoscope className="h-3.5 w-3.5 text-info" /> 시술명
            </label>

            {!showTreatmentPicker ? (
              <button
                onClick={() => setShowTreatmentPicker(true)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm text-left transition-all",
                  treatmentName
                    ? "border-info bg-info/5 font-medium text-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {treatmentName || "시술을 선택하세요"}
              </button>
            ) : !catId ? (
              /* Step 1: Category grid */
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  시술 카테고리 선택
                </label>
                {dbLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
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
                {treatmentName && (
                  <button
                    onClick={() => setShowTreatmentPicker(false)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    취소
                  </button>
                )}
              </div>
            ) : selectedCat ? (
              /* Step 2: Items in selected category */
              <div>
                <button
                  onClick={() => setCatId(null)}
                  className="text-xs text-info mb-3 flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" /> 카테고리 선택
                </button>
                <label className="text-sm font-semibold text-foreground mb-3 block">
                  {selectedCat.emoji} {selectedCat.label}
                </label>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
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
                                handleCustomTreatmentConfirm();
                              }
                            }}
                            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-info/40"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={handleCustomTreatmentConfirm}
                            disabled={!customTreatmentName.trim()}
                            className="rounded-xl shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTreatment(item.name)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all active:scale-[0.98]",
                          treatmentName === item.name
                            ? "bg-info/10 border-info text-info font-semibold"
                            : "border-border bg-card hover:bg-accent/50",
                        )}
                      >
                        <span>{item.name}</span>
                        {treatmentName === item.name && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* 시간 */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-info" /> 예약 시간
            </label>
            <Select value={time || ""} onValueChange={(v) => setTime(v || null)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="시간을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px]">
                {TIME_SLOTS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 저장 */}
          <Button
            onClick={handleSave}
            disabled={saving || !clinic.trim() || !treatmentName.trim()}
            className="w-full rounded-xl h-12 text-sm font-semibold"
          >
            {saving ? "저장 중..." : (
              <>
                <Check className="h-4 w-4 mr-1.5" /> 수정 완료
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
