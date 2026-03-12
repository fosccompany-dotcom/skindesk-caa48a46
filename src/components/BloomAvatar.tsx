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
  const badgeText = `${bloom.emoji} ${bloom.name}`;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative inline-flex" style={{ width: px, height: px }}>
        <img
          src={logoImg}
          alt="bloom avatar"
          className="h-full w-full rounded-full object-cover transition-all duration-700"
          style={{ filter: STAGE_FILTERS[bloom.stage] }}
        />

        {/* badge */}
        <span
          className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 whitespace-nowrap rounded-full px-1.5 py-[1px] text-white"
          style={{
            fontSize: size === "sm" ? 8 : 10,
            fontWeight: 700,
            backgroundColor: "#FF7F7F",
            lineHeight: 1.3,
          }}
        >
          {badgeText}
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
