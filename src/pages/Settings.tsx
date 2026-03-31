import { useState, useRef, useEffect } from "react";
import logoImg from "@/assets/logo.png";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LogOut,
  Download,
  RotateCcw,
  Sun,
  Moon,
  ChevronLeft,
  Globe,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language, LANGUAGE_LABELS } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const userIdRef = useRef<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTargets, setResetTargets] = useState<{ treatments: boolean; payments: boolean; packages: boolean }>({ treatments: false, payments: false, packages: false });
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userIdRef.current = user.id;
    };
    loadUser();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const userId = userIdRef.current;
      if (!userId) return;

      const [treatmentRes, paymentRes, packageRes] = await Promise.all([
        supabase.from('treatment_records').select('*').order('date', { ascending: false }),
        supabase.from('payment_records').select('*').order('date', { ascending: false }),
        supabase.from('treatment_packages').select('*').order('created_at', { ascending: false }),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        treatment_records: treatmentRes.data || [],
        payment_records: paymentRes.data || [],
        treatment_packages: packageRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skindesk_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: '내보내기 완료', description: '파일이 다운로드되었어요' });
    } catch (e) {
      toast({ title: '내보내기 실패', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const userId = userIdRef.current;
      if (!userId) return;

      const deletes: PromiseLike<unknown>[] = [];

      if (resetTargets.treatments) {
        deletes.push(supabase.from('treatment_records').delete().eq('user_id', userId).then());
        deletes.push(supabase.from('treatment_cycles').delete().eq('user_id', userId).then());
      }
      if (resetTargets.payments) {
        deletes.push(supabase.from('payment_records').delete().eq('user_id', userId).then());
        deletes.push(supabase.from('clinic_balances').delete().eq('user_id', userId).then());
        deletes.push(supabase.from('point_transactions').delete().eq('user_id', userId).then());
      }
      if (resetTargets.packages) {
        deletes.push(supabase.from('treatment_packages').delete().eq('user_id', userId).then());
      }

      await Promise.all(deletes);

      toast({ title: '초기화 완료', description: '선택한 기록이 삭제되었어요' });
      setResetOpen(false);
      setResetTargets({ treatments: false, payments: false, packages: false });
      window.dispatchEvent(new CustomEvent('skindesk:data-changed'));
      navigate('/');
    } catch (e) {
      toast({ title: '초기화 실패', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with logo background — matching Index style */}
      <div className="relative safe-top overflow-hidden">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 pt-4 px-5 pb-4 flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="tap-target p-1">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-white/60 cursor-pointer hover:text-white/80 transition-colors" onClick={() => navigate('/profile')}>마이</span>
            <span className="text-white/40">›</span>
            <span className="font-bold text-white">설정</span>
          </div>
        </div>
      </div>

      <div className="content-padding space-y-4 mt-4">
        {/* ── 언어 설정 ── */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              언어 / Language
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["ko", "en", "zh"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl text-xs font-medium transition-all border',
                    language === lang
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card border-border text-muted-foreground'
                  )}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 화면 테마 ── */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <Label className="text-xs">화면 테마</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'light', label: '화이트', icon: Sun },
                { value: 'dark', label: '블랙', icon: Moon },
              ].map(({ value, label, icon: Icon }) => {
                const isActive =
                  value === 'light'
                    ? !document.documentElement.classList.contains('dark')
                    : document.documentElement.classList.contains('dark');
                return (
                  <button
                    key={value}
                    onClick={() => {
                      if (value === 'dark') {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                      localStorage.setItem('skindesk_theme', value);
                    }}
                    className={cn(
                      'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border text-muted-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── 데이터 관리 ── */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs">데이터 관리</Label>

            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? '내보내는 중...' : '기록 내보내기 (백업)'}
            </Button>

            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  기록 초기화하기
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>기록 초기화</AlertDialogTitle>
                  <AlertDialogDescription>
                    삭제할 항목을 선택해주세요. 삭제된 데이터는 복구할 수 없어요.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 py-2">
                  {[
                    { key: 'treatments' as const, label: '시술 기록', desc: '시술 내역 전체' },
                    { key: 'payments' as const, label: '결제 기록', desc: '결제 내역 전체' },
                    { key: 'packages' as const, label: '시술권', desc: '시술권 전체' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={resetTargets[key]}
                        onCheckedChange={(checked) =>
                          setResetTargets(prev => ({ ...prev, [key]: !!checked }))
                        }
                      />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={resetting || (!resetTargets.treatments && !resetTargets.payments && !resetTargets.packages)}
                    onClick={(e) => {
                      e.preventDefault();
                      handleReset();
                    }}
                  >
                    {resetting ? '삭제 중...' : '선택 항목 삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* ── 로그아웃 ── */}
        <Button
          variant="ghost"
          className="w-full rounded-xl text-sm text-muted-foreground gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </Button>

        {/* ── 약관 / 탈퇴 / 버전 ── */}
        <div className="border-t mt-4 pt-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs">
            <Link to="/terms" className="text-muted-foreground underline-offset-2 hover:underline">
              {t("terms_title")}
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/privacy" className="text-muted-foreground underline-offset-2 hover:underline">
              {t("privacy_title")}
            </Link>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="text-xs text-destructive hover:underline underline-offset-2 text-center w-full"
          >
            {t("delete_account")}
          </button>
          <p className="text-xs text-muted-foreground text-center">v1.0.0-beta</p>
        </div>
      </div>

      {/* 회원 탈퇴 다이얼로그 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_account_confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_account_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingAccount}
              onClick={async (e) => {
                e.preventDefault();
                setDeletingAccount(true);
                try {
                  const { data: { session } } = await supabase.auth.refreshSession();
                  if (!session) {
                    navigate("/");
                    return;
                  }
                  const { error: fnError } = await supabase.functions.invoke("delete-account", {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                  });
                  if (fnError) throw new Error(fnError.message || "탈퇴 처리 중 오류가 발생했습니다.");
                  await supabase.auth.signOut().catch(() => {});
                  navigate("/farewell");
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : "탈퇴 처리 중 오류가 발생했습니다.";
                  toast({ title: message, variant: "destructive" });
                  setDeletingAccount(false);
                }
              }}
            >
              {deletingAccount ? "처리 중..." : t("delete_account")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
