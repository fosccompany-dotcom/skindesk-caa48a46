import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Stethoscope, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ClinicSearchInput, { ClinicPlace } from "./ClinicSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00",
];

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
  const [clinic, setClinic] = useState("");
  const [clinicKakaoId, setClinicKakaoId] = useState<string | null>(null);
  const [clinicDistrict, setClinicDistrict] = useState<string | null>(null);
  const [clinicAddress, setClinicAddress] = useState<string | null>(null);
  const [treatmentName, setTreatmentName] = useState("");
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reservation && open) {
      setClinic(reservation.clinic);
      setClinicKakaoId(reservation.clinic_kakao_id || null);
      setClinicDistrict(reservation.clinic_district || null);
      setClinicAddress(reservation.clinic_address || null);
      setTreatmentName(reservation.treatment_name);
      setTime(reservation.time || null);
    }
  }, [reservation, open]);

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
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 pb-8">
        <SheetHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">예약 수정</SheetTitle>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-accent transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
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
            <Input
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              placeholder="시술명을 입력하세요"
              className="rounded-xl"
            />
          </div>

          {/* 시간 */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-info" /> 예약 시간
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
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
