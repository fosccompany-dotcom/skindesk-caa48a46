import { createContext, useContext, useState, ReactNode } from 'react';
import { TreatmentRecord } from '@/types/skin';
import { mockRecords } from '@/data/mockData';

interface RecordsContextType {
  records: TreatmentRecord[];
  addRecord: (record: Omit<TreatmentRecord, 'id'>) => void;
  updateRecord: (id: string, record: Omit<TreatmentRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<TreatmentRecord[]>(mockRecords);

  const addRecord = (record: Omit<TreatmentRecord, 'id'>) => {
    const newRecord: TreatmentRecord = {
      ...record,
      id: `r${Date.now()}`,
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  const updateRecord = (id: string, record: Omit<TreatmentRecord, 'id'>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...record, id } : r));
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  return (
    <RecordsContext.Provider value={{ records, addRecord, updateRecord, deleteRecord }}>
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}
