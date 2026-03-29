import React, { useState, useRef } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TabConfig {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface DraggableTabsListProps {
  tabs: TabConfig[];
  onReorder: (newOrder: string[]) => void;
}

const DraggableTabsList: React.FC<DraggableTabsListProps> = ({ tabs, onReorder }) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartIdx = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Desktop drag
  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      const newTabs = [...tabs];
      const [moved] = newTabs.splice(dragIdx, 1);
      newTabs.splice(idx, 0, moved);
      onReorder(newTabs.map(t => t.key));
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  // Touch drag
  const handleTouchStart = (idx: number) => (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartIdx.current = idx;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartIdx.current === null || tabs.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    const fromIdx = touchStartIdx.current;
    let toIdx = fromIdx;

    if (dx > threshold && fromIdx > 0) toIdx = fromIdx - 1;
    else if (dx < -threshold && fromIdx < tabs.length - 1) toIdx = fromIdx + 1;

    if (toIdx !== fromIdx) {
      const newTabs = [...tabs];
      const [moved] = newTabs.splice(fromIdx, 1);
      newTabs.splice(toIdx, 0, moved);
      onReorder(newTabs.map(t => t.key));
    }
    touchStartIdx.current = null;
  };

  return (
    <div ref={containerRef} className="mb-4">
      <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab, idx) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            draggable
            onDragStart={handleDragStart(idx)}
            onDragOver={handleDragOver(idx)}
            onDrop={handleDrop(idx)}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart(idx)}
            onTouchEnd={handleTouchEnd}
            className={cn(
              'cursor-grab active:cursor-grabbing select-none transition-all',
              dragIdx === idx && 'opacity-50 scale-95',
              overIdx === idx && dragIdx !== idx && 'ring-2 ring-primary/30',
            )}
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};

export default DraggableTabsList;
