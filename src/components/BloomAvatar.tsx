import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecords } from "@/context/RecordsContext";
import { getBloomInfo } from "@/utils/bloomLevel";
import logoImg from "@/assets/logo.png";

interface BloomAvatarProps {
  size?: "sm" | "md";
}

export default function BloomAvatar({ size = "sm" }: BloomAvatarProps) {
  const { records } = useRecords();
  const bloom = getBloomInfo(records.length);

  const px = size === "sm" ? 32 : 64;
  const badgeText = bloom.stage < 5 ? `${bloom.stage + 1} ${bloom.name}` : `🌸 ${bloom.name}`;

  return (
    <div className="relative inline-flex" style={{ width: px, height: px }}>
      <Avatar className="h-full w-full">
        <AvatarImage src={logoImg} alt="bloom avatar" className="object-cover" />
        <AvatarFallback className="text-xs">🌱</AvatarFallback>
      </Avatar>

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
