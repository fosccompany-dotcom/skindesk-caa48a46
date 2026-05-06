import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Calendar, Building2, Settings as SettingsIcon, Heart, Sparkles, ChevronRight } from 'lucide-react';
import { CLINIC_PRESETS } from '@/constants/clinicPresets';
import { CLINIC_EVENTS, getEventsByClinicIds, ClinicEvent } from '@/data/clinicEvents';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'favorite_clinics';

const ClinicEvents = () => {
  const navigate = useNavigate();
  const [favClinics, setFavClinics] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFavClinics(JSON.parse(saved));
    } catch {}
  }, []);

  const events = useMemo(() => getEventsByClinicIds(favClinics), [favClinics]);

  const grouped = useMemo(() => {
    return events.reduce<Record<string, ClinicEvent[]>>((acc, e) => {
      if (!acc[e.clinicLabel]) acc[e.clinicLabel] = [];
      acc[e.clinicLabel].push(e);
      return acc;
    }, {});
  }, [events]);

  const monthLabel = useMemo(() => {
    const d = new Date();
    return `${d.getMonth() + 1}월`;
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="이달의 이벤트" showBack />
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {monthLabel} 즐겨찾기 클리닉 이벤트
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              마이페이지에서 즐겨찾기한 클리닉의 이번 달 이벤트를 모아봤어요
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1 shrink-0"
            onClick={() => navigate('/profile#fav-clinics')}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            병원 설정
          </Button>
        </div>
      </div>

      <div className="page-content pt-4 space-y-3">
        {favClinics.length === 0 && (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3">
            <Heart className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-foreground font-medium">마이 페이지에서 자주가는 클리닉을 즐겨찾기 해보세요!</p>
            <p className="text-xs text-muted-foreground">
              마이페이지에서 자주 가는 클리닉을 선택하면<br />
              이번 달 이벤트를 한눈에 볼 수 있어요
            </p>
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => navigate('/profile#fav-clinics')}
            >
              지금 클리닉 선택하기
            </Button>
          </div>
        )}

        {favClinics.length > 0 && events.length === 0 && (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              선택한 클리닉의 이번 달 이벤트가 아직 없어요
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([clinic, list]) => (
          <div key={clinic} className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-primary/5 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{clinic}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{list.length}건</Badge>
            </div>
            <div className="divide-y divide-border/30">
              {list.map(e => (
                <div key={e.id} className="px-3.5 py-3 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {e.badge && (
                        <Badge
                          variant={e.badge === 'HOT' ? 'destructive' : e.badge === 'BEST' ? 'default' : 'secondary'}
                          className="text-[9px] px-1.5 py-0 h-4"
                        >
                          {e.badge}
                        </Badge>
                      )}
                      {e.category && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{e.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1">{e.title}</p>
                    {e.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>
                    )}
                    {e.validUntil && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {e.validUntil}까지
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    {e.discount && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 mb-1">
                        -{e.discount}
                      </Badge>
                    )}
                    {e.originalPrice && (
                      <span className="text-[10px] text-muted-foreground/60 line-through">
                        {e.originalPrice}
                      </span>
                    )}
                    <span className="text-sm text-primary font-bold whitespace-nowrap">
                      {e.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 다른 병원 둘러보기 */}
        {favClinics.length > 0 && (
          <button
            onClick={() => navigate('/profile#fav-clinics')}
            className="w-full glass-card rounded-2xl px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition-transform"
          >
            <div>
              <p className="text-sm font-medium text-foreground">다른 병원 추가하기</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                전체 {CLINIC_PRESETS.length}개 병원 중 선택할 수 있어요
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ClinicEvents;
