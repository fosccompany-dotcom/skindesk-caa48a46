export interface BloomInfo {
  stage: number;
  name: string;
  emoji: string;
  message: string;
  nextMilestone: number | null;
}

export const STAGES: { min: number; name: string; emoji: string; message: string }[] = [
  { min: 0,  name: "씨앗",   emoji: "🌱", message: "첫 기록을 남겨봐요" },
  { min: 1,  name: "새싹",   emoji: "🌿", message: "관리가 시작됐어요" },
  { min: 8,  name: "봉오리", emoji: "🌼", message: "피어나려고 해요" },
  { min: 31, name: "반개화", emoji: "🌸", message: "조금씩 피어나고 있어요" },
  { min: 91, name: "Bloom",  emoji: "🌺", message: "당신의 피부가 피어났어요" },
];

export const MILESTONES = [1, 8, 31, 91];

export function getActiveDays(records: { date?: string; created_at?: string }[]): number {
  return new Set(
    records.map(r => {
      const d = r.date || r.created_at || '';
      return d.slice(0, 10);
    }).filter(Boolean)
  ).size;
}

export function getBloomInfo(activeDays: number): BloomInfo {
  let stageIdx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (activeDays >= STAGES[i].min) {
      stageIdx = i;
      break;
    }
  }

  const nextMilestone = stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1].min : null;

  return {
    stage: stageIdx,
    name: STAGES[stageIdx].name,
    emoji: STAGES[stageIdx].emoji,
    message: STAGES[stageIdx].message,
    nextMilestone,
  };
}

export const STAGE_FILTERS = [
  "grayscale(1) brightness(0.4)",
  "grayscale(0.7) brightness(0.6)",
  "saturate(0.6) brightness(0.75)",
  "saturate(0.8) brightness(0.88)",
  "saturate(1.1) brightness(1.05)",
];
