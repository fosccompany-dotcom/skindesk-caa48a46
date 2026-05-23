/**
 * /admin/users — 어드민 계정 관리 페이지
 *
 * 권한: rpc('is_owner') = true (오너만 접근)
 *
 * 기능:
 *   - 어드민 목록 (이메일·role·등록일·메모)
 *   - 어드민 추가: 이메일 입력 → user_id 자동 조회 → INSERT
 *   - role 변경 (owner/admin/reviewer)
 *   - 어드민 제거 (오너 본인은 락아웃 방지 트리거로 차단됨)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldAlert, Loader2, UserPlus, Trash2, ArrowLeft, Crown, Shield, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AdminRole = 'owner' | 'admin' | 'reviewer';

type AdminRow = {
  user_id: string;
  role: AdminRole;
  granted_at: string | null;
  granted_by: string | null;
  notes: string | null;
  email?: string;
};

const ROLE_LABEL: Record<AdminRole, { label: string; icon: any; color: string }> = {
  owner: { label: '오너', icon: Crown, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  admin: { label: '관리자', icon: Shield, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  reviewer: { label: '검수자', icon: Eye, color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const ROLE_DESC: Record<AdminRole, string> = {
  owner: '모든 권한 + 어드민 계정 관리. 자신을 강등/제거 불가 (락아웃 방지)',
  admin: '이벤트 검수·수정·승인·반려, 시술 관리. 어드민 계정 관리 불가',
  reviewer: '데이터 열람만 가능. 수정/승인/반려 불가',
};

const AdminUsers = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);

  // 추가 다이얼로그
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('admin');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---------- 권한 체크 ----------
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsOwner(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc('is_owner' as any);
      if (error) {
        console.error('is_owner RPC error:', error);
        setIsOwner(false);
        return;
      }
      setIsOwner(data === true);
    })();
  }, [user, authLoading]);

  // ---------- 어드민 목록 로드 ----------
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('admin_users')
        .select('user_id, role, granted_at, granted_by, notes')
        .order('granted_at', { ascending: true });
      if (error) throw error;

      // 이메일 조회는 별도 RPC 또는 user_id 매핑 필요. 일단 user_id만 표시.
      // 향후: 각 admin마다 email 조회 RPC 호출 (현재는 user_id 그대로)
      setAdmins((rows || []) as AdminRow[]);
    } catch (e: any) {
      console.error(e);
      toast({ title: '목록 조회 실패', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner === true) fetchAdmins();
  }, [isOwner]);

  // ---------- 어드민 추가 ----------
  const handleAddAdmin = async () => {
    if (!newEmail.trim()) {
      toast({ title: '이메일을 입력하세요', variant: 'destructive' });
      return;
    }
    setAdding(true);
    try {
      // 1. 이메일로 user_id 조회 (lookup_user_id_by_email RPC)
      const { data: lookup, error: lErr } = await supabase.rpc('lookup_user_id_by_email' as any, {
        p_email: newEmail.trim(),
      });
      if (lErr) throw lErr;
      const rows = (lookup as any) || [];
      const target = Array.isArray(rows) ? rows[0] : rows;
      if (!target || !target.user_id) {
        toast({
          title: '가입된 사용자를 찾을 수 없습니다',
          description: `${newEmail} — 먼저 회원가입이 필요합니다.`,
          variant: 'destructive',
        });
        return;
      }

      // 2. INSERT
      const { error: iErr } = await supabase.from('admin_users').insert({
        user_id: target.user_id,
        role: newRole,
        granted_by: user!.id,
        notes: newNotes.trim() || null,
      } as any);
      if (iErr) throw iErr;

      toast({ title: '✅ 어드민 추가됨', description: `${newEmail} → ${ROLE_LABEL[newRole].label}` });
      setAddOpen(false);
      setNewEmail('');
      setNewRole('admin');
      setNewNotes('');
      fetchAdmins();
    } catch (e: any) {
      console.error(e);
      toast({ title: '추가 실패', description: e.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  // ---------- role 변경 ----------
  const handleRoleChange = async (admin: AdminRow, newRoleValue: AdminRole) => {
    if (admin.role === newRoleValue) return;
    if (admin.user_id === user!.id && admin.role === 'owner') {
      toast({
        title: '자기 강등 불가',
        description: 'owner 본인은 다른 role로 변경할 수 없습니다 (락아웃 방지).',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ role: newRoleValue } as any)
        .eq('user_id', admin.user_id);
      if (error) throw error;
      toast({ title: 'role 변경됨', description: `${ROLE_LABEL[newRoleValue].label}로 변경` });
      fetchAdmins();
    } catch (e: any) {
      toast({ title: 'role 변경 실패', description: e.message, variant: 'destructive' });
    }
  };

  // ---------- 어드민 제거 ----------
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', deleteTarget.user_id);
      if (error) throw error;
      toast({ title: '✅ 어드민 제거됨' });
      setDeleteTarget(null);
      fetchAdmins();
    } catch (e: any) {
      toast({ title: '제거 실패', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // =====================
  // 렌더링
  // =====================
  if (authLoading || isOwner === null) {
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

  if (isOwner === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-8 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">접근 권한 없음</h2>
          <p className="text-sm text-muted-foreground">
            이 페이지는 <b>오너(owner)</b>만 접근 가능합니다.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/admin/events')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> 검수 페이지로
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              홈으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/events')}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> 이벤트 검수로
            </button>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-lg font-bold">BloomLog Admin — 어드민 계정 관리</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-4">
        {/* role 설명 */}
        <div className="grid grid-cols-3 gap-3">
          {(['owner', 'admin', 'reviewer'] as AdminRole[]).map((r) => {
            const meta = ROLE_LABEL[r];
            const Icon = meta.icon;
            return (
              <div key={r} className="rounded-lg border bg-background p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{meta.label}</span>
                  <code className="text-[10px] text-muted-foreground">{r}</code>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ROLE_DESC[r]}</p>
              </div>
            );
          })}
        </div>

        {/* 추가 버튼 */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">어드민 목록 ({admins.length}명)</h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-1" /> 어드민 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>어드민 추가</DialogTitle>
                <DialogDescription>
                  가입된 사용자만 추가 가능. 미가입 사용자는 회원가입 후 추가하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">이메일</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label className="text-xs">권한</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">관리자 — 검수/수정 가능</SelectItem>
                      <SelectItem value="reviewer">검수자 — 열람만 가능</SelectItem>
                      <SelectItem value="owner">오너 — 모든 권한 (주의)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">메모 (선택)</Label>
                  <Textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="역할/담당 등"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
                  취소
                </Button>
                <Button onClick={handleAddAdmin} disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : '추가'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 어드민 테이블 */}
        <div className="bg-background rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              어드민이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-72">User ID</TableHead>
                  <TableHead className="w-32">권한</TableHead>
                  <TableHead className="w-44">등록일</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="w-32 text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => {
                  const isSelf = a.user_id === user.id;
                  const meta = ROLE_LABEL[a.role];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={a.user_id}>
                      <TableCell className="font-mono text-xs">
                        {a.user_id}
                        {isSelf && (
                          <Badge variant="outline" className="ml-2 text-[10px]">본인</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={a.role}
                          onValueChange={(v) => handleRoleChange(a, v as AdminRole)}
                          disabled={isSelf && a.role === 'owner'}
                        >
                          <SelectTrigger className="h-8 w-28">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Icon className="h-3 w-3" /> {meta.label}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">오너</SelectItem>
                            <SelectItem value="admin">관리자</SelectItem>
                            <SelectItem value="reviewer">검수자</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.granted_at ? new Date(a.granted_at).toLocaleDateString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(a)}
                          disabled={isSelf}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          ⚠️ 본인(오너)은 자기 자신을 강등하거나 제거할 수 없습니다. 락아웃 방지용.
        </p>
      </main>

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>어드민 제거</AlertDialogTitle>
            <AlertDialogDescription>
              <code>{deleteTarget?.user_id}</code>
              <br />
              이 어드민을 제거하시겠습니까? 해당 사용자는 더 이상 어드민 페이지에 접근할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '제거'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
