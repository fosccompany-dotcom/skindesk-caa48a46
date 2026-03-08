import { Wallet, TrendingUp, CalendarDays, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import SkinLayerBadge from '@/components/SkinLayerBadge';
import { mockPackages, mockRecords, mockEvents, currentBalance, mockProfile } from '@/data/mockData';

const Index = () => {
  const navigate = useNavigate();
  const nextEvent = mockEvents.find(e => e.type === 'treatment');
  const recentRecord = mockRecords[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-sage px-5 pb-8 pt-12 text-primary-foreground">
        <p className="text-sm opacity-80">안녕하세요 👋</p>
        <h1 className="mt-1 text-2xl font-bold">나의 피부 관리</h1>
        <p className="mt-1 text-sm opacity-80">{mockProfile.skinType} · {mockProfile.age}세 · {mockProfile.concerns[0]} 집중 관리 중</p>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 -mt-4">
        {/* Points Card */}
        <Card className="glass-card cursor-pointer" onClick={() => navigate('/points')}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light">
              <Wallet className="h-5 w-5 text-sage-dark" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">보유 포인트</p>
              <p className="text-xl font-bold">{currentBalance.toLocaleString()}원</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Next appointment */}
        {nextEvent && (
          <Card className="glass-card cursor-pointer" onClick={() => navigate('/calendar')}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info-light">
                <CalendarDays className="h-5 w-5 text-info" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">다음 시술</p>
                <p className="font-semibold">{nextEvent.title}</p>
                <p className="text-xs text-muted-foreground">{nextEvent.date}</p>
              </div>
              {nextEvent.skinLayer && <SkinLayerBadge layer={nextEvent.skinLayer} />}
            </CardContent>
          </Card>
        )}

        {/* Packages overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold">시술권 소진 현황</h2>
            <button onClick={() => navigate('/packages')} className="text-xs text-primary font-medium">전체보기</button>
          </div>
          {mockPackages.map((pkg) => {
            const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
            return (
              <Card key={pkg.id} className="glass-card cursor-pointer" onClick={() => navigate('/packages')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{pkg.name}</span>
                      <SkinLayerBadge layer={pkg.skinLayer} />
                    </div>
                    <span className="text-xs text-muted-foreground">{pkg.clinic}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>{pkg.usedSessions}/{pkg.totalSessions}회 사용</span>
                    <span>~{pkg.expiryDate}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent treatment */}
        {recentRecord && (
          <div className="space-y-2">
            <h2 className="px-1 font-semibold">최근 시술</h2>
            <Card className="glass-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-light">
                  <Sparkles className="h-5 w-5 text-amber" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{recentRecord.treatmentName}</span>
                    <SkinLayerBadge layer={recentRecord.skinLayer} />
                  </div>
                  <p className="text-xs text-muted-foreground">{recentRecord.date} · {recentRecord.clinic}</p>
                  {recentRecord.notes && <p className="text-xs text-muted-foreground mt-1">📝 {recentRecord.notes}</p>}
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
