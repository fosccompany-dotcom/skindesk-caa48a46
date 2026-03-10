import { useState, useRef } from 'react';
import { X, Clipboard, ImagePlus, Loader2, CheckCircle, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useRecords } from '@/context/RecordsContext';
import { TreatmentRecord, SkinLayer, BodyArea } from '@/types/skin';

const SKIN_LAYER_COLOR: Record<string, string> = {
  epidermis:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  dermis:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  subcutaneous: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};
const LAYER_LABEL: Record<string, string> = {
  epidermis: '표피', dermis: '진피', subcutaneous: '피하',
};

interface ParsedRecord {
  date: string;
  treatmentName: string;
  clinic: string | null;
  amount_paid: number | null;
  skinLayer: SkinLayer;
  bodyArea: BodyArea;
  memo: string | null;
  // UI state
  selected: boolean;
  expanded: boolean;
}

interface Props {
  onClose: () => void;
}

type Tab = 'text' | 'image';

export default function ParseTreatmentModal({ onClose }: Props) {
  const { addRecord } = useRecords();
  const [tab, setTab] = useState<Tab>('text');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRecord[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [parseSource, setParseSource] = useState<string|null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    setParsed(null);

    try {
      let body: Record<string, any> = {};

      if (tab === 'text') {
        if (!text.trim()) { setError('텍스트를 입력해주세요.'); setLoading(false); return; }
        body = { text };
      } else {
        if (!imageFile) { setError('이미지를 선택해주세요.'); setLoading(false); return; }
        // base64 변환
        const base64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            res(result.split(',')[1]); // data:image/...;base64, 제거
          };
          reader.onerror = rej;
          reader.readAsDataURL(imageFile);
        });
        body = {
          image_base64: base64,
          image_type: imageFile.type,
          text: text.trim() || undefined,
        };
      }

      const { data, error: fnError } = await supabase.functions.invoke('parse-treatment', {
        body,
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.records?.length) {
        setError('시술 정보를 찾지 못했습니다. 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      setParsed(
        data.records.map((r: any) => ({
          ...r,
          clinic: r.clinic || '',
          skinLayer: r.skinLayer || 'dermis',
          bodyArea: r.bodyArea || 'face',
          selected: true,
          expanded: true,
        }))
      );
      setParseSource(data.source || null);
    } catch (e: any) {
      setError(e.message || '파싱 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) => {
    setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  };
  const toggleExpand = (i: number) => {
    setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, expanded: !r.expanded } : r));
  };
  const updateField = (i: number, field: string, value: any) => {
    setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    if (!parsed) return;
    const toSave = parsed.filter(r => r.selected);
    if (!toSave.length) return;

    setSaving(true);
    for (const r of toSave) {
      await addRecord({
        date: r.date,
        packageId: '',
        treatmentName: r.treatmentName,
        skinLayer: r.skinLayer,
        bodyArea: r.bodyArea,
        clinic: r.clinic || '',
        satisfaction: undefined,
        notes: undefined,
        memo: r.memo || undefined,
        amount_paid: r.amount_paid ?? undefined,
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  const selectedCount = parsed?.filter(r => r.selected).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-lg bg-[#111] rounded-t-3xl max-h-[90vh] flex flex-col">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A96E]" />
            <span className="font-bold text-sm">문자/카톡으로 자동 등록</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X size={16} className="text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!parsed ? (
            <div className="p-5 space-y-4">
              {/* 탭 */}
              <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                {(['text', 'image'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
                      tab === t ? 'bg-[#C9A96E] text-black' : 'text-white/50 hover:text-white/80')}>
                    {t === 'text' ? <><Clipboard size={13} /> 문자/카톡 붙여넣기</> : <><ImagePlus size={13} /> 이미지 업로드</>}
                  </button>
                ))}
              </div>

              {/* 텍스트 탭 */}
              {tab === 'text' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-white/40">병원에서 받은 문자나 카톡 내용을 그대로 붙여넣으세요</p>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={"5월 31일\n슈링크 유니버스 300샷 + 인모드FX 1부위 1회\n시술 진행 하셨습니다 :)"}
                    className="w-full h-36 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-[#C9A96E]/50"
                  />
                </div>
              )}

              {/* 이미지 탭 */}
              {tab === 'image' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-white/40">카카오톡 또는 문자 스크린샷을 업로드하세요</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="preview" className="w-full max-h-48 object-contain bg-white/5" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full h-36 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#C9A96E]/40 transition-colors">
                      <ImagePlus size={24} className="text-white/30" />
                      <span className="text-xs text-white/40">탭하여 이미지 선택</span>
                    </button>
                  )}

                  {imagePreview && (
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="병원명 등 보충 정보가 있으면 입력 (선택사항)"
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-[#C9A96E]/50"
                    />
                  )}
                </div>
              )}

              {/* 에러 */}
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-400">{error}</p>
                </div>
              )}

              {/* 파싱 버튼 */}
              <button onClick={handleParse} disabled={loading}
                className="w-full py-3.5 bg-[#C9A96E] text-black font-bold text-sm rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> 분석 중...</>
                  : <><Sparkles size={16} /> 시술 정보 자동 추출</>}
              </button>
            </div>
          ) : (
            /* 파싱 결과 */
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60">{parsed.length}개 시술 감지 · {selectedCount}개 선택됨</p>
                <div className="flex items-center gap-2">
                  {parseSource === 'keyword_fallback' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">키워드 파싱 — 내용 확인 후 저장</span>
                  )}
                  <button onClick={() => setParsed(null)} className="text-xs text-[#C9A96E]">다시 입력</button>
                </div>
              </div>

              <div className="space-y-2">
                {parsed.map((r, i) => (
                  <div key={i}
                    className={cn('rounded-xl border transition-all',
                      r.selected ? 'border-[#C9A96E]/40 bg-[#C9A96E]/5' : 'border-white/10 bg-white/3 opacity-50')}>
                    {/* 카드 헤더 */}
                    <div className="flex items-center gap-3 p-3.5">
                      {/* 체크박스 */}
                      <button onClick={() => toggleSelect(i)}
                        className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                          r.selected ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-white/30')}>
                        {r.selected && <div className="w-2 h-2 rounded-full bg-black" />}
                      </button>

                      <div className="flex-1 min-w-0" onClick={() => toggleExpand(i)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{r.treatmentName}</span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', SKIN_LAYER_COLOR[r.skinLayer])}>
                            {LAYER_LABEL[r.skinLayer]}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          {r.date} {r.clinic && `· ${r.clinic}`}
                          {r.amount_paid != null && ` · ₩${r.amount_paid.toLocaleString()}`}
                        </p>
                      </div>

                      <button onClick={() => toggleExpand(i)} className="p-1 text-white/30">
                        {r.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* 펼쳐진 수정 폼 */}
                    {r.expanded && (
                      <div className="px-3.5 pb-3.5 space-y-2 border-t border-white/10 pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-white/40 mb-1 block">날짜</label>
                            <input type="date" value={r.date}
                              onChange={e => updateField(i, 'date', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 mb-1 block">금액 (VAT포함)</label>
                            <input type="number" value={r.amount_paid ?? ''}
                              onChange={e => updateField(i, 'amount_paid', e.target.value ? Number(e.target.value) : null)}
                              placeholder="미확인"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">병원명</label>
                          <input type="text" value={r.clinic ?? ''}
                            onChange={e => updateField(i, 'clinic', e.target.value)}
                            placeholder="병원명 입력"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">시술명</label>
                          <input type="text" value={r.treatmentName}
                            onChange={e => updateField(i, 'treatmentName', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                        </div>
                        {r.memo && (
                          <div>
                            <label className="text-[10px] text-white/40 mb-1 block">메모</label>
                            <input type="text" value={r.memo}
                              onChange={e => updateField(i, 'memo', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        {parsed && (
          <div className="p-5 border-t border-white/10">
            {saved ? (
              <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
                <CheckCircle size={18} />
                <span className="font-semibold text-sm">저장 완료!</span>
              </div>
            ) : (
              <button onClick={handleSave} disabled={saving || selectedCount === 0}
                className="w-full py-3.5 bg-[#C9A96E] text-black font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> 저장 중...</>
                  : <><CheckCircle size={16} /> {selectedCount}개 시술 기록 저장</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
