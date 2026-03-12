import { useRecords } from "@/context/RecordsContext";
import { getBloomInfo, getActiveDays, STAGE_FILTERS } from "@/utils/bloomLevel";
import logoImg from "@/assets/logo.png";

interface BloomAvatarProps {
  size?: "sm" | "md";
  showDays?: boolean;
}

export default function BloomAvatar({ size = "sm", showDays = false }: BloomAvatarProps) {
  const { records } = useRecords();
  const activeDays = getActiveDays(records);
  const bloom = getBloomInfo(activeDays);

  const px = size === "sm" ? 32 : 64;
  const emojiSize = size === "sm" ? 20 : 40;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center" style={{ width: px, height: px }}>
        {/* Logo background with stage filter */}
        <img
          src={logoImg}
          alt="bloom avatar"
          className="h-full w-full rounded-full object-cover transition-all duration-700"
          style={{ filter: STAGE_FILTERS[bloom.stage] }}
        />

        {/* Centered emoji overlay */}
        <span
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          style={{ fontSize: emojiSize }}
        >
          {bloom.emoji}
        </span>
      </div>

      {showDays && (
        <span className="text-[10px] text-muted-foreground font-medium">
          {activeDays}일째 기록 중
        </span>
      )}
    </div>
  );
}
