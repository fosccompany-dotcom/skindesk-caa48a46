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
  <div className="min-h-screen bg-background pb-24">
    <div className="gradient-sage px-5 pb-8 pt-12 text-primary-foreground">
      <h1 className="text-xl font-bold">포인트 관리</h1>
      <p className="mt-4 text-3xl font-bold">{currentBalance.toLocaleString()}원</p>
      <p className="text-sm opacity-80">보유 포인트</p>
    </div>

    <div className="mx-auto max-w-lg space-y-3 px-4 -mt-4">
      <h2 className="px-1 font-semibold">거래 내역</h2>
      {mockPoints.map((tx) => {
        const config = typeConfig[tx.type];
        const Icon = config.icon;
        return (
          <Card key={tx.id} className="glass-card">
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 ${config.color}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.date} · {config.label}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm ${tx.amount > 0 ? 'text-sage-dark' : 'text-rose'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                </p>
                <p className="text-xs text-muted-foreground">잔액 {tx.balance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

export default Points;
