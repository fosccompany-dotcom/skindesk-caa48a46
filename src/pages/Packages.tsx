import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { useRecords } from '@/context/RecordsContext';
import { TreatmentRecord, SKIN_LAYER_LABELS, BODY_AREA_LABELS, SkinLayer, BodyArea } from '@/types/skin';
import { Sparkles, Building2, Plus, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Package {
  id: string;
  name: string;
  clinic: string;
  total_sessions: number;
  used_sessions: number;
  expiry_date: string | null;
  skin_layer?: string;
  body_area?: string;
}

const Packages = () => {
  const { records } = useRecords();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('treatment_packages')
        .select('id, name, clinic, total_sessions, used_sessions, expiry_date, skin_layer, body_area')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPackages(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const clinics = useMemo(() => {
    const s = new Set<string>();
    packages.forEach(p => p.clinic && s.add(p.clinic));
    records.forEach(r => r.clinic && s.add(r.clinic));
    return Array.from(s);
  }, [packages, records]);

  const filteredPackages = useMemo(() =>
    selectedClinic ? packages.filter(p => p.clinic === selectedClinic) : packages,
    [packages, selectedClinic]
  );

  const filteredRecords = useMemo(() =>
    selectedClinic ? records.filter(r => r.clinic === selectedClinic) : records,
    [records, selectedClinic]
  );

  const activePackages  = filteredPackages.filter(p => p.total_sessions - p.used_sessions > 0);
  const finishedPackages = filteredPackages.filter(p => p.total_sessions - p.used_sessions <= 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">시술권 관리</h1>
            <p className="text-xs text-muted-foreground mt-0.5">등록된 시술권 · 잔여 횟수</p>
          </div>
        </div>
      </div>

      <div className="page-content pb-28">

        {/* 병원 필터 */}
        {clinics.length > 0 && (
          <ScrollArea className="w-full mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClinic(null)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  !selectedClinic ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Building2 className="h-3 w-3" /> 전체
              </button>
              {clinics.map(clinic => (
                <button key={clinic}
                  onClick={() => setSelectedClinic(clinic)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedClinic === clinic ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Building2 className="h-3 w-3" /> {clinic}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">불러오는 중...</div>
        ) : filteredPackages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center mt-4">
            <p className="text-sm font-semibold text-gray-500 mb-1">시술권을 등록하면</p>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              남은 횟수와 다음 관리 시점을<br />자동으로 알려드려요!
            </p>
            <p className="text-xs text-gray-400">문자/카카오 메시지로 자동 등록하거나<br />홈 화면에서 직접 추가할 수 있어요</p>
          </div>
        ) : (
          <>
            {/* 잔여 시술권 */}
            {activePackages.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 mb-2 px-0.5">잔여 시술권 {activePackages.length}개</p>
                <div className="space-y-2.5">
                  {activePackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                </div>
              </div>
            )}

            {/* 완료된 시술권 */}
            {finishedPackages.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 mb-2 px-0.5">완료 {finishedPackages.length}개</p>
                <div className="space-y-2.5 opacity-50">
                  {finishedPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                </div>
              </div>
            )}

            {/* 시술 기록 */}
            {filteredRecords.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <p className="text-xs font-bold text-gray-500">시술 기록 {filteredRecords.length}건</p>
                  <button onClick={() => navigate('/')} className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    홈에서 전체보기 <ChevronRight size={10} />
                  </button>
                </div>
                <div className="space-y-2">
                  {filteredRecords.slice(0, 5).map(rec => (
                    <Card key={rec.id} className="glass-card">
                      <CardContent className="flex items-center gap-3 p-3">
                        <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{rec.treatmentName}</p>
                          <p className="text-[11px] text-muted-foreground">{rec.date} · {rec.clinic}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredRecords.length > 5 && (
                    <p className="text-[11px] text-center text-gray-400">+{filteredRecords.length - 5}건 더 있음</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function PackageCard({ pkg }: { pkg: Package }) {
  const remaining = pkg.total_sessions - pkg.used_sessions;
  const progress  = (pkg.used_sessions / pkg.total_sessions) * 100;

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-snug">{pkg.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{pkg.clinic}</p>
            {pkg.expiry_date && (
              <p className="text-[10px] text-muted-foreground mt-0.5">만료 {pkg.expiry_date}</p>
            )}
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-2xl font-black text-primary">{remaining}</p>
            <p className="text-[10px] text-muted-foreground">잔여</p>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mb-1.5" />
        <p className="text-[11px] text-muted-foreground text-right">
          {pkg.used_sessions}회 사용 / 총 {pkg.total_sessions}회
        </p>
      </CardContent>
    </Card>
  );
}

export default Packages;
