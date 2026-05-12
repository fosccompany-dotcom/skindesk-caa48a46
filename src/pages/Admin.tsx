import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Calendar,
  Filter,
} from 'lucide-react';
import { useIsAdmin } from '@/lib/adminAuth';
import { useAdminClinicEvents, useAdminStats, type AdminEventStatus } from '@/hooks/useClinicEvents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function StatCard({
  label,
  value,
  emphasize,
  icon,
}: {
  label: string;
  value: number;
  emphasize?: 'rose' | 'amber' | 'sky' | 'emerald';
  icon: React.ReactNode;
}) {
  const color =
    emphasize === 'rose'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : emphasize === 'amber'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : emphasize === 'sky'
      ? 'text-sky-700 bg-sky-50 border-sky-200'
      : 'text-emerald-700 bg-emerald-50 border-emerald-200';
  return (
    <div className={cn('rounded-2xl border px-3 py-3 flex flex-col gap-1', color)}>
      <div className="flex items-center gap-1 text-[10px] font-semibold opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [statusFilter, setStatusFilter] = useState<AdminEventStatus>('pending');

  const { stats, loading: statsLoading, reload: reloadStats } = useAdminStats();
  const { events, loading: eventsLoading, reload: reloadEvents, setPublished, removeEvent } =
    useAdminClinicEvents(statusFilter);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 권한 체크
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <span className="text-4xl">🚫</span>
        <p className="text-lg font-bold text-foreground">접근 권한이 없습니다</p>
        <p className="text-sm text-muted-foreground">관리자만 접근할 수 있는 페이지입니다</p>
        <Button onClick={() => navigate('/')} className="rounded-xl">홈으로</Button>
      </div>
    );
  }

  const handlePublish = async (id: string) => {
    const ok = await setPublished(id, true);
    if (ok) {
      toast.success('발행 완료');
      reloadStats();
    } else {
      toast.error('발행 실패');
    }
  };

  const handleUnpublish = async (id: string) => {
    const ok = await setPublished(id, false);
    if (ok) {
      toast.success('미발행으로 변경됨');
      reloadStats();
    } else {
      toast.error('처리 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 이벤트를 삭제하시겠습니까?')) return;
    const ok = await removeEvent(id);
    if (ok) {
      toast.success('삭제 완료');
      reloadStats();
    } else {
      toast.error('삭제 실패');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="🛠️ Admin" showBack />

      <div className="px-4 pt-3 space-y-4">
        {/* 운영 현황 카드 */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            📊 운영 현황
          </h2>
          {statsLoading || !stats ? (
            <div className="text-center py-6 text-muted-foreground text-xs">불러오는 중...</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <StatCard
                label="활성"
                value={stats.active}
                emphasize="emerald"
                icon={<CheckCircle className="w-3 h-3" />}
              />
              <StatCard
                label="검토 대기"
                value={stats.pending}
                emphasize="amber"
                icon={<Clock className="w-3 h-3" />}
              />
              <StatCard
                label="만료 임박"
                value={stats.expiringSoon}
                emphasize="rose"
                icon={<AlertTriangle className="w-3 h-3" />}
              />
              <StatCard
                label="만료됨"
                value={stats.expired}
                emphasize="sky"
                icon={<XCircle className="w-3 h-3" />}
              />
            </div>
          )}
        </div>

        {/* 클리닉별 현황 */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            🏥 클리닉별 현황
          </h2>
          {statsLoading || !stats ? (
            <div className="text-center py-6 text-muted-foreground text-xs">불러오는 중...</div>
          ) : (
            <Card className="border-border rounded-2xl">
              <CardContent className="p-2 max-h-[260px] overflow-y-auto">
                {stats.byBrand.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    아직 등록된 이벤트가 없습니다
                  </p>
                ) : (
                  <div className="space-y-1">
                    {stats.byBrand.map((b) => {
                      const last = b.lastUpdate
                        ? new Date(b.lastUpdate).toLocaleDateString('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                          })
                        : '없음';
                      return (
                        <div
                          key={b.brand_id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40"
                        >
                          <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-semibold text-foreground flex-1 truncate">
                            {b.brand_name}
                          </span>
                          {b.active > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              활성 {b.active}
                            </span>
                          )}
                          {b.pending > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              대기 {b.pending}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground shrink-0">{last}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 이벤트 목록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              📋 이벤트 목록
            </h2>
            <div className="flex gap-1">
              {(
                [
                  { key: 'pending' as const, label: '검토 대기' },
                  { key: 'active' as const, label: '활성' },
                  { key: 'expired' as const, label: '만료' },
                  { key: 'all' as const, label: '전체' },
                ]
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-full border transition-colors',
                    statusFilter === t.key
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {eventsLoading ? (
            <div className="text-center py-8 text-muted-foreground text-xs">불러오는 중...</div>
          ) : events.length === 0 ? (
            <Card className="border-border rounded-2xl">
              <CardContent className="p-6 text-center text-xs text-muted-foreground">
                해당 상태의 이벤트가 없습니다
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => {
                const expired = ev.end_date && ev.end_date < todayStr;
                return (
                  <Card key={ev.id} className="border-border rounded-2xl">
                    <CardContent className="p-3 space-y-2">
                      {/* Header */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full border font-semibold',
                                ev.is_published
                                  ? expired
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200',
                              )}
                            >
                              {ev.is_published ? (expired ? '만료' : '활성') : '검토 대기'}
                            </span>
                            {ev.brand && (
                              <span className="text-[10px] text-muted-foreground">
                                {ev.brand.name}
                              </span>
                            )}
                            {ev.location && (
                              <span className="text-[10px] text-muted-foreground">
                                · {ev.location.branch_name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-foreground line-clamp-2">
                            {ev.title}
                          </p>
                          {(ev.start_date || ev.end_date) && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                              <Calendar className="w-3 h-3" />
                              {ev.start_date}
                              {ev.end_date ? ` ~ ${ev.end_date}` : ' ~ 만료일 없음'}
                            </div>
                          )}
                          {ev.discount_pct && (
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              -{ev.discount_pct}%
                            </span>
                          )}
                        </div>
                        {ev.source_url && (
                          <a
                            href={ev.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5 pt-1 border-t border-border">
                        {!ev.is_published ? (
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handlePublish(ev.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            발행
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs rounded-lg"
                            onClick={() => handleUnpublish(ev.id)}
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            미발행
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDelete(ev.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
