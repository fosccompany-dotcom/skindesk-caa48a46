import { Wallet, ChevronRight, CalendarDays, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockPackages, mockRecords, mockEvents, currentBalance, mockProfile } from '@/data/mockData';

const Index = () => {
  const navigate = useNavigate();
  const nextEvent = mockEvents.find(e => e.type === 'treatment');
  const recentRecord = mockRecords[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sage safe-top">
        <div className="page-header-gradient pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 font-light">안녕하세요 👋</p>
              <h1 className="mt-0.5 text-xl font-bold">나의 피부 관리</h1>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <span className="text-base">✨</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] opacity-60 bg-white/10 inline-block px-3 py-1.5 rounded-full backdrop-blur-sm">
            {mockProfile.skinType} · {mockProfile.age}세 · {mockProfile.concerns[0]} 집중 관리
          </p>
        </div>
      </div>

      <div className="page-content space-y-4 -mt-3">
        {/* Points Card */}
        <Card className="card-interactive" onClick={() => navigate('/points')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <Wallet className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">보유 포인트</p>
              <p className="text-xl font-bold tracking-tight">{currentBalance.toLocaleString()}원</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* Next appointment */}
        {nextEvent && (
          <Card className="card-interactive" onClick={() => navigate('/calendar')}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-info-light">
                <CalendarDays className="h-5 w-5 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">다음 시술</p>
                <p className="text-sm font-semibold truncate">{nextEvent.title}</p>
                <p className="text-[11px] text-muted-foreground">{nextEvent.date}</p>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                {nextEvent.bodyArea && <BodyAreaBadge area={nextEvent.bodyArea} />}
                {nextEvent.skinLayer && <SkinLayerBadge layer={nextEvent.skinLayer} />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Packages overview */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h2 className="text-sm font-bold">시술권 소진 현황</h2>
            <button onClick={() => navigate('/packages')} className="text-xs text-secondary font-semibold tap-target">전체보기</button>
          </div>
          <div className="space-y-2.5">
            {mockPackages.slice(0, 3).map((pkg) => {
              const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
              return (
                <Card key={pkg.id} className="card-interactive" onClick={() => navigate('/packages')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="font-semibold text-sm truncate">{pkg.name}</span>
                        <BodyAreaBadge area={pkg.bodyArea} />
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{pkg.clinic}</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                      <span>{pkg.usedSessions}/{pkg.totalSessions}회</span>
                      <span>~{pkg.expiryDate}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent treatment */}
        {recentRecord && (
          <div>
            <h2 className="section-title">최근 시술</h2>
            <Card className="glass-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-light">
                  <Sparkles className="h-5 w-5 text-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm">{recentRecord.treatmentName}</span>
                    <BodyAreaBadge area={recentRecord.bodyArea} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{recentRecord.date} · {recentRecord.clinic}</p>
                  {recentRecord.notes && <p className="text-[11px] text-muted-foreground mt-1">📝 {recentRecord.notes}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;