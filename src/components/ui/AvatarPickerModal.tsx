import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AVATAR_OPTIONS = [
  { id: "rose",     label: "로즈",   petals: "#F2C94C", center: "#F2994A", bg: "#FFF5E0" },
  { id: "mint",     label: "민트",   petals: "#6FCF97", center: "#27AE60", bg: "#E8F8F0" },
  { id: "sky",      label: "스카이", petals: "#56CCF2", center: "#2F80ED", bg: "#E5F5FC" },
  { id: "lavender", label: "라벤더", petals: "#BB6BD9", center: "#9B51E0", bg: "#F5EAFC" },
  { id: "peach",    label: "피치",   petals: "#F2994A", center: "#EB5757", bg: "#FFF0E8" },
];

export function FlowerAvatar({ color, size = 64 }: { color: string; size?: number }) {
  const opt = AVATAR_OPTIONS.find((o) => o.id === color) ?? AVATAR_OPTIONS[0];
  const r = size / 2;
  const petalDist = size * 0.2;
  const petalRx = size * 0.125;
  const petalRy = size * 0.19;
  const centerR = size * 0.155;
  const innerR = size * 0.078;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const cx = r + petalDist * Math.cos(rad);
        const cy = r + petalDist * Math.sin(rad);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={petalRx}
            ry={petalRy}
            transform={`rotate(${deg}, ${cx}, ${cy})`}
            fill={opt.petals}
            opacity={0.92}
          />
        );
      })}
      <circle cx={r} cy={r} r={centerR} fill={opt.center} />
      <circle cx={r} cy={r} r={innerR} fill="white" opacity={0.35} />
    </svg>
  );
}

interface AvatarPickerModalProps {
  currentColor: string;
  userId: string;
  onClose: () => void;
  onSaved: (color: string) => void;
}

export function AvatarPickerModal({ currentColor, userId, onClose, onSaved }: AvatarPickerModalProps) {
  const [selected, setSelected] = useState(currentColor || "rose");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("user_profiles")
      .update({ avatar_color: selected })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "저장 실패", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "아바타가 변경되었어요! ✨" });
      onSaved(selected);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h3 className="text-center font-bold text-lg mb-1">아바타 선택</h3>
        <p className="text-center text-sm text-muted-foreground mb-7">나만의 컬러를 선택해보세요</p>
        <div className="flex justify-center gap-4 flex-wrap mb-8">
          {AVATAR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className="flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className="rounded-full p-2.5 transition-all duration-150"
                style={{
                  background: opt.bg,
                  boxShadow: selected === opt.id ? `0 0 0 3px ${opt.petals}` : "0 0 0 2px transparent",
                  transform: selected === opt.id ? "scale(1.12)" : "scale(1)",
                }}
              >
                <FlowerAvatar color={opt.id} size={52} />
              </div>
              <span className="text-xs font-medium" style={{ color: selected === opt.id ? opt.center : "#aaa" }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl font-bold text-sm"
          style={{ background: "#F2C94C", color: "#333" }}
        >
          {saving ? "저장 중..." : "선택 완료"}
        </button>
      </div>
    </div>
  );
}
