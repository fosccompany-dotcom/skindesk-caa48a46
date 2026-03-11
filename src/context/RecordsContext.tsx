import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TreatmentRecord } from '@/types/skin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { usePackageSession } from '@/lib/clinicPayments';

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
  packageId:     row.package_uuid || row.package_id || '',  // UUID FK 우선
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
      // UUID이면 package_uuid(FK)에, 아니면 legacy package_id(text)에
      package_uuid:   isUUID ? record.packageId : null,
      package_id:     isUUID ? null : (record.packageId || null),
      satisfaction:   record.satisfaction,
      notes:          record.notes,
      memo:           record.memo,
      amount_paid:    record.amount_paid,
    }).select().single();

    if (!error && data) {
      setRecords(prev => [rowToRecord(data), ...prev]);
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
