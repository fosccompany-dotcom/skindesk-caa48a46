import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockPackages, mockRecords } from '@/data/mockData';
import { SKIN_LAYER_LABELS, BODY_AREA_LABELS, SkinLayer, BodyArea } from '@/types/skin';
import { Sparkles, Building2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const layers: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];
const bodyAreas: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];

const Packages = () => {
  const [filterType, setFilterType] = useState<'layer' | 'body'>('body');
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  const clinics = useMemo(() => {
    const clinicSet = new Set<string>();
    mockPackages.forEach(p => clinicSet.add(p.clinic));
    mockRecords.forEach(r => clinicSet.add(r.clinic));
    return Array.from(clinicSet);
  }, []);

  const filteredPackages = useMemo(() =>
    selectedClinic ? mockPackages.filter(p => p.clinic === selectedClinic) : mockPackages,
    [selectedClinic]
  );

  const filteredRecords = useMemo(() =>
    selectedClinic ? mockRecords.filter(r => r.clinic === selectedClinic) : mockRecords,
    [selectedClinic]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">시술권 관리</h1>
        <p className="text-xs text-muted-foreground mt-1">부위별 · 피부층별 관리 현황</p>
      </div>

      <div className="page-content">
        {/* Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterType('body')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all tap-target ${filterType === 'body' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}
          >
            부위별
          </button>
          <button
            onClick={() => setFilterType('layer')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all tap-target ${filterType === 'layer' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}
          >
            피부층별
          </button>
        </div>

        {/* Clinic Filter */}
        <ScrollArea className="w-full mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedClinic(null)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                !selectedClinic ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Building2 className="h-3 w-3" />
              전체 병원
            </button>
            {clinics.map((clinic) => (
              <button
                key={clinic}
                onClick={() => setSelectedClinic(clinic)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedClinic === clinic ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Building2 className="h-3 w-3" />
                {clinic}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {filterType === 'body' ? (
          <Tabs defaultValue="all" className="w-full">
            <ScrollArea className="w-full mb-4">
              <TabsList className="inline-flex w-auto gap-1 h-auto bg-transparent p-0">
                <TabsTrigger value="all" className="text-xs rounded-full px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">전체</TabsTrigger>
                {bodyAreas.filter(a => filteredPackages.some(p => p.bodyArea === a)).map((a) => (
                  <TabsTrigger key={a} value={a} className="text-xs rounded-full px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{BODY_AREA_LABELS[a]}</TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <TabsContent value="all" className="space-y-2.5 mt-0">
              {filteredPackages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
            </TabsContent>

            {bodyAreas.map((area) => (
              <TabsContent key={area} value={area} className="space-y-2.5 mt-0">
                {filteredPackages.filter(p => p.bodyArea === area).map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
                <RecordsList records={filteredRecords.filter(r => r.bodyArea === area)} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4 h-auto bg-muted rounded-2xl p-1">
              <TabsTrigger value="all" className="text-xs rounded-xl py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">전체</TabsTrigger>
              {layers.map((l) => (
                <TabsTrigger key={l} value={l} className="text-xs rounded-xl py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{SKIN_LAYER_LABELS[l]}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-2.5 mt-0">
              {mockPackages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
            </TabsContent>

            {layers.map((layer) => (
              <TabsContent key={layer} value={layer} className="space-y-2.5 mt-0">
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
      <h3 className="text-xs font-semibold text-muted-foreground px-1">시술 기록</h3>
      {records.map((rec) => (
        <Card key={rec.id} className="glass-card">
          <CardContent className="flex items-center gap-3 p-3">
            <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-medium">{rec.treatmentName}</p>
                <BodyAreaBadge area={rec.bodyArea} />
                <SkinLayerBadge layer={rec.skinLayer} />
              </div>
              <p className="text-[11px] text-muted-foreground">{rec.date} · {rec.clinic}</p>
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-bold text-sm">{pkg.name}</span>
              <BodyAreaBadge area={pkg.bodyArea} />
              <SkinLayerBadge layer={pkg.skinLayer} />
            </div>
            <p className="text-[11px] text-muted-foreground">{pkg.clinic}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-2xl font-bold text-primary">{remaining}</p>
            <p className="text-[10px] text-muted-foreground">잔여</p>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{pkg.usedSessions}회 / {pkg.totalSessions}회</span>
          <span>만료 {pkg.expiryDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default Packages;