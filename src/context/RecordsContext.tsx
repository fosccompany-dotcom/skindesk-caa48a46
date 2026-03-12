import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { TreatmentRecord } from '@/types/skin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { usePackageSession } from '@/lib/clinicPayments';
import { getBloomInfo, getActiveDays } from '@/utils/bloomLevel';
import { toast } from 'sonner';

interface RecordsContextType {
  records: TreatmentRecord[];
  loading: boolean;
  addRecord: (record: Omit<TreatmentRecord, 'id'>) => Promise<void>;
  updateRecord: (id: string, record: Omit<TreatmentRecord, 'id'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

const rowToRecord = (row: any): TreatmentRecord => ({
  id:            row.id,
  date:          row.date,
  packageId:     row.package_uuid || row.package_id || '',
  treatmentId:   row.treatment_id,
  treatmentName: row.treatment_name,
  shots:         row.shots,
  skinLayer:     row.skin_layer,
  bodyArea:      row.body_area,
  clinic:        row.clinic,
  satisfaction:  row.satisfaction,
  notes:         row.notes,
  memo:          row.memo,
  amount_paid:   row.amount_paid,
  clinic_kakao_id:  row.clinic_kakao_id,
  clinic_district:  row.clinic_district,
  clinic_address:   row.clinic_address,
  input_method:     row.input_method,
});

export function RecordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRecords([]); setLoading(false); return; }
    fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('treatment_records')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) setRecords(data.map(rowToRecord));
    setLoading(false);
  };

  const addRecord = async (record: Omit<TreatmentRecord, 'id'>) => {
    if (!user) return;

    // packageId가 유효한 UUID면 package_uuid 컬럼에 저장
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(record.packageId || '');

    const { data, error } = await supabase.from('treatment_records').insert({
      user_id:        user.id,
      date:           record.date,
      treatment_name: record.treatmentName,
      treatment_id:   record.treatmentId,
      shots:          record.shots,
      skin_layer:     record.skinLayer,
      body_area:      record.bodyArea,
      clinic:         record.clinic,
      package_uuid:   isUUID ? record.packageId : null,
      package_id:     isUUID ? null : (record.packageId || null),
      satisfaction:   record.satisfaction,
      notes:          record.notes,
      memo:           record.memo,
      amount_paid:    record.amount_paid,
      clinic_kakao_id:  record.clinic_kakao_id ?? null,
      clinic_district:  record.clinic_district ?? null,
      clinic_address:   record.clinic_address ?? null,
      input_method:     record.input_method ?? 'manual',
    }).select().single();

    if (!error && data) {
      const prevDays = getActiveDays(records);
      const prevStage = getBloomInfo(prevDays).stage;
      const newRecords = [rowToRecord(data), ...records];
      setRecords(newRecords);
      const newDays = getActiveDays(newRecords);
      const newStage = getBloomInfo(newDays).stage;
      if (newStage > prevStage) {
        const bloom = getBloomInfo(newDays);
        if (bloom.stage === 4) {
          // Bloom 최초 달성
          toast("🌺 Bloom 달성!", {
            description: "결제 시스템 오픈 시 한 달 무료 이용권 드릴게요 🎁",
            duration: 5000,
          });
        } else {
          toast(`${bloom.emoji} ${bloom.name}으로 피어났어요!`, { duration: 3000 });
        }
      }
      // 플로우 3: 시술권이 있으면 used_sessions +1 (결제/잔액 변동 없음)
      if (isUUID && record.packageId) {
        await usePackageSession(record.packageId);
      }
    }
  };

  const updateRecord = async (id: string, record: Omit<TreatmentRecord, 'id'>) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(record.packageId || '');

    const { data, error } = await supabase
      .from('treatment_records')
      .update({
        date:           record.date,
        treatment_name: record.treatmentName,
        treatment_id:   record.treatmentId,
        shots:          record.shots,
        skin_layer:     record.skinLayer,
        body_area:      record.bodyArea,
        clinic:         record.clinic,
        package_uuid:   isUUID ? record.packageId : null,
        package_id:     isUUID ? null : (record.packageId || null),
        satisfaction:   record.satisfaction,
        notes:          record.notes,
        memo:           record.memo,
        amount_paid:    record.amount_paid,
        clinic_kakao_id:  record.clinic_kakao_id ?? null,
        clinic_district:  record.clinic_district ?? null,
        clinic_address:   record.clinic_address ?? null,
        input_method:     record.input_method ?? 'manual',
      })
      .eq('id', id)
      .select().single();

    if (!error && data) {
      setRecords(prev => prev.map(r => r.id === id ? rowToRecord(data) : r));
    }
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('treatment_records').delete().eq('id', id);
    if (!error) setRecords(prev => prev.filter(r => r.id !== id));
  };

  return (
    <RecordsContext.Provider value={{ records, loading, addRecord, updateRecord, deleteRecord }}>
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}
