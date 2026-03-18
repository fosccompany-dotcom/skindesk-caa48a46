/**
 * Skin Tribe Classification Logic
 * 6 skin tribes: desert_sensitive, dry_calm, combo_sensitive, combo_balanced, oily_sensitive, oily_strong
 */

export type SkinTribe =
  | 'desert_sensitive'
  | 'dry_calm'
  | 'combo_sensitive'
  | 'combo_balanced'
  | 'oily_sensitive'
  | 'oily_strong';

export type SkinGoal = 'lifting' | 'pigment' | 'acne' | 'maintenance';

export interface QuizAnswers {
  q1: 'A' | 'B' | 'C' | null;
  q2: 'A' | 'B' | null;
  q3: 'A' | 'B' | 'C' | null;
  q4: 'A' | 'B' | null;
  q5: 'A' | 'B' | 'C' | 'D' | null;
  q6: string | null; // birth decade
}

export function classifySkinTribe(answers: QuizAnswers): SkinTribe {
  const { q1, q2, q3, q4 } = answers;

  // Step 1: Base assignment (Q1 + Q2)
  let tribe: SkinTribe = 'combo_balanced';

  if (q1 === 'A' && q2 === 'A') tribe = 'desert_sensitive';
  else if (q1 === 'A' && q2 === 'B') tribe = 'dry_calm';
  else if (q1 === 'B' && q2 === 'A') tribe = 'combo_sensitive';
  else if (q1 === 'B' && q2 === 'B') tribe = 'combo_balanced';
  else if (q1 === 'C' && q2 === 'A') tribe = 'oily_sensitive';
  else if (q1 === 'C' && q2 === 'B') tribe = 'oily_strong';

  // Step 2: Q3 correction
  if (q1 === 'A' && q3 === 'B') {
    // Dry but T-zone oily → combo
    tribe = tribe === 'desert_sensitive' ? 'combo_sensitive' : 'combo_balanced';
  }
  if (q1 === 'C' && q3 === 'A') {
    // Oily but still tight → combo
    tribe = tribe === 'oily_sensitive' ? 'combo_sensitive' : 'combo_balanced';
  }

  // Step 3: Q4 correction
  if (q2 === 'B' && q4 === 'A') {
    // Not sensitive in Q2 but slow recovery → upgrade to sensitive
    if (tribe === 'dry_calm') tribe = 'desert_sensitive';
    else if (tribe === 'combo_balanced') tribe = 'combo_sensitive';
    else if (tribe === 'oily_strong') tribe = 'oily_sensitive';
  }

  return tribe;
}

export function mapQ5ToGoal(q5: 'A' | 'B' | 'C' | 'D' | null): SkinGoal {
  switch (q5) {
    case 'A': return 'lifting';
    case 'B': return 'pigment';
    case 'C': return 'acne';
    case 'D': return 'maintenance';
    default: return 'maintenance';
  }
}

export function mapQ6ToBirthDate(q6: string | null): string | null {
  if (!q6) return null;
  const yearMap: Record<string, string> = {
    '2000': '2000-01-01',
    '1995': '1995-01-01',
    '1990': '1990-01-01',
    '1985': '1985-01-01',
    '1980': '1980-01-01',
    '1970': '1970-01-01',
  };
  return yearMap[q6] ?? null;
}

export const SKIN_TRIBE_LABELS: Record<SkinTribe, { emoji: string; name: string; desc: string }> = {
  desert_sensitive: { emoji: '🏜️', name: '사막 민감형', desc: '건조하고 예민한 피부, 진정·보습 케어가 핵심이에요' },
  dry_calm: { emoji: '🍂', name: '건조 안정형', desc: '건조하지만 튼튼한 피부, 보습 위주 관리가 좋아요' },
  combo_sensitive: { emoji: '🌊', name: '복합 민감형', desc: 'T존은 번들, 볼은 당기고 예민해요' },
  combo_balanced: { emoji: '🌿', name: '복합 균형형', desc: '부위별 차이는 있지만 전반적으로 안정적이에요' },
  oily_sensitive: { emoji: '🌋', name: '지성 민감형', desc: '유분이 많고 트러블이 잘 올라와요' },
  oily_strong: { emoji: '💪', name: '지성 강건형', desc: '유분은 많지만 피부 장벽은 튼튼해요' },
};
