import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Stethoscope, Check } from "lucide-react";
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

// ─── Category metadata & order ───
const CATEGORY_META: Record<string, { emoji: string }> = {
  "리프팅·보톡스": { emoji: "✨" },
  "필러·실리프팅": { emoji: "🌙" },
  스킨부스터: { emoji: "💧" },
  "피부 관리": { emoji: "🌿" },
  "미백·색소": { emoji: "⚡" },
  "여드름·흉터": { emoji: "🔬" },
  지방분해: { emoji: "🔥" },
  제모: { emoji: "🪄" },
  "수액·영양주사": { emoji: "🌱" },
  "주사 관리": { emoji: "💉" },
  "탈모·두피": { emoji: "🌱" },
  기타: { emoji: "💊" },
};

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
interface DisplayCategory { id: string; label: string; emoji: string; items: DisplayItem[]; }

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
  const [customTreatmentName, setCustomTreatmentName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

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
      setCustomTreatmentName("");
      setShowCustomInput(false);
    }
  }, [reservation, open]);

  const displayCategories: DisplayCategory[] = useMemo(() => {
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
      const meta = CATEGORY_META[catKey] || { emoji: "💊" };
      return { id: catKey, label: catLabels[catKey], emoji: meta.emoji, items };
    }).sort((a, b) => getCatOrder(a.id) - getCatOrder(b.id));
  }, [dbOptions, language]);

  // Check if current treatmentName exists in any option
  const treatmentInOptions = useMemo(() => {
    return displayCategories.some(cat => cat.items.some(item => item.name === treatmentName));
  }, [displayCategories, treatmentName]);

  const handleSelectPlace = (place: ClinicPlace) => {
    setClinic(place.name);
    setClinicKakaoId(place.kakao_id || null);
    setClinicDistrict(place.road_address?.split(" ").slice(0, 2).join(" ") || null);
    setClinicAddress(place.road_address || place.address || null);
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

          {/* 시술명 - 드롭다운 */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Stethoscope className="h-3.5 w-3.5 text-info" /> 시술명
            </label>
            <Select
              value={treatmentInOptions ? treatmentName : "__custom"}
              onValueChange={(v) => {
                if (v === "__custom") {
                  setShowCustomInput(true);
                } else {
                  setTreatmentName(v);
                  setShowCustomInput(false);
                }
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="시술을 선택하세요">
                  {treatmentName || "시술을 선택하세요"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {displayCategories.map((cat) => (
                  <SelectGroup key={cat.id}>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground">
                      {cat.emoji} {cat.label}
                    </SelectLabel>
                    {cat.items.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectGroup>
                  <SelectItem value="__custom">✏️ 직접 입력</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {showCustomInput && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={customTreatmentName}
                  onChange={(e) => setCustomTreatmentName(e.target.value)}
                  placeholder="시술명을 입력하세요"
                  className="rounded-xl text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customTreatmentName.trim()) {
                      setTreatmentName(customTreatmentName.trim());
                      setShowCustomInput(false);
                      setCustomTreatmentName("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (customTreatmentName.trim()) {
                      setTreatmentName(customTreatmentName.trim());
                      setShowCustomInput(false);
                      setCustomTreatmentName("");
                    }
                  }}
                  disabled={!customTreatmentName.trim()}
                  className="rounded-xl"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
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
