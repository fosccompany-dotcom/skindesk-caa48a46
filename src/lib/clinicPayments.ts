/**
 * clinicPayments.ts — 피부과 결제 3단계 플로우 공통 유틸
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ 플로우 1: 현금/카드 결제 → 포인트(선불잔액) 충전                   │
 * │   payment_records (cash_payment)                                 │
 * │   point_transactions (charge, payment_record_id 연결)            │
 * │   clinic_balances +충전액                                         │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ 플로우 2: 시술권 구매 — 포인트 차감만, 실결제 아님                 │
 * │   treatment_packages (purchase_price, point_transaction_id 연결) │
 * │   point_transactions (package_purchase, package_id 연결)         │
 * │   clinic_balances -구매가                                         │
 * │   ※ payment_records 저장 안 함                                   │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ 플로우 3: 시술 진행 — 잔액/결제 변동 없음                         │
 * │   treatment_records INSERT                                        │
 * │   treatment_packages.used_sessions +1                            │
 * │   ※ payment_records / point_transactions / clinic_balances 불변  │
 * └──────────────────────────────────────────────────────────────────┘
 */

import { supabase } from '@/integrations/supabase/client';

// ── 잔액 헬퍼 ──────────────────────────────────────────────────────

export async function getClinicBalance(userId: string, clinic: string): Promise<number> {
  const { data } = await supabase
    .from('clinic_balances')
    .select('balance')
    .eq('user_id', userId)
    .eq('clinic', clinic)
    .maybeSingle();
  return data?.balance ?? 0;
}

export async function upsertClinicBalance(userId: string, clinic: string, newBalance: number) {
  await supabase.from('clinic_balances').upsert(
    { user_id: userId, clinic, balance: Math.max(0, newBalance), updated_at: new Date().toISOString() },
    { onConflict: 'user_id,clinic' }
  );
}

// ── 플로우 1: 현금/카드 결제 → 포인트 충전 ────────────────────────
// 언제: 병원에서 카드/현금으로 돈 내고 선불 포인트 충전할 때

export interface ChargePayload {
  userId: string;
  date: string;
  clinic: string;
  clinicType?: string;
  paidAmount: number;     // 실제 낸 돈 (카드/현금)
  chargedAmount: number;  // 충전된 포인트 (보너스 포함 가능)
  method: '카드' | '현금' | '서비스';
  description: string;    // "신규충전", "포인트 충전" 등
  memo?: string;
}

export async function processCharge(p: ChargePayload): Promise<string> {
  // 1. payment_records — 실결제 기록
  const { data: pr, error: prErr } = await supabase
    .from('payment_records')
    .insert({
      user_id:        p.userId,
      date:           p.date,
      clinic:         p.clinic,
      clinic_type:    p.clinicType ?? '밴스',
      treatment_name: p.description,
      amount:         p.paidAmount,
      charged_amount: p.chargedAmount,
      method:         p.method,
      record_type:    'cash_payment',
      memo:           p.memo ?? null,
    })
    .select('id')
    .single();
  if (prErr) throw prErr;

  const paymentRecordId = pr.id;

  // 2. point_transactions — 충전 이력 (payment_record_id 연결)
  const prevBal = await getClinicBalance(p.userId, p.clinic);
  const newBal  = prevBal + p.chargedAmount;
  await supabase.from('point_transactions').insert({
    user_id:           p.userId,
    date:              p.date,
    type:              'charge',
    amount:            p.chargedAmount,
    balance:           newBal,
    description:       p.description,
    clinic:            p.clinic,
    payment_record_id: paymentRecordId,
  });

  // 3. clinic_balances — 잔액 반영
  await upsertClinicBalance(p.userId, p.clinic, newBal);

  return paymentRecordId;
}

// ── 플로우 2: 시술권 구매 — 포인트 차감 ────────────────────────────
// 언제: 선불 포인트에서 N회권 구매할 때 (payment_records 저장 안 함)

export interface PackagePurchasePayload {
  userId: string;
  date: string;
  clinic: string;
  packageName: string;
  totalSessions: number;
  purchasePrice: number;  // 포인트에서 차감할 금액
  skinLayer?: string;
  bodyArea?: string;
  expiryDate?: string;
  memo?: string;
}

export async function processPackagePurchase(p: PackagePurchasePayload): Promise<string> {
  // 1. treatment_packages INSERT
  const { data: pkg, error: pkgErr } = await supabase
    .from('treatment_packages')
    .insert({
      user_id:        p.userId,
      name:           p.packageName,
      type:           'session',
      total_sessions: p.totalSessions,
      used_sessions:  0,
      skin_layer:     p.skinLayer ?? 'dermis',
      body_area:      p.bodyArea  ?? 'face',
      clinic:         p.clinic,
      purchase_price: p.purchasePrice,
      expiry_date:    p.expiryDate ?? null,
    })
    .select('id')
    .single();
  if (pkgErr) throw pkgErr;

  const packageId = pkg.id;

  // 2. point_transactions — 차감 이력 (package_id 연결)
  //    ※ payment_records는 저장하지 않음
  const prevBal = await getClinicBalance(p.userId, p.clinic);
  const newBal  = Math.max(0, prevBal - p.purchasePrice);
  const { data: pt, error: ptErr } = await supabase
    .from('point_transactions')
    .insert({
      user_id:     p.userId,
      date:        p.date,
      type:        'package_purchase',
      amount:      -p.purchasePrice,
      balance:     newBal,
      description: `${p.packageName} 구매`,
      clinic:      p.clinic,
      package_id:  packageId,
    })
    .select('id')
    .single();
  if (ptErr) throw ptErr;

  // 3. treatment_packages ← point_transaction_id 역참조 연결
  await supabase
    .from('treatment_packages')
    .update({ point_transaction_id: pt.id })
    .eq('id', packageId);

  // 4. clinic_balances — 잔액 차감
  await upsertClinicBalance(p.userId, p.clinic, newBal);

  return packageId; // UUID 반환 (treatment_records.package_uuid에 사용)
}

// ── 플로우 3: 시술 진행 — 시술권 횟수만 차감 ──────────────────────
// 언제: 시술 기록 추가 시, 시술권(package_uuid)이 있을 때 호출
//       결제/포인트/잔액 변동 없음

export async function usePackageSession(packageUuid: string): Promise<void> {
  const { data: pkg } = await supabase
    .from('treatment_packages')
    .select('used_sessions, total_sessions')
    .eq('id', packageUuid)
    .single();
  if (!pkg) return;
  if (pkg.used_sessions >= pkg.total_sessions) return; // 이미 소진
  await supabase
    .from('treatment_packages')
    .update({ used_sessions: pkg.used_sessions + 1 })
    .eq('id', packageUuid);
}

// ── 단건 포인트 차감 — 시술권 없이 포인트로 직접 결제 ─────────────

export interface SingleUsePayload {
  userId: string;
  date: string;
  clinic: string;
  amount: number;
  description: string;
}

export async function processSingleUse(p: SingleUsePayload): Promise<void> {
  const prevBal = await getClinicBalance(p.userId, p.clinic);
  const newBal  = Math.max(0, prevBal - p.amount);
  await supabase.from('point_transactions').insert({
    user_id:     p.userId,
    date:        p.date,
    type:        'use',
    amount:      -p.amount,
    balance:     newBal,
    description: p.description,
    clinic:      p.clinic,
  });
  await upsertClinicBalance(p.userId, p.clinic, newBal);
}
