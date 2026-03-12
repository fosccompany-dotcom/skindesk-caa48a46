export interface BloomInfo {
  stage: number;
  name: string;
  message: string;
  nextMilestone: number | null;
}

const STAGES: { min: number; name: string; message: string }[] = [
  { min: 0, name: "씨앗", message: "첫 시술을 기록해보세요!" },
  { min: 1, name: "새싹", message: "좋은 시작이에요! 꾸준히 기록해봐요." },
  { min: 3, name: "봉오리", message: "습관이 만들어지고 있어요!" },
  { min: 6, name: "반개화", message: "절반 이상 피었어요, 대단해요!" },
  { min: 11, name: "만개", message: "꽃이 활짝 피었어요!" },
  { min: 21, name: "나만의 정원", message: "당신만의 뷰티 정원이 완성되었어요 🌸" },
];

const MILESTONES = [1, 3, 6, 11, 21, null];

export function getBloomInfo(count: number): BloomInfo {
  let stageIdx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (count >= STAGES[i].min) {
      stageIdx = i;
      break;
    }
  }

  return {
    stage: stageIdx,
    name: STAGES[stageIdx].name,
    message: STAGES[stageIdx].message,
    nextMilestone: MILESTONES[stageIdx] ?? null,
  };
}
