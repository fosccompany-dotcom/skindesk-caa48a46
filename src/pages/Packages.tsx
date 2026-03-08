import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockPackages, mockRecords } from '@/data/mockData';
import { SKIN_LAYER_LABELS, BODY_AREA_LABELS, SkinLayer, BodyArea } from '@/types/skin';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

const layers: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];
const bodyAreas: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];

const Packages = () => {
  const [filterType, setFilterType] = useState<'layer' | 'body'>('body');

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">시술권 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">부위별 · 피부층별 관리 현황</p>
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* Toggle between body area and skin layer filter */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterType('body')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterType === 'body' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            부위별
          </button>
          <button
            onClick={() => setFilterType('layer')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterType === 'layer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            피부층별
          </button>
        </div>

        {filterType === 'body' ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full flex overflow-x-auto mb-4 h-auto flex-wrap gap-1">
              <TabsTrigger value="all" className="text-xs">전체</TabsTrigger>
              {bodyAreas.filter(a => mockPackages.some(p => p.bodyArea === a)).map((a) => (
                <TabsTrigger key={a} value={a} className="text-xs">{BODY_AREA_LABELS[a]}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {mockPackages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
            </TabsContent>

            {bodyAreas.map((area) => (
              <TabsContent key={area} value={area} className="space-y-3">
                {mockPackages.filter(p => p.bodyArea === area).map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
                <RecordsList records={mockRecords.filter(r => r.bodyArea === area)} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="all" className="text-xs">전체</TabsTrigger>
              {layers.map((l) => (
                <TabsTrigger key={l} value={l} className="text-xs">{SKIN_LAYER_LABELS[l]}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {mockPackages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
            </TabsContent>

            {layers.map((layer) => (
              <TabsContent key={layer} value={layer} className="space-y-3">
                {mockPackages.filter(p => p.skinLayer === layer).map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
                <RecordsList records={mockRecords.filter(r => r.skinLayer === layer)} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

function RecordsList({ records }: { records: typeof mockRecords }) {
  if (records.length === 0) return null;
  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">시술 기록</h3>
      {records.map((rec) => (
        <Card key={rec.id} className="glass-card">
          <CardContent className="flex items-center gap-3 p-3">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-medium">{rec.treatmentName}</p>
                <BodyAreaBadge area={rec.bodyArea} />
                <SkinLayerBadge layer={rec.skinLayer} />
              </div>
              <p className="text-xs text-muted-foreground">{rec.date} · {rec.clinic}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: typeof mockPackages[0] }) {
  const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
  const remaining = pkg.totalSessions - pkg.usedSessions;

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-semibold">{pkg.name}</span>
              <BodyAreaBadge area={pkg.bodyArea} />
              <SkinLayerBadge layer={pkg.skinLayer} />
            </div>
            <p className="text-xs text-muted-foreground">{pkg.clinic}</p>
          </div>
          <div className="text-right shrink-0 ml-2">
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
