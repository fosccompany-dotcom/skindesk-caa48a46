import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 카카오 주소에서 구 단위 추출
// "서울 강남구 역삼동 123" → "강남구"
// "경기 성남시 분당구 판교동" → "분당구"
export const extractDistrict = (address: string): string | null => {
  const match = address.match(/(\S+구)/);
  return match ? match[1] : null;
};
