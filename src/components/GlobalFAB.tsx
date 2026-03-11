import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AddTreatmentModal from './AddTreatmentModal';
import ParseTreatmentModal from './ParseTreatmentModal';
import { useRecords } from '@/context/RecordsContext';
import { TreatmentRecord } from '@/types/skin';

// 인증/온보딩 페이지에서는 숨김
const HIDDEN_PATHS = ['/login', '/signup'];

const GlobalFAB = () => {
  const location = useLocation();
  const { addRecord } = useRecords();
  const [modalOpen, setModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  const handleSave = (record: Omit<TreatmentRecord, 'id'>) => {
    addRecord(record);
    setModalOpen(false);
  };

  return (
    <>
      {/* FAB 버튼 — BottomNav(64px) + 여백 16px */}
      <button
        onClick={() => setModalOpen(true)}
        className={cn(
          'fixed z-40 right-5 bottom-[88px]',
          'w-14 h-14 rounded-full shadow-2xl',
          'bg-[#C9A96E] hover:bg-[#b8955c] active:scale-95',
          'flex items-center justify-center',
          'transition-all duration-200',
          // max-width 컨테이너 안에서만 표시되도록
          'max-[430px]:right-5'
        )}
        aria-label="시술 기록 추가"
      >
        <Plus className="w-6 h-6 text-white stroke-[2.5]" />
      </button>

      {/* ParseTreatmentModal */}
      {parseModalOpen && (
        <ParseTreatmentModal
          onClose={() => {
            setParseModalOpen(false);
            setModalOpen(false);
          }}
        />
      )}

      {/* AddTreatmentModal */}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editRecord={null}
        onOpenParse={() => {
          setModalOpen(false);
          setParseModalOpen(true);
        }}
      />
    </>
  );
};

export default GlobalFAB;
