import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AddTreatmentModal from './AddTreatmentModal';
import ParseTreatmentModal from './ParseTreatmentModal';
import FabCoachmark from './FabCoachmark';
import LoginRequiredSheet from './LoginRequiredSheet';
import { useRecords } from '@/context/RecordsContext';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import { TreatmentRecord } from '@/types/skin';

// 인증/온보딩 페이지에서는 숨김
const HIDDEN_PATHS = ['/login', '/signup'];

const FAB_COACH_KEY = 'skindesk_fab_coach_done';

const GlobalFAB = () => {
  const location = useLocation();
  const { addRecord } = useRecords();
  const [modalOpen, setModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const { showLoginSheet, guardAction, handleLoginSuccess, handleClose: handleLoginClose } = useLoginGuard();

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  const handleFabClick = () => {
    guardAction(() => {
      setModalOpen(true);
      if (!localStorage.getItem(FAB_COACH_KEY)) {
        setTimeout(() => setCoachOpen(true), 300);
      }
    });
  };

  const handleCloseCoach = () => {
    setCoachOpen(false);
    localStorage.setItem(FAB_COACH_KEY, 'true');
  };

  const handleCoachParse = () => {
    handleCloseCoach();
    setModalOpen(false);
    setTimeout(() => setParseModalOpen(true), 200);
  };

  const handleSave = (record: Omit<TreatmentRecord, 'id'>) => {
    addRecord(record);
    setModalOpen(false);
  };

  return (
    <>
      {/* FAB 버튼 */}
      <button
        onClick={handleFabClick}
        className={cn(
          'fixed z-40 right-5 bottom-[88px]',
          'w-14 h-14 rounded-full shadow-2xl',
          'bg-[#F2C94C] hover:bg-[#e0b83e] active:scale-95',
          'flex items-center justify-center',
          'transition-all duration-200',
          'max-[430px]:right-5'
        )}
        aria-label="시술 기록 추가">
        <Plus className="text-[#E87461] stroke-[2.5] h-[27px] w-[27px]" />
      </button>

      {/* ParseTreatmentModal */}
      {parseModalOpen &&
        <ParseTreatmentModal
          onClose={() => {
            setParseModalOpen(false);
            setModalOpen(false);
          }} />
      }

      {/* AddTreatmentModal */}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editRecord={null}
        onOpenParse={() => {
          setModalOpen(false);
          setParseModalOpen(true);
        }} />

      {/* FAB 코치마크 */}
      <FabCoachmark
        open={coachOpen && modalOpen}
        onClose={handleCloseCoach}
        onClickParse={handleCoachParse}
      />
    </>
  );
};

export default GlobalFAB;