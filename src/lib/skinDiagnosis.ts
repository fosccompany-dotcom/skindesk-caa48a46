/**
 * 5-Axis Skin Diagnosis Module (P · O · I · H · A)
 *
 * Based on Baumann Skin Type Indicator (BSTI) with refined Oil/Hydration separation.
 * Reference: Baumann LS. Understanding and treating various skin types.
 *            J Cosmet Dermatol. 2008 (PubMed: 18555952)
 */

import type { SkinTribe } from './skinTribeClassifier';

export type AxisKey = 'p' | 'o' | 'i' | 'h' | 'a';

export type ScoreValue = 0 | 3 | 7 | 10;

export type FiveAxisQuestionId =
  | 'p1' | 'p2'
  | 'o1' | 'o2'
  | 'i1' | 'i2'
  | 'h1' | 'h2'
  | 'a1' | 'a2';

export type AgeGroup = '20s' | '30s' | '40s' | '50s_plus';

export type SkinGoalKey = 'A' | 'B' | 'C' | 'D';

export type SkinGoal = 'lifting' | 'pigment' | 'acne' | 'maintenance';

export interface DiagnosisAnswers {
  p1: ScoreValue | null;
  p2: ScoreValue | null;
  o1: ScoreValue | null;
  o2: ScoreValue | null;
  i1: ScoreValue | null;
  i2: ScoreValue | null;
  h1: ScoreValue | null;
  h2: ScoreValue | null;
  a1: ScoreValue | null;
  a2: ScoreValue | null;
}

export interface FiveAxisScores {
  p: number;
  o: number;
  i: number;
  h: number;
  a: number;
}

interface OptionWithScore {
  key: string;
  label: string;
  score: ScoreValue;
}

export interface DiagnosisQuestion {
  id: FiveAxisQuestionId | 'age' | 'goal';
  axis: AxisKey | 'age' | 'goal';
  question: string;
  multiSelect?: boolean;
  options: OptionWithScore[];
}

export const AGE_WEIGHT: Record<AgeGroup, number> = {
  '20s': 0,
  '30s': 1.5,
  '40s': 3,
  '50s_plus': 4.5,
};

/* ── 10개 5축 문항 (반말 + 진단형 톤) ──────────────────────────────────────── */

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: 'p1',
    axis: 'p',
    question: '거울 봤을 때 기미·잡티가 보이는 정도는?',
    options: [
      { key: 'a', label: '거의 없어', score: 0 },
      { key: 'b', label: '가까이서만 보여', score: 3 },
      { key: 'c', label: '평소에도 눈에 띄어', score: 7 },
      { key: 'd', label: '진하게 또렷이 보여', score: 10 },
    ],
  },
  {
    id: 'p2',
    axis: 'p',
    question: '햇빛 노출 후 색소침착(그을림·자국)은?',
    options: [
      { key: 'a', label: '거의 변화 없어', score: 0 },
      { key: 'b', label: '그을리지만 금방 돌아와', score: 3 },
      { key: 'c', label: '자국이 오래 남아', score: 7 },
      { key: 'd', label: '매우 쉽게 진해지고 안 빠져', score: 10 },
    ],
  },
  {
    id: 'o1',
    axis: 'o',
    question: '세안 후 1~2시간 뒤 T존(이마·코) 상태는?',
    options: [
      { key: 'a', label: '당기거나 그대로', score: 0 },
      { key: 'b', label: '살짝 촉촉', score: 3 },
      { key: 'c', label: 'T존이 번들거리기 시작', score: 7 },
      { key: 'd', label: '얼굴 전체가 번들거려', score: 10 },
    ],
  },
  {
    id: 'o2',
    axis: 'o',
    question: '코 옆·볼 모공이 신경 쓰이는 정도는?',
    options: [
      { key: 'a', label: '거의 안 보여', score: 0 },
      { key: 'b', label: '가까이서만 보여', score: 3 },
      { key: 'c', label: '평소에도 눈에 띄어', score: 7 },
      { key: 'd', label: '크고 깊어 보여', score: 10 },
    ],
  },
  {
    id: 'i1',
    axis: 'i',
    question: '최근 한 달 트러블·여드름 빈도는?',
    options: [
      { key: 'a', label: '전혀 없어', score: 0 },
      { key: 'b', label: '1~2개 정도', score: 3 },
      { key: 'c', label: '주기적으로 또는 자주', score: 7 },
      { key: 'd', label: '항상 어딘가 올라와 있어', score: 10 },
    ],
  },
  {
    id: 'i2',
    axis: 'i',
    question: '피부가 빨개지거나 따끔거리는 정도는?',
    options: [
      { key: 'a', label: '거의 없어', score: 0 },
      { key: 'b', label: '가끔', score: 3 },
      { key: 'c', label: '자주', score: 7 },
      { key: 'd', label: '거의 매일', score: 10 },
    ],
  },
  {
    id: 'h1',
    axis: 'h',
    question: '세안 후 아무것도 안 바르고 10분 뒤 당김은?',
    options: [
      { key: 'a', label: '별 변화 없어', score: 0 },
      { key: 'b', label: '살짝 당겨', score: 3 },
      { key: 'c', label: '꽤 당기고 뻣뻣해', score: 7 },
      { key: 'd', label: '매우 당기고 각질이 일어나', score: 10 },
    ],
  },
  {
    id: 'h2',
    axis: 'h',
    question: '오후 시간대 피부 수분감은?',
    options: [
      { key: 'a', label: '항상 촉촉해', score: 0 },
      { key: 'b', label: '적당해', score: 3 },
      { key: 'c', label: '약간 푸석해', score: 7 },
      { key: 'd', label: '매우 푸석하고 거칠어', score: 10 },
    ],
  },
  {
    id: 'a1',
    axis: 'a',
    question: '거울 볼 때 탄력 저하·처짐이 신경 쓰이는 정도는?',
    options: [
      { key: 'a', label: '전혀', score: 0 },
      { key: 'b', label: '약간', score: 3 },
      { key: 'c', label: '자주', score: 7 },
      { key: 'd', label: '매우 신경 쓰여', score: 10 },
    ],
  },
  {
    id: 'a2',
    axis: 'a',
    question: '주름(눈가·이마·팔자)이 보이는 정도는?',
    options: [
      { key: 'a', label: '거의 없어', score: 0 },
      { key: 'b', label: '표정 지을 때만', score: 3 },
      { key: 'c', label: '평상시에도 약간', score: 7 },
      { key: 'd', label: '또렷하게 보여', score: 10 },
    ],
  },
];

export const AGE_QUESTION: DiagnosisQuestion = {
  id: 'age',
  axis: 'age',
  question: '연령대를 알려줘',
  options: [
    { key: '20s', label: '20대', score: 0 },
    { key: '30s', label: '30대', score: 0 },
    { key: '40s', label: '40대', score: 0 },
    { key: '50s_plus', label: '50대 이상', score: 0 },
  ],
};

export const GOAL_QUESTION: DiagnosisQuestion = {
  id: 'goal',
  axis: 'goal',
  question: '피부과 가는 주된 이유는? (복수 선택 가능)',
  multiSelect: true,
  options: [
    { key: 'A', label: '탄력·리프팅·노화 관리', score: 0 },
    { key: 'B', label: '기미·잡티·피부톤', score: 0 },
    { key: 'C', label: '여드름·모공·피지', score: 0 },
    { key: 'D', label: '전반적인 유지관리', score: 0 },
  ],
};

/* ── 점수 산출 ──────────────────────────────────────────────────────────── */

export function calculateScores(
  answers: DiagnosisAnswers,
  ageGroup: AgeGroup | null,
): FiveAxisScores {
  const avg = (a: number | null, b: number | null): number => {
    const va = a ?? 0;
    const vb = b ?? 0;
    return Math.round((va + vb) / 2);
  };

  const p = avg(answers.p1, answers.p2);
  const o = avg(answers.o1, answers.o2);
  const i = avg(answers.i1, answers.i2);
  const h = avg(answers.h1, answers.h2);
  const aAvg = ((answers.a1 ?? 0) + (answers.a2 ?? 0)) / 2;
  const ageW = ageGroup ? AGE_WEIGHT[ageGroup] : 0;
  const a = Math.min(10, Math.round(aAvg + ageW));

  return { p, o, i, h, a };
}

export function mapGoalToSkinGoal(goals: SkinGoalKey[] | null): SkinGoal {
  if (!goals || goals.length === 0) return 'maintenance';
  switch (goals[0]) {
    case 'A':
      return 'lifting';
    case 'B':
      return 'pigment';
    case 'C':
      return 'acne';
    case 'D':
      return 'maintenance';
    default:
      return 'maintenance';
  }
}

/* ── 호환성 다리: 5축 점수 → SkinTribe 역추정 ─────────────────────────────── */

export function mapScoresToTribe(scores: FiveAxisScores): SkinTribe {
  let base: 'oily' | 'dry' | 'combo';
  if (scores.o >= 7) {
    base = 'oily';
  } else if (scores.h >= 5 && scores.o <= 5) {
    base = 'dry';
  } else {
    base = 'combo';
  }

  const sensitive = scores.i >= 5;

  if (base === 'oily') return sensitive ? 'oily_sensitive' : 'oily_strong';
  if (base === 'dry') return sensitive ? 'desert_sensitive' : 'dry_calm';
  return sensitive ? 'combo_sensitive' : 'combo_balanced';
}

/* ── UI 메타 ────────────────────────────────────────────────────────────── */

export const AXIS_META: Record<
  AxisKey,
  { label: string; emoji: string; description: string; color: string }
> = {
  p: { label: 'Pigment',      emoji: '🌗', description: '색소·기미·잡티',  color: 'text-amber-700' },
  o: { label: 'Oil/Pore',     emoji: '💧', description: '유분·모공',       color: 'text-sky-700' },
  i: { label: 'Inflammation', emoji: '🔥', description: '염증·여드름',     color: 'text-rose-700' },
  h: { label: 'Hydration',    emoji: '🌊', description: '수분',            color: 'text-cyan-700' },
  a: { label: 'Aging',        emoji: '⏳', description: '노화·탄력',       color: 'text-purple-700' },
};

export function interpretScore(axis: AxisKey, score: number): string {
  let level: 'low' | 'mid' | 'high';
  if (score <= 3) level = 'low';
  else if (score <= 6) level = 'mid';
  else level = 'high';

  const messages: Record<AxisKey, Record<'low' | 'mid' | 'high', string>> = {
    p: {
      low: '색소 고민이 적어요',
      mid: '기미·잡티 관리가 필요해요',
      high: '집중적인 미백·색소 케어가 필요해요',
    },
    o: {
      low: '유분 균형이 좋아요',
      mid: 'T존 유분 관리가 필요해요',
      high: '피지·모공 케어가 필요해요',
    },
    i: {
      low: '피부 장벽이 안정적이에요',
      mid: '진정·항염 케어가 필요해요',
      high: '저자극 진정 케어가 필수예요',
    },
    h: {
      low: '수분이 충분해요',
      mid: '수분 보충이 필요해요',
      high: '집중 보습이 필수예요',
    },
    a: {
      low: '탄력이 좋아요',
      mid: '예방적 안티에이징이 필요해요',
      high: '리프팅·재생 케어가 필요해요',
    },
  };
  return messages[axis][level];
}
