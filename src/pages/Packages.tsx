import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SkinLayerBadge from '@/components/SkinLayerBadge';
import { mockPackages, mockRecords } from '@/data/mockData';
import { SKIN_LAYER_LABELS, SkinLayer } from '@/types/skin';
import { Sparkles } from 'lucide-react';

const layers: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];

const Packages = () => (
  <div className="min-h-screen bg-background pb-24">
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-xl font-bold">시술권 관리</h1>
      <p className="text-sm text-muted-foreground mt-1">피부층별 관리 현황을 확인하세요</p>
    </div>

    <div className="mx-auto max-w-lg px-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="all">전체</TabsTrigger>
          {layers.map((l) => (
            <TabsTrigger key={l} value={l}>{SKIN_LAYER_LABELS[l]}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {mockPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </TabsContent>

        {layers.map((layer) => (
          <TabsContent key={layer} value={layer} className="space-y-3">
            {mockPackages.filter(p => p.skinLayer === layer).map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">시술 기록</h3>
              {mockRecords.filter(r => r.skinLayer === layer).map((rec) => (
                <Card key={rec.id} className="glass-card">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.treatmentName}</p>
                      <p className="text-xs text-muted-foreground">{rec.date} · {rec.clinic}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  </div>
);

function PackageCard({ pkg }: { pkg: typeof mockPackages[0] }) {
  const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
  const remaining = pkg.totalSessions - pkg.usedSessions;

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{pkg.name}</span>
              <SkinLayerBadge layer={pkg.skinLayer} />
            </div>
            <p className="text-xs text-muted-foreground">{pkg.clinic}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{remaining}</p>
            <p className="text-xs text-muted-foreground">잔여 회</p>
          </div>
        </div>
        <Progress value={progress} className="h-2.5" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{pkg.usedSessions}회 사용 / {pkg.totalSessions}회</span>
          <span>만료 {pkg.expiryDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default Packages;
