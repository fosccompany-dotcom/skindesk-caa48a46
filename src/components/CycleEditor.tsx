import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Plus, Pencil, Trash2, Check } from 'lucide-react';
import {
  TreatmentCycle, SkinLayer, BodyArea,
  SKIN_LAYER_LABELS, BODY_AREA_LABELS, CYCLE_PRESETS,
  PACKAGE_MENU_ITEMS, PACKAGE_TIER_LABELS, PackageTier, PackageMenuItem,
} from '@/types/skin';

const skinLayers: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];
const bodyAreas: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];

interface CycleEditorProps {
  cycles: TreatmentCycle[];
  onUpdate: (cycles: TreatmentCycle[]) => void;
}

export function CycleEditorSheet({ cycles, onUpdate }: CycleEditorProps) {
  const [open, setOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<TreatmentCycle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleAdd = () => {
    setShowPresets(true);
    setEditingCycle(null);
  };

  const handleSelectPreset = (preset: typeof CYCLE_PRESETS[0]) => {
    const newCycle: TreatmentCycle = {
      id: `c_${Date.now()}`,
      treatmentName: preset.treatmentName,
      skinLayer: preset.skinLayer,
      bodyArea: 'face',
      cycleDays: preset.defaultCycleDays,
      lastTreatmentDate: format(new Date(), 'yyyy-MM-dd'),
      isCustomCycle: false,
      clinic: '',
      product: preset.product,
    };
    setEditingCycle(newCycle);
    setIsNew(true);
    setShowPresets(false);
  };

  const handleAddCustom = () => {
    const newCycle: TreatmentCycle = {
      id: `c_${Date.now()}`,
      treatmentName: '',
      skinLayer: 'epidermis',
      bodyArea: 'face',
      cycleDays: 30,
      lastTreatmentDate: format(new Date(), 'yyyy-MM-dd'),
      isCustomCycle: true,
      clinic: '',
    };
    setEditingCycle(newCycle);
    setIsNew(true);
    setShowPresets(false);
  };

  const handleEdit = (cycle: TreatmentCycle) => {
    setEditingCycle({ ...cycle });
    setIsNew(false);
    setShowPresets(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(cycles.filter(c => c.id !== id));
  };

  const handleSave = (cycle: TreatmentCycle) => {
    if (isNew) {
      onUpdate([...cycles, cycle]);
    } else {
      onUpdate(cycles.map(c => c.id === cycle.id ? cycle : c));
    }
    setEditingCycle(null);
    setIsNew(false);
  };

  // Group presets by layer
  const presetsByLayer = skinLayers.map(layer => ({
    layer,
    presets: CYCLE_PRESETS.filter(p => p.skinLayer === layer),
  }));

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingCycle(null); setShowPresets(false); } }}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-secondary font-semibold h-auto py-1 px-2 tap-target">
            <Pencil className="h-3 w-3 mr-1" />
            관리
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
          <SheetHeader className="px-5 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">시술 주기 관리</SheetTitle>
              <Button size="sm" variant="outline" className="rounded-full text-xs h-8 tap-target" onClick={handleAdd}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                추가
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(85vh-80px)] px-5 py-4">
            {/* Preset selector */}
            {showPresets && (
              <div className="mb-4 space-y-3">
                <h3 className="text-sm font-bold">프리셋에서 선택</h3>
                {presetsByLayer.map(({ layer, presets }) => (
                  <div key={layer}>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{SKIN_LAYER_LABELS[layer]}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {presets.map((preset, i) => (
                        <Card
                          key={i}
                          className="card-interactive"
                          onClick={() => handleSelectPreset(preset)}
                        >
                          <CardContent className="p-3">
                            <p className="text-xs font-semibold">{preset.treatmentName}</p>
                            {preset.product && <p className="text-[10px] text-muted-foreground">{preset.product}</p>}
                            <p className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs" onClick={handleAddCustom}>
                  직접 입력하기
                </Button>
              </div>
            )}

            {/* Cycle list */}
            {!showPresets && !editingCycle && (
              <div className="space-y-2">
                {cycles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    등록된 시술 주기가 없습니다
                  </p>
                )}
                {cycles.map((cycle) => (
                  <Card key={cycle.id} className="glass-card">
                    <CardContent className="p-3.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold">{cycle.treatmentName}</span>
                          {cycle.product && <span className="text-[10px] text-muted-foreground">({cycle.product})</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {BODY_AREA_LABELS[cycle.bodyArea]} · {cycle.cycleDays}일 주기 · {cycle.clinic || '미지정'}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 tap-target" onClick={() => handleEdit(cycle)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose tap-target" onClick={() => handleDelete(cycle.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit form */}
            {editingCycle && (
              <CycleEditForm
                cycle={editingCycle}
                onSave={handleSave}
                onCancel={() => { setEditingCycle(null); setIsNew(false); }}
                isNew={isNew}
              />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface CycleEditFormProps {
  cycle: TreatmentCycle;
  onSave: (cycle: TreatmentCycle) => void;
  onCancel: () => void;
  isNew: boolean;
}

function CycleEditForm({ cycle, onSave, onCancel, isNew }: CycleEditFormProps) {
  const [form, setForm] = useState<TreatmentCycle>(cycle);
  const [dateOpen, setDateOpen] = useState(false);

  const update = <K extends keyof TreatmentCycle>(key: K, value: TreatmentCycle[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const matchingPreset = CYCLE_PRESETS.find(p => p.treatmentName === form.treatmentName && p.skinLayer === form.skinLayer);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold">{isNew ? '시술 주기 추가' : '시술 주기 수정'}</h3>

      <div className="space-y-2">
        <Label className="text-xs">시술명</Label>
        <Input
          value={form.treatmentName}
          onChange={(e) => update('treatmentName', e.target.value)}
          placeholder="예: 레이저 토닝"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">제품명 (선택)</Label>
        <Input
          value={form.product || ''}
          onChange={(e) => update('product', e.target.value || undefined)}
          placeholder="예: 제오민, 리쥬란HB"
          className="rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">피부층</Label>
          <Select value={form.skinLayer} onValueChange={(v) => update('skinLayer', v as SkinLayer)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {skinLayers.map(l => <SelectItem key={l} value={l}>{SKIN_LAYER_LABELS[l]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">부위</Label>
          <Select value={form.bodyArea} onValueChange={(v) => update('bodyArea', v as BodyArea)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bodyAreas.map(a => <SelectItem key={a} value={a}>{BODY_AREA_LABELS[a]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">
          시술 주기 (일)
          {matchingPreset && !form.isCustomCycle && (
            <span className="text-muted-foreground ml-1">· 기본 {matchingPreset.defaultCycleDays}일</span>
          )}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={form.cycleDays}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              update('cycleDays', val);
              if (matchingPreset && val !== matchingPreset.defaultCycleDays) {
                update('isCustomCycle', true);
              }
            }}
            className="rounded-xl w-24"
          />
          <span className="text-xs text-muted-foreground">일</span>
          {matchingPreset && form.isCustomCycle && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] h-7 text-info tap-target"
              onClick={() => { update('cycleDays', matchingPreset.defaultCycleDays); update('isCustomCycle', false); }}
            >
              기본값 복원
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">마지막 시술일</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl", !form.lastTreatmentDate && "text-muted-foreground")}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              {form.lastTreatmentDate ? format(new Date(form.lastTreatmentDate), 'yyyy년 M월 d일', { locale: ko }) : '날짜 선택'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.lastTreatmentDate ? new Date(form.lastTreatmentDate) : undefined}
              onSelect={(date) => { if (date) { update('lastTreatmentDate', format(date, 'yyyy-MM-dd')); setDateOpen(false); } }}
              locale={ko}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">병원</Label>
        <Input
          value={form.clinic}
          onChange={(e) => update('clinic', e.target.value)}
          placeholder="예: 글로우 피부과"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">메모 (선택)</Label>
        <Input
          value={form.notes || ''}
          onChange={(e) => update('notes', e.target.value || undefined)}
          placeholder="예: 턱 보톡스"
          className="rounded-xl"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl h-11 tap-target" onClick={onCancel}>
          취소
        </Button>
        <Button
          className="flex-1 rounded-xl h-11 tap-target"
          onClick={() => onSave(form)}
          disabled={!form.treatmentName}
        >
          <Check className="h-4 w-4 mr-1" />
          {isNew ? '추가' : '저장'}
        </Button>
      </div>
    </div>
  );
}