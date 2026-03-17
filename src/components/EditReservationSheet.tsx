import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Stethoscope, Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import ClinicSearchInput, { ClinicPlace } from "./ClinicSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// ─── Time slots 07:00–22:00, 30min ───
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

// ─── Category metadata & order (same as AddReservationModal) ───
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

  // Treatment picker state
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

  // Treatment picker sub-view
  const renderTreatmentPicker = () => {
    if (catId && selectedCat) {
      return (
        <div className="space-y-3">
          <button onClick={() => setCatId(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> 카테고리 선택
          </button>
          <p className="text-sm font-semibold">{selectedCat.emoji} {selectedCat.label}</p>
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
            {selectedCat.items.map((item) => {
              if (item.id === "__custom") {
                return (
                  <div key="__custom" className="col-span-2 flex gap-2 mt-1">
                    <Input
                      value={customTreatmentName}
                      onChange={(e) => setCustomTreatmentName(e.target.value)}
                      placeholder="직접 입력"
                      className="rounded-xl text-sm flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleCustomTreatmentConfirm()}
                    />
                    <Button size="sm" onClick={handleCustomTreatmentConfirm} disabled={!customTreatmentName.trim()} className="rounded-xl">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTreatment(item.name)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-95 text-left",
                    treatmentName === item.name
                      ? "bg-info text-info-foreground border-info shadow-sm"
                      : "border-border bg-card hover:bg-accent/50"
                  )}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
        {displayCategories.map((cat) => {
          const meta = CATEGORY_META[cat.id] || DEFAULT_CAT_META;
          return (
            <button
              key={cat.id}
              onClick={() => setCatId(cat.id)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all active:scale-95",
                meta.color
              )}
            >
              <span className="mr-1">{cat.emoji}</span> {cat.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 pb-8">
        <SheetHeader className="pb-3 border-b border-border">
          <SheetTitle className="text-base font-semibold">예약 수정</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4">
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

          {/* 시술명 */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Stethoscope className="h-3.5 w-3.5 text-info" /> 시술명
            </label>
            {showTreatmentPicker ? (
              renderTreatmentPicker()
            ) : (
              <button
                onClick={() => setShowTreatmentPicker(true)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2.5 text-sm text-left transition-all",
                  treatmentName ? "border-info bg-info/5 font-medium text-foreground" : "border-border bg-card text-muted-foreground"
                )}
              >
                {treatmentName || "시술을 선택하세요"}
              </button>
            )}
          </div>

          {/* 시간 - 드롭다운 */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-info" /> 예약 시간
            </label>
            <Select value={time || ""} onValueChange={(v) => setTime(v || null)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="시간을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
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
      </SheetContent>
    </Sheet>
  );
}
