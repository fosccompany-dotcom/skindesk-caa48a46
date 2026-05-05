// Personalized cycle recommendation
// Adjusts a base cycleDays based on user's skin type, age, and management mode

export type ManagementLevel = 'tight' | 'maintain' | 'none';

export interface PersonalizationInputs {
  birthDate?: string | null;     // ISO date string
  skinType?: string | null;      // '건성' | '지성' | '복합성' | '민감성' | '중성'
  skinTribe?: string | null;
  managementLevel?: ManagementLevel; // face zone level
}

export interface PersonalizedResult {
  adjustedDays: number;
  modeFactor: number;
  ageFactor: number;
  skinFactor: number;
  modeLabel: string;
  ageBand: 'young' | 'mid' | 'mature';
  message: string;
}

export function getPersonalizedCycle(
  baseCycleDays: number,
  inputs: PersonalizationInputs,
  today: Date = new Date(),
): PersonalizedResult {
  // Mode factor
  let modeFactor = 1;
  let modeLabel = '유지';
  if (inputs.managementLevel === 'tight') { modeFactor = 0.75; modeLabel = '타이트'; }
  else if (inputs.managementLevel === 'none') { modeFactor = 1.4; modeLabel = '여유'; }

  // Age factor
  let ageFactor = 1;
  let ageBand: 'young' | 'mid' | 'mature' = 'mid';
  if (inputs.birthDate) {
    const yrs = (today.getTime() - new Date(inputs.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (yrs < 30) { ageFactor = 1.1; ageBand = 'young'; }
    else if (yrs >= 45) { ageFactor = 0.9; ageBand = 'mature'; }
  }

  // Skin type factor
  let skinFactor = 1;
  if (inputs.skinType === '민감성') skinFactor = 1.2;
  else if (inputs.skinType === '지성') skinFactor = 0.95;

  const adjustedDays = Math.max(7, Math.round(baseCycleDays * modeFactor * ageFactor * skinFactor));

  const tribeMsg = inputs.skinTribe ? `${inputs.skinTribe} 타입` : null;
  const ageMsg = ageBand === 'young' ? '회복력이 좋아 살짝 여유롭게' : ageBand === 'mature' ? '효과 유지를 위해 조금 더 짧게' : '표준 주기로';
  const skinMsg = inputs.skinType === '민감성' ? '민감 피부엔 충분한 회복 기간을 두고' : inputs.skinType === '지성' ? '지성 피부 특성상 조금 더 자주' : null;
  const modeMsg = modeLabel === '타이트' ? '타이트 관리 모드로' : modeLabel === '여유' ? '여유 관리 모드로' : '유지 관리 모드로';
  const message = [tribeMsg, modeMsg, ageMsg, skinMsg].filter(Boolean).join(' · ');

  return { adjustedDays, modeFactor, ageFactor, skinFactor, modeLabel, ageBand, message };
}
