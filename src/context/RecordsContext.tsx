import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TreatmentRecord } from '@/types/skin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { mockRecords } from '@/data/mockData';

interface RecordsContextType {
  records: TreatmentRecord[];
  loading: boolean;
  addRecord: (record: Omit<TreatmentRecord, 'id'>) => Promise<void>;
  updateRecord: (id: string, record: Omit<TreatmentRecord, 'id'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

// DB row → TreatmentRecord 변환
const rowToRecord = (row: any): TreatmentRecord => ({
  id: row.id,
  date: row.date,
  packageId: row.package_id || '',
  treatmentId: row.treatment_id,
  treatmentName: row.treatment_name,
  shots: row.shots,
  skinLayer: row.skin_layer,
  bodyArea: row.body_area,
  clinic: row.clinic,
  satisfaction: row.satisfaction,
  notes: row.notes,
  memo: row.memo,
  amount_paid: row.amount_paid,
});

export function RecordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // 비로그인 상태 → mockData 사용
      setRecords(mockRecords);
      setLoading(false);
      return;
    }
    fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('treatment_records')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      // Supabase에 실제 데이터가 있으면 사용
      setRecords(data.map(rowToRecord));
    } else {
      // Supabase 비어있으면 mockData fallback
      setRecords(mockRecords);
    }
    setLoading(false);
  };

  const addRecord = async (record: Omit<TreatmentRecord, 'id'>) => {
    if (!user) {
      // 비로그인: 로컬 상태에만 추가
      const newRecord = { ...record, id: `local_${Date.now()}` };
      setRecords(prev => [newRecord, ...prev]);
      return;
    }
    const { data, error } = await supabase.from('treatment_records').insert({
      user_id:        user.id,
      date:           record.date,
      treatment_name: record.treatmentName,
      treatment_id:   record.treatmentId,
      shots:          record.shots,
      skin_layer:     record.skinLayer,
      body_area:      record.bodyArea,
      clinic:         record.clinic,
      package_id:     record.packageId,
      satisfaction:   record.satisfaction,
      notes:          record.notes,
      memo:           record.memo,
      amount_paid:    record.amount_paid,
    }).select().single();

    if (!error && data) {
      setRecords(prev => [rowToRecord(data), ...prev]);
    }
  };

  const updateRecord = async (id: string, record: Omit<TreatmentRecord, 'id'>) => {
    if (!user || id.startsWith('local_') || id.startsWith('r')) {
      // 로컬 record (mock) 업데이트
      setRecords(prev => prev.map(r => r.id === id ? { ...record, id } : r));
      return;
    }
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
        package_id:     record.packageId,
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
    if (!user || id.startsWith('local_') || id.startsWith('r')) {
      // 로컬 record (mock) 삭제
      setRecords(prev => prev.filter(r => r.id !== id));
      return;
    }
    const { error } = await supabase
      .from('treatment_records')
      .delete()
      .eq('id', id);

    if (!error) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
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
