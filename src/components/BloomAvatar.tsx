import { useRecords } from "@/context/RecordsContext";
import { getBloomInfo, getActiveDays } from "@/utils/bloomLevel";

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
      <span
        className="select-none pointer-events-none leading-none"
        style={{ fontSize: emojiSize }}
      >
        {bloom.emoji}
      </span>

      {showDays && (
        <span className="text-[10px] text-muted-foreground font-medium">
          {activeDays}일째 기록 중
        </span>
      )}
    </div>
  );
}
