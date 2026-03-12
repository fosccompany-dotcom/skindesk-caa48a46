import { useRecords } from "@/context/RecordsContext";
import { getBloomInfo } from "@/utils/bloomLevel";

const STAGE_EMOJI = ["🌱", "🌿", "🌷", "🌸", "🌺", "🏡"];

interface BloomAvatarProps {
  size?: "sm" | "md";
}

export default function BloomAvatar({ size = "sm" }: BloomAvatarProps) {
  const { records } = useRecords();
  const bloom = getBloomInfo(records.length);

  const px = size === "sm" ? 32 : 64;
  const emojiSize = size === "sm" ? 18 : 32;
  const badgeText = bloom.stage < 5 ? `${bloom.stage + 1} ${bloom.name}` : `🌸 ${bloom.name}`;

  return (
    <div className="relative inline-flex" style={{ width: px, height: px }}>
      <div
        className="h-full w-full rounded-full bg-muted flex items-center justify-center"
        style={{ fontSize: emojiSize }}
      >
        {STAGE_EMOJI[bloom.stage]}
      </div>

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
  );
}
