/**
 * Skin Treatment Recommendation Module
 *
 * Maps 5-axis P/O/I/H/A scores to treatment recommendations.
 * Treatment IDs match `src/data/treatmentSeasonData.ts`.
 */

import type { FiveAxisScores, AxisKey } from './skinDiagnosis';

export type RecommendationLevel = 'focus' | 'maintain' | 'good';

/** 5축별 추천 시술 ID (treatmentSeasonData 기준) */
const AXIS_TREATMENT_MAP: Record<AxisKey, string[]> = {
  p: ['picotoning', 'excelv', 'baekok'],
  o: ['picotoning', 'aquapeel'],
  i: ['exosome', 'jincheong-pack', 'cryo', 'rejuran'],
  h: ['skinbooster', 'mulkwang', 'rejuran'],
  a: ['shrink', 'cerph', 'thermage', 'inmode', 'doublo'],
};

/** I축 ≥ 7일 때 신중하게 권고할 고에너지·자극 시술 */
export const HIGH_ENERGY_TREATMENTS = [
  'shrink',
  'cerph',
  'thermage',
  'inmode',
  'doublo',
  'excelv',
];

export interface AxisRecommendation {
  axis: AxisKey;
  score: number;
  level: RecommendationLevel;
  treatmentIds: string[];
}

export interface RecommendationResult {
  /** 점수 ≥ 7 — 지금 집중 관리할 부분 */
  focus: AxisRecommendation[];
  /** 점수 4~6 — 꾸준히 관리할 부분 */
  maintain: AxisRecommendation[];
  /** 점수 ≤ 3 — 양호한 축 */
  good: AxisKey[];
  /** I축 ≥ 7일 때 신중 권고 시술 ID */
  cautionIds: string[];
  /** 모든 축이 양호한 경우 */
  allGood: boolean;
}

export function recommendByScores(scores: FiveAxisScores): RecommendationResult {
  const axes: AxisKey[] = ['p', 'o', 'i', 'h', 'a'];

  const focus: AxisRecommendation[] = [];
  const maintain: AxisRecommendation[] = [];
  const good: AxisKey[] = [];

  for (const axis of axes) {
    const score = scores[axis];
    if (score >= 7) {
      focus.push({
        axis,
        score,
        level: 'focus',
        treatmentIds: AXIS_TREATMENT_MAP[axis],
      });
    } else if (score >= 4) {
      maintain.push({
        axis,
        score,
        level: 'maintain',
        treatmentIds: AXIS_TREATMENT_MAP[axis],
      });
    } else {
      good.push(axis);
    }
  }

  // 점수 높은 순 정렬 (우선순위)
  focus.sort((a, b) => b.score - a.score);
  maintain.sort((a, b) => b.score - a.score);

  const cautionIds = scores.i >= 7 ? [...HIGH_ENERGY_TREATMENTS] : [];
  const allGood = focus.length === 0 && maintain.length === 0;

  return { focus, maintain, good, cautionIds, allGood };
}
