import { ArrowUpCircle, ArrowDownCircle, Users, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { mockPoints, currentBalance } from '@/data/mockData';

const typeConfig = {
  charge: { icon: ArrowUpCircle, label: '충전', color: 'text-sage-dark' },
  use: { icon: ArrowDownCircle, label: '사용', color: 'text-rose' },
  referral: { icon: Users, label: '소개', color: 'text-info' },
  bonus: { icon: Gift, label: '보너스', color: 'text-amber' },
};

const Points = () => (
  <div className="min-h-screen bg-background">
    <div className="gradient-sage safe-top">
      <div className="page-header-gradient pt-4">
        <h1 className="text-lg font-bold">포인트 관리</h1>
        <p className="mt-4 text-3xl font-bold tracking-tight">{currentBalance.toLocaleString()}원</p>
        <p className="text-xs opacity-60 font-light">보유 포인트</p>
      </div>
    </div>

    <div className="page-content space-y-2.5 -mt-3">
      
      {mockPoints.map((tx) => {
        const config = typeConfig[tx.type];
        const Icon = config.icon;
        return (
          <Card key={tx.id} className="glass-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <p className="text-[11px] text-muted-foreground">{tx.date} · {config.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-sage-dark' : 'text-rose'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                </p>
                <p className="text-[10px] text-muted-foreground">잔액 {tx.balance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

export default Points;