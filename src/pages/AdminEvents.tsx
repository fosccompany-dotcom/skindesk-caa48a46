/**
 * /admin/events — 데스크톱 어드민 검수 페이지
 *
 * 모바일 최적화 X. 데스크톱 브라우저 기준.
 * 기능:
 *   - 탭별 (대기/승인/반려/만료) 목록 (테이블 뷰)
 *   - 필터: 브랜드, 검색어
 *   - 우측 슬라이드 패널: 이미지 + 메타 편집 + 시술 리스트
 *   - 액션: 승인 / 반려 / 저장 (admin_note, 제목, 기간 등 수정)
 *
 * 권한: rpc('is_admin') = true
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  FileImage,
  Tag,
  ShieldAlert,
  Loader2,
  Search,
  ArrowLeft,
  LogOut,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'expired';

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  raw_message: string | null;
  start_date: string;
  end_date: string | null;
  notice_type: string;
  confidence_score: number | null;
  review_status: ReviewStatus;
  is_published: boolean | null;
  hours_text: string | null;
  is_closed: boolean;
  admin_note: string | null;
  source_type: string | null;
  source_url: string | null;
  created_at: string | null;
  brand_id: string | null;
  location_id: string;
  brand_name?: string;
  branch_name?: string;
  region_sido?: string;
  region_gugun?: string;
};

type TreatmentRow = {
  id: string;
  event_id: string | null;
  treatment_name: string;
  category: string | null;
  price_krw: number | null;
  original_price_krw: number | null;
  discount_pct: number | null;
  price_unit: string | null;
  session_count: number | null;
  is_unlimited: boolean;
  bundle_size: number;
  combo_items: string[] | null;
  conditions: string | null;
  body_areas: string[] | null;
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
  expired: '만료',
};

const NOTICE_LABEL: Record<string, string> = {
  event: '이벤트',
  schedule: '영업/휴진',
  other: '기타',
};

const SOURCE_LABEL: Record<string, string> = {
  manual: '수동',
  homepage: '홈페이지',
  kakao: '카톡',
  sms: 'SMS',
};

const AdminEvents = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ReviewStatus>('pending');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<ReviewStatus, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  });

  // 필터
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  // 상세 패널
  const [detailEvent, setDetailEvent] = useState<EventRow | null>(null);
  const [detailTreatments, setDetailTreatments] = useState<TreatmentRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [actioning, setActioning] = useState(false);

  // 이미지 풀스크린
  const [fullImage, setFullImage] = useState<string | null>(null);

  // ---------- 어드민 권한 ----------
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const [{ data: aData }, { data: oData }] = await Promise.all([
        supabase.rpc('is_admin' as any),
        supabase.rpc('is_owner' as any),
      ]);
      setIsAdmin(aData === true);
      setIsOwner(oData === true);
    })();
  }, [user, authLoading]);

  // ---------- 카운트 ----------
  const fetchCounts = async () => {
    const statuses: ReviewStatus[] = ['pending', 'approved', 'rejected', 'expired'];
    const next: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0, expired: 0 };
    await Promise.all(
      statuses.map(async (s) => {
        const { count } = await supabase
          .from('clinic_events')
          .select('id', { count: 'exact', head: true })
          .eq('review_status', s);
        next[s] = count || 0;
      }),
    );
    setCounts(next);
  };

  // ---------- 브랜드 옵션 ----------
  const fetchBrands = async () => {
    const { data } = await supabase
      .from('clinic_brands')
      .select('id, name')
      .order('name');
    setBrands(data || []);
  };

  // ---------- 목록 ----------
  const fetchEvents = async (status: ReviewStatus) => {
    setLoading(true);
    try {
      let q = supabase
        .from('clinic_events')
        .select(`
          id, title, description, image_url, raw_message,
          start_date, end_date, notice_type, confidence_score,
          review_status, is_published, hours_text, is_closed,
          admin_note, source_type, source_url, created_at,
          brand_id, location_id,
          clinic_brands ( name ),
          clinic_locations ( branch_name, region_sido, region_gugun )
        `)
        .eq('review_status', status)
        .order('created_at', { ascending: false })
        .limit(200);
      if (brandFilter !== 'all') q = q.eq('brand_id', brandFilter);
      const { data, error } = await q;
      if (error) throw error;
      let rows: EventRow[] = (data || []).map((r: any) => ({
        ...r,
        brand_name: r.clinic_brands?.name,
        branch_name: r.clinic_locations?.branch_name,
        region_sido: r.clinic_locations?.region_sido,
        region_gugun: r.clinic_locations?.region_gugun,
      }));
      // 클라이언트 검색 필터
      if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.title.toLowerCase().includes(lower) ||
            (r.brand_name || '').toLowerCase().includes(lower) ||
            (r.branch_name || '').toLowerCase().includes(lower),
        );
      }
      setEvents(rows);
    } catch (e: any) {
      console.error(e);
      toast({ title: '목록 조회 실패', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin === true) {
      fetchCounts();
      fetchBrands();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchEvents(activeTab);
    }
  }, [isAdmin, activeTab, brandFilter, searchQuery]);

  // ---------- 상세 ----------
  const openDetail = async (ev: EventRow) => {
    setDetailEvent(ev);
    setEditTitle(ev.title);
    setEditStartDate(ev.start_date || '');
    setEditEndDate(ev.end_date || '');
    setEditAdminNote(ev.admin_note || '');
    setDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_treatments')
        .select(
          'id, event_id, treatment_name, category, price_krw, original_price_krw, discount_pct, price_unit, session_count, is_unlimited, bundle_size, combo_items, conditions, body_areas',
        )
        .eq('event_id', ev.id)
        .order('price_krw', { ascending: false, nullsFirst: false });
      if (error) throw error;
      setDetailTreatments((data || []) as TreatmentRow[]);
    } catch (e: any) {
      console.error(e);
      toast({ title: '시술 목록 조회 실패', description: e.message, variant: 'destructive' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailEvent(null);
    setDetailTreatments([]);
  };

  const applyAction = async (action: 'approve' | 'reject' | 'save') => {
    if (!detailEvent) return;
    setActioning(true);
    try {
      const updates: any = {};
      if (editTitle !== detailEvent.title) updates.title = editTitle;
      if (editStartDate && editStartDate !== detailEvent.start_date) updates.start_date = editStartDate;
      if ((editEndDate || null) !== detailEvent.end_date) updates.end_date = editEndDate || null;
      if ((editAdminNote || null) !== detailEvent.admin_note) updates.admin_note = editAdminNote || null;

      if (action === 'approve') updates.review_status = 'approved';
      else if (action === 'reject') updates.review_status = 'rejected';

      const { error } = await supabase
        .from('clinic_events')
        .update(updates)
        .eq('id', detailEvent.id);
      if (error) throw error;

      toast({
        title: action === 'approve' ? '✅ 승인됨' : action === 'reject' ? '❌ 반려됨' : '💾 저장됨',
        description: detailEvent.title,
      });
      closeDetail();
      fetchCounts();
      fetchEvents(activeTab);
    } catch (e: any) {
      console.error(e);
      toast({ title: '처리 실패', description: e.message, variant: 'destructive' });
    } finally {
      setActioning(false);
    }
  };

  // ============================================================================
  // 렌더링
  // ============================================================================

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-8 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">접근 권한 없음</h2>
          <p className="text-sm text-muted-foreground">
            이 페이지는 어드민 계정만 접근 가능합니다.<br />
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">admin_users</code> 테이블에 등록 필요.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> 홈으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 데스크톱 헤더 */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← 앱으로
            </button>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-lg font-bold">BloomLog Admin — 이벤트 검수</h1>
          </div>
          <div className="flex items-center gap-3">
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
                어드민 관리
              </Button>
            )}
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-1" /> 로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-4">
        {/* 탭 + 필터 */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReviewStatus)}>
            <TabsList>
              <TabsTrigger value="pending">
                대기 <Badge variant="secondary" className="ml-1.5">{counts.pending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                승인 <Badge variant="secondary" className="ml-1.5">{counts.approved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                반려 <Badge variant="secondary" className="ml-1.5">{counts.rejected}</Badge>
              </TabsTrigger>
              <TabsTrigger value="expired">
                만료 <Badge variant="secondary" className="ml-1.5">{counts.expired}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="제목/브랜드/지점 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 w-64 text-sm"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="h-9 w-48 text-sm">
                <SelectValue placeholder="모든 브랜드" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 브랜드</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-background rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {STATUS_LABEL[activeTab]} 상태의 이벤트가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">이미지</TableHead>
                  <TableHead className="min-w-[280px]">제목</TableHead>
                  <TableHead className="w-44">브랜드 / 지점</TableHead>
                  <TableHead className="w-24">종류</TableHead>
                  <TableHead className="w-20">출처</TableHead>
                  <TableHead className="w-44">기간</TableHead>
                  <TableHead className="w-20 text-center">신뢰도</TableHead>
                  <TableHead className="w-28 text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <EventTableRow
                    key={ev.id}
                    event={ev}
                    onOpen={() => openDetail(ev)}
                    onImageClick={(url) => setFullImage(url)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* 상세 사이드 패널 */}
      <Sheet open={!!detailEvent} onOpenChange={(o) => !o && closeDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
          {detailEvent && (
            <>
              <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center justify-between gap-3">
                  <SheetTitle className="text-base">
                    검수: {detailEvent.brand_name} — {detailEvent.branch_name}
                  </SheetTitle>
                  <Badge variant={
                    detailEvent.review_status === 'approved' ? 'default' :
                    detailEvent.review_status === 'rejected' ? 'destructive' :
                    'secondary'
                  }>
                    {STATUS_LABEL[detailEvent.review_status]}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="px-6 py-4 space-y-4">
                {/* 이미지 */}
                {detailEvent.image_url ? (
                  <div className="relative group">
                    <img
                      src={detailEvent.image_url}
                      alt={detailEvent.title}
                      className="w-full h-auto max-h-[480px] object-contain rounded-lg border bg-muted"
                    />
                    <button
                      onClick={() => setFullImage(detailEvent.image_url!)}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur p-1.5 rounded hover:bg-background"
                      aria-label="원본 보기"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                    <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    이미지 없음
                  </div>
                )}

                {/* 메타 배지들 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={detailEvent.notice_type === 'event' ? 'default' : 'secondary'}>
                    {NOTICE_LABEL[detailEvent.notice_type] || detailEvent.notice_type}
                  </Badge>
                  {detailEvent.source_type && (
                    <Badge variant="outline">{SOURCE_LABEL[detailEvent.source_type] || detailEvent.source_type}</Badge>
                  )}
                  <ConfBadge score={detailEvent.confidence_score} />
                  {detailEvent.is_closed && <Badge variant="destructive">휴진</Badge>}
                  {detailEvent.is_published && <Badge variant="outline" className="bg-green-50">공개 중</Badge>}
                </div>

                {/* 편집 폼 */}
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div>
                    <Label className="text-xs">제목</Label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-sm mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">시작일</Label>
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">종료일</Label>
                      <Input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">어드민 메모</Label>
                    <Textarea
                      value={editAdminNote}
                      onChange={(e) => setEditAdminNote(e.target.value)}
                      rows={2}
                      className="text-sm mt-1"
                      placeholder="검수 사유, 메모..."
                    />
                  </div>
                </div>

                {/* 원본 메시지 */}
                {detailEvent.raw_message && (
                  <details className="rounded-lg border p-3 bg-muted/20">
                    <summary className="text-xs font-medium cursor-pointer hover:text-foreground text-muted-foreground">
                      원본 메시지 보기 ({detailEvent.raw_message.length}자)
                    </summary>
                    <p className="text-xs whitespace-pre-wrap leading-relaxed mt-2">
                      {detailEvent.raw_message}
                    </p>
                  </details>
                )}

                {/* 시술 리스트 */}
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                    <Tag className="h-3.5 w-3.5" />
                    시술 {detailTreatments.length}개
                  </h4>
                  {detailLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : detailTreatments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">시술 없음 (영업공지 등)</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detailTreatments.map((t) => <TreatmentItem key={t.id} t={t} />)}
                    </div>
                  )}
                </div>

                {/* 부가 정보 */}
                <Separator />
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>위치: {detailEvent.region_sido} {detailEvent.region_gugun}</div>
                  {detailEvent.hours_text && <div>영업시간: {detailEvent.hours_text}</div>}
                  {detailEvent.source_url && (
                    <div className="truncate">출처: <a href={detailEvent.source_url} target="_blank" rel="noreferrer" className="text-primary underline">{detailEvent.source_url}</a></div>
                  )}
                  {detailEvent.created_at && (
                    <div>등록: {new Date(detailEvent.created_at).toLocaleString('ko-KR')}</div>
                  )}
                </div>
              </div>

              <SheetFooter className="px-6 py-4 border-t sticky bottom-0 bg-background gap-2">
                {detailEvent.review_status === 'pending' ? (
                  <>
                    <Button variant="outline" onClick={() => applyAction('save')} disabled={actioning}>
                      저장만
                    </Button>
                    <Button variant="destructive" onClick={() => applyAction('reject')} disabled={actioning}>
                      <XCircle className="h-4 w-4 mr-1" /> 반려
                    </Button>
                    <Button onClick={() => applyAction('approve')} disabled={actioning}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> 승인
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => applyAction('save')} disabled={actioning}>
                      저장
                    </Button>
                    {detailEvent.review_status !== 'approved' && (
                      <Button onClick={() => applyAction('approve')} disabled={actioning}>
                        승인으로 변경
                      </Button>
                    )}
                    {detailEvent.review_status !== 'rejected' && (
                      <Button variant="destructive" onClick={() => applyAction('reject')} disabled={actioning}>
                        반려로 변경
                      </Button>
                    )}
                  </>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 이미지 풀스크린 */}
      <Dialog open={!!fullImage} onOpenChange={(o) => !o && setFullImage(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-2 overflow-auto">
          {fullImage && <img src={fullImage} alt="원본" className="w-full h-auto" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// 서브 컴포넌트
// ============================================================================

function EventTableRow({
  event,
  onOpen,
  onImageClick,
}: {
  event: EventRow;
  onOpen: () => void;
  onImageClick: (url: string) => void;
}) {
  const period = event.end_date
    ? `${event.start_date} ~ ${event.end_date}`
    : event.start_date;

  return (
    <TableRow className="hover:bg-muted/40 cursor-pointer" onClick={onOpen}>
      <TableCell className="p-2">
        {event.image_url ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(event.image_url!);
            }}
            className="block w-16 h-16 rounded overflow-hidden border bg-muted hover:opacity-80"
          >
            <img src={event.image_url} alt="" className="w-full h-full object-cover" />
          </button>
        ) : (
          <div className="w-16 h-16 rounded border bg-muted/30 flex items-center justify-center">
            <FileImage className="h-5 w-5 text-muted-foreground opacity-50" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-0.5">
          <div className="text-sm font-medium line-clamp-2">{event.title}</div>
          {event.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{event.description}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-xs space-y-0.5">
          <div className="font-medium">{event.brand_name || '-'}</div>
          <div className="text-muted-foreground">
            {event.branch_name || '-'}
            {event.region_sido && ` · ${event.region_sido}`}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={event.notice_type === 'event' ? 'default' : 'secondary'} className="text-[10px]">
          {NOTICE_LABEL[event.notice_type] || event.notice_type}
        </Badge>
      </TableCell>
      <TableCell>
        {event.source_type && (
          <Badge variant="outline" className="text-[10px]">
            {SOURCE_LABEL[event.source_type] || event.source_type}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs">{period}</TableCell>
      <TableCell className="text-center">
        <ConfBadge score={event.confidence_score} />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          상세
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ConfBadge({ score }: { score: number | null }) {
  if (score == null) return <Badge variant="outline" className="text-[10px]">-</Badge>;
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700 border-green-200'
      : score >= 60
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-red-100 text-red-700 border-red-200';
  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-medium px-1.5 h-5 rounded border',
        color,
      )}
    >
      {score}
    </span>
  );
}

function TreatmentItem({ t }: { t: TreatmentRow }) {
  const fmt = (n: number | null) => (n == null ? '-' : `₩${n.toLocaleString('ko-KR')}`);
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium flex flex-wrap items-center gap-1">
            <span>{t.treatment_name}</span>
            {t.is_unlimited && <Badge variant="outline" className="text-[9px] h-4 px-1">무제한</Badge>}
            {t.bundle_size > 1 && <Badge variant="outline" className="text-[9px] h-4 px-1">1+{t.bundle_size - 1}</Badge>}
            {t.session_count && t.session_count > 1 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1">{t.session_count}회</Badge>
            )}
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-2 mt-0.5">
            {t.category && <span>[{t.category}]</span>}
            {t.body_areas && t.body_areas.length > 0 && <span>부위: {t.body_areas.join('/')}</span>}
            {t.conditions && <span className="truncate max-w-[280px]">조건: {t.conditions}</span>}
          </div>
          {t.combo_items && t.combo_items.length > 0 && (
            <div className="text-muted-foreground mt-0.5">조합: {t.combo_items.join(' + ')}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          {t.original_price_krw && t.original_price_krw !== t.price_krw && (
            <div className="text-muted-foreground line-through text-[10px]">{fmt(t.original_price_krw)}</div>
          )}
          <div className="font-bold">{fmt(t.price_krw)}</div>
          {t.discount_pct && t.discount_pct > 0 && (
            <div className="text-red-600 text-[10px]">-{t.discount_pct}%</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminEvents;
