import { useState, useRef, useCallback, useEffect } from 'react';
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

const HIDDEN_PATHS = ['/signup', '/farewell'];
const FAB_COACH_KEY = 'skindesk_fab_coach_done';
const FAB_POS_KEY = 'skindesk_fab_pos';

const DEFAULT_POS = { right: 20, bottom: 88 };

function loadPos() {
  try {
    const saved = localStorage.getItem(FAB_POS_KEY);
    if (saved) return JSON.parse(saved) as { right: number; bottom: number };
  } catch {}
  return DEFAULT_POS;
}

const GlobalFAB = () => {
  const location = useLocation();
  const { addRecord } = useRecords();
  const [modalOpen, setModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const { showLoginSheet, guardAction, handleLoginSuccess, handleClose: handleLoginClose } = useLoginGuard();

  // Drag state
  const [pos, setPos] = useState(loadPos);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, right: 0, bottom: 0 });
  const movedRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Clamp position within viewport
  const clamp = useCallback((right: number, bottom: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = 56; // w-14 = 56px
    return {
      right: Math.max(4, Math.min(right, w - size - 4)),
      bottom: Math.max(4, Math.min(bottom, h - size - 4)),
    };
  }, []);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY, right: pos.right, bottom: pos.bottom };
    movedRef.current = false;
    dragRef.current = false;
  }, [pos]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    if (!dragRef.current && Math.abs(dx) + Math.abs(dy) < 8) return;
    dragRef.current = true;
    movedRef.current = true;
    setDragging(true);
    const newPos = clamp(startRef.current.right - dx, startRef.current.bottom - dy);
    setPos(newPos);
  }, [clamp]);

  const onTouchEnd = useCallback(() => {
    if (dragRef.current) {
      setDragging(false);
      dragRef.current = false;
      localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
    }
  }, [pos]);

  // Mouse handlers (for desktop preview)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom };
    movedRef.current = false;
    dragRef.current = false;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;
      if (!dragRef.current && Math.abs(dx) + Math.abs(dy) < 8) return;
      dragRef.current = true;
      movedRef.current = true;
      setDragging(true);
      const newPos = clamp(startRef.current.right - dx, startRef.current.bottom - dy);
      setPos(newPos);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (dragRef.current) {
        setDragging(false);
        dragRef.current = false;
        setPos(prev => {
          localStorage.setItem(FAB_POS_KEY, JSON.stringify(prev));
          return prev;
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [pos, clamp]);

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  const handleFabClick = () => {
    if (movedRef.current) { movedRef.current = false; return; }
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
      <button
        ref={btnRef}
        onClick={handleFabClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{ right: pos.right, bottom: pos.bottom }}
        className={cn(
          'fixed z-40',
          'w-14 h-14 rounded-full shadow-2xl',
          'bg-accent hover:bg-accent/90',
          'flex items-center justify-center',
          'transition-shadow duration-200',
          dragging ? 'scale-110 shadow-3xl opacity-80' : 'active:scale-95',
          'touch-none select-none'
        )}
        aria-label="시술 기록 추가">
        <Plus className="text-primary stroke-[2.5] h-[27px] w-[27px]" />
      </button>

      {parseModalOpen &&
        <ParseTreatmentModal
          onClose={() => {
            setParseModalOpen(false);
            setModalOpen(false);
          }} />
      }

      <AddTreatmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editRecord={null}
        onOpenParse={() => {
          setParseModalOpen(true);
          setModalOpen(false);
        }} />

      <FabCoachmark
        open={coachOpen && modalOpen}
        onClose={handleCloseCoach}
        onClickParse={handleCoachParse}
      />

      <LoginRequiredSheet
        open={showLoginSheet}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default GlobalFAB;
