/**
 * Payment method DB keys and locale-aware display labels.
 * DB stores ONLY English keys: 'card' | 'cash' | 'point' | 'charge' | 'service' | 'package'
 */

export type PaymentMethodKey = 'card' | 'cash' | 'point' | 'charge' | 'service' | 'package';

type Language = 'ko' | 'en' | 'zh';

const METHOD_LABELS: Record<PaymentMethodKey, Record<Language, string>> = {
  card:    { ko: '카드',       en: 'Card',     zh: '信用卡' },
  cash:    { ko: '현금',       en: 'Cash',     zh: '现金' },
  point:   { ko: '포인트',     en: 'Points',   zh: '积分' },
  charge:  { ko: '포인트충전', en: 'Charge',   zh: '充值' },
  service: { ko: '서비스',     en: 'Service',  zh: '服务' },
  package: { ko: '패키지',     en: 'Package',  zh: '套餐' },
};

/** Get the locale-aware display label for a payment method key */
export function getMethodLabel(key: string | null | undefined, lang: Language = 'ko'): string {
  if (!key) return '';
  const labels = METHOD_LABELS[key as PaymentMethodKey];
  if (labels) return labels[lang];
  // Fallback: if a legacy Korean value sneaks in, return as-is
  return key;
}

/** Style config for payment method badges, keyed by English DB key */
export const METHOD_STYLE: Record<string, { bg: string; text: string }> = {
  charge:  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  point:   { bg: 'bg-orange-50',  text: 'text-orange-600' },
  service: { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  card:    { bg: 'bg-sky-50',     text: 'text-sky-600' },
  cash:    { bg: 'bg-amber-50',   text: 'text-amber-600' },
  package: { bg: 'bg-gray-100',   text: 'text-gray-500' },
};

/** Map legacy Korean method values to English keys (for reading old data) */
const LEGACY_MAP: Record<string, PaymentMethodKey> = {
  '카드':       'card',
  '현금':       'cash',
  '포인트':     'point',
  '포인트충전': 'charge',
  '시술결제':   'service',
  '서비스':     'service',
  '패키지':     'package',
};

/** Normalize a method value to its English DB key */
export function normalizeMethodKey(val: string | null | undefined): PaymentMethodKey | null {
  if (!val) return null;
  // Already an English key
  if (val in METHOD_LABELS) return val as PaymentMethodKey;
  // Legacy Korean value
  if (val in LEGACY_MAP) return LEGACY_MAP[val];
  return val as PaymentMethodKey;
}
