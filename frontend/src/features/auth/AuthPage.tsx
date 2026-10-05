import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Mascot } from '@/components/brand/Mascot';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { Surface, TINTS, type Tint } from '@/components/lio';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/integrations/api/httpClient';
import { authClient } from '@/integrations/api/authClient';
import { GoogleSignInButton } from './GoogleSignInButton';

/**
 * Module 17 — Đăng nhập / Đăng ký (LIO kit). Toàn bộ logic giữ nguyên từ trang cũ (/auth/classic):
 * signIn, signUp + captcha, ghi nhớ email, quên mật khẩu (resetPassword), đặt lại mật khẩu (?reset=true).
 */
const emailSchema = z.string().trim().email('Email chưa đúng định dạng');
const MIN_PW = 8; // khớp với máy chủ

const FEATURES: { icon: LifeIconName; tint: Tint; label: string }[] = [
  { icon: 'module/tasks', tint: 'violet', label: 'Tổ chức cuộc sống' },
  { icon: 'module/learning', tint: 'orange', label: 'Phát triển bản thân' },
  { icon: 'module/goals', tint: 'mint', label: 'Theo dõi mục tiêu' },
  { icon: 'module/ai-coach', tint: 'sky', label: 'AI đồng hành' },
];
const HIGHLIGHTS: { icon: LifeIconName; tint: Tint; title: string; desc: string }[] = [
  { icon: 'module/life-areas', tint: 'violet', title: '10 lĩnh vực', desc: 'Cân bằng toàn diện' },
  { icon: 'module/ai-coach', tint: 'sky', title: 'AI Coach', desc: 'Đồng hành cùng bạn' },
  { icon: 'module/insights', tint: 'mint', title: 'Insights', desc: 'Hiểu rõ tiến trình' },
];


const inputCls = 'h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-[16px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:opacity-60';

function TextInput({ id, label, icon: Icon, error, reveal, onReveal, hint, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: typeof Mail; error?: string; reveal?: boolean; onReveal?: () => void; hint?: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-[13px] font-semibold mb-1.5">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
        <input id={id} aria-invalid={!!error} className={cn(inputCls, error && 'border-destructive/60 focus:ring-destructive/10')} {...rest} />
        {onReveal && (
          <button type="button" onClick={onReveal} aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:text-foreground">
            {reveal ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </span>
      {error ? <span className="block text-[12.5px] text-destructive mt-1.5">{error}</span> : hint}
    </label>
  );
}
const emailAttrs = { type: 'email', inputMode: 'email' as const, autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false };

/** Độ mạnh mật khẩu 0–4: độ dài, chữ hoa/thường, số, ký tự đặc biệt. */
function pwScore(pw: string) {
  if (!pw) return 0;
  let s = pw.length >= MIN_PW ? 1 : 0;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return pw.length < MIN_PW ? 0 : Math.max(1, Math.min(4, s));
}
const PW_LABEL = ['Quá ngắn', 'Yếu', 'Khá', 'Tốt', 'Mạnh'];
const PW_COLOR = ['bg-destructive', 'bg-[#F5A524]', 'bg-[#F5A524]', 'bg-mint', 'bg-[#1E9E6A]'];
function StrengthHint({ pw }: { pw: string }) {
  if (!pw) return <span className="block text-[12px] text-muted-foreground mt-1.5">Ít nhất {MIN_PW} ký tự — nên có chữ hoa, số hoặc ký tự đặc biệt</span>;
  const sc = pwScore(pw);
  return (
    <span className="flex items-center gap-2 mt-2">
      <span className="flex-1 grid grid-cols-4 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={cn('h-1.5 rounded-full', i <= sc ? PW_COLOR[sc] : 'bg-secondary')} />)}</span>
      <span className="text-[12px] font-semibold text-muted-foreground w-16 text-right">{pw.length < MIN_PW ? `${pw.length}/${MIN_PW}` : PW_LABEL[sc]}</span>
    </span>
  );
}

function CardHead({ icon, title, subtitle, onBack }: { icon: LifeIconName; title: string; subtitle: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {onBack && <button type="button" onClick={onBack} aria-label="Quay lại" className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0"><ArrowLeft className="h-4 w-4" /></button>}
      <span className="h-11 w-11 rounded-[14px] grid place-items-center bg-lavender dark:bg-primary/15 shrink-0"><LifeIcon name={icon} size={24} variant="duotone" /></span>
      <span className="min-w-0"><span className="block text-[18px] font-extrabold leading-tight">{title}</span><span className="block text-[12.5px] text-muted-foreground">{subtitle}</span></span>
    </div>
  );
}

const TabHead = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-5"><p className="text-[22px] font-extrabold leading-tight tracking-tight">{title}</p><p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p></div>
);

const Logo = () => (
  <span className="inline-flex items-center gap-2">
    <span className="h-9 w-9 rounded-[12px] bg-primary/10 grid place-items-center text-[18px]">🌱</span>
    <span className="leading-tight text-left"><span className="block text-[18px] font-extrabold tracking-tight">LifeOS</span><span className="block text-[11px] text-muted-foreground">Sống ý nghĩa hơn mỗi ngày</span></span>
  </span>
);

const FormError = ({ msg }: { msg?: string }) => msg ? <p role="alert" className="rounded-2xl bg-destructive/10 text-destructive px-3.5 py-2.5 text-[13px] font-medium">{msg}</p> : null;

export default function AuthPage() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('reset');
  const [mode, setModeState] = useState<'welcome' | 'login' | 'register'>(() => {
    const m = new URLSearchParams(window.location.search).get('mode');
    return m === 'signup' ? 'register' : m === 'login' ? 'login' : 'welcome';
  });
  // Đồng bộ chế độ với URL (?mode=login|signup) để có thể chia sẻ link thẳng tới form đăng ký.
  const setMode = (m: 'welcome' | 'login' | 'register') => {
    setModeState(m); setErrors({}); setFormError(undefined);
    const next = new URLSearchParams(searchParams);
    if (m === 'welcome') next.delete('mode'); else next.set('mode', m === 'register' ? 'signup' : 'login');
    setSearchParams(next, { replace: true });
  };
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState(''); // honeypot chống bot
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [formError, setFormError] = useState<string>();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState<null | 'sent' | 'no-mail'>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(() => localStorage.getItem('lifeos.ephemeral') !== '1');
  const [showPassword, setShowPassword] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) setEmail(remembered);
  }, []);

  useEffect(() => {
    if (!loading && user && !resetToken) navigate('/');
  }, [user, loading, navigate, resetToken]);

  const checkEmail = () => {
    const r = emailSchema.safeParse(email);
    return r.success ? undefined : r.error.errors[0].message;
  };

  const persistKeep = () => {
    if (keepSignedIn) localStorage.removeItem('lifeos.ephemeral');
    else { localStorage.setItem('lifeos.ephemeral', '1'); sessionStorage.setItem('lifeos.alive', '1'); }
  };

  const handleGoogle = async (credential: string) => {
    setFormError(undefined);
    persistKeep();
    setIsLoading(true);
    const r = await authClient.signInWithIdToken({ provider: 'google', token: credential });
    setIsLoading(false);
    if (r.error) {
      const m = r.error.message.toLowerCase();
      setFormError(m.includes('not enabled') ? 'Đăng nhập Google chưa được bật trên máy chủ.' : m.includes('not verified') ? 'Email Google này chưa được xác minh.' : m.includes('invalid google') ? 'Google không xác nhận được tài khoản. Thử lại nhé.' : humanize(r.error.message));
      return;
    }
    if (r.data.user?.email) localStorage.setItem('rememberedEmail', r.data.user.email);
    if (r.isNew) toast.success('Chào mừng bạn đến với LifeOS! 🎉', { description: 'Tài khoản đã được tạo bằng Google.' });
    navigate('/');
  };
  const onGoogleError = (msg: string) => setFormError(msg);

  const persistChoice = () => {
    localStorage.setItem('rememberedEmail', email.trim());
    if (keepSignedIn) localStorage.removeItem('lifeos.ephemeral');
    else { localStorage.setItem('lifeos.ephemeral', '1'); sessionStorage.setItem('lifeos.alive', '1'); }
  };

  const humanize = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('too many') || m.includes('rate limit') || m.includes('429')) return 'Bạn thử quá nhiều lần. Đợi vài phút rồi thử lại nhé.';
    if (m.includes('already registered')) return 'Email này đã có tài khoản — hãy đăng nhập hoặc dùng “Quên mật khẩu”.';
    if (m.includes('invalid') && (m.includes('password') || m.includes('credential') || m.includes('email or'))) return 'Email hoặc mật khẩu không đúng.';
    if (m.includes('network') || m.includes('fetch')) return 'Không kết nối được máy chủ. Kiểm tra internet rồi thử lại.';
    return msg;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const er = { email: checkEmail(), password: password ? undefined : 'Nhập mật khẩu' };
    setErrors(er); setFormError(undefined);
    if (er.email || er.password) return;
    persistChoice();
    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);
    if (error) setFormError(humanize(error.message));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const er = { name: name.trim() ? undefined : 'Cho LIO biết tên bạn nhé', email: checkEmail(), password: password.length < MIN_PW ? `Mật khẩu cần ít nhất ${MIN_PW} ký tự` : undefined };
    setErrors(er); setFormError(undefined);
    if (er.name || er.email || er.password) return;
    if (website) { toast.success('Đã tạo tài khoản'); return; } // bot điền ô ẩn → bỏ qua lặng lẽ
    persistChoice();
    setIsLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setIsLoading(false);
    if (error) { setFormError(humanize(error.message)); return; }
    toast.success(`Chào mừng ${name.trim()}! 🎉`, { description: 'Cùng thiết lập LifeOS cho riêng bạn nhé.' });
    navigate('/');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = checkEmail();
    setErrors({ email: em }); setFormError(undefined);
    if (em) return;
    setIsLoading(true);
    try {
      const r = await apiFetch<{ ok: boolean; delivery?: boolean }>('/auth/reset-password/request', { method: 'POST', auth: false, body: { email: email.trim(), redirectTo: window.location.origin } });
      setForgotSent(r.delivery === false ? 'no-mail' : 'sent');
    } catch (err) {
      setFormError(humanize((err as Error).message));
    } finally { setIsLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < MIN_PW) { setErrors({ password: `Mật khẩu cần ít nhất ${MIN_PW} ký tự` }); return; }
    setIsLoading(true); setFormError(undefined);
    try {
      await apiFetch('/auth/reset-password/confirm', { method: 'POST', auth: false, body: { token: resetToken, newPassword } });
      setResetDone(true);
    } catch (err) {
      const m = (err as Error).message;
      setFormError(/expired|invalid/i.test(m) ? 'Link đã hết hạn hoặc đã được dùng. Hãy yêu cầu link mới.' : humanize(m));
    } finally { setIsLoading(false); }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const submitBtn = (label: string) => (
    <Button type="submit" className="w-full h-12 rounded-full shadow-soft text-[15px] font-semibold" disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{label}
    </Button>
  );
  const goLogin = () => { const n = new URLSearchParams(); n.set('mode', 'login'); setSearchParams(n, { replace: true }); setModeState('login'); setShowForgotPassword(false); setForgotSent(null); setResetDone(false); setFormError(undefined); };

  const forgotCard = forgotSent ? (
    <div className="text-center py-2">
      <div className="mx-auto h-14 w-14 rounded-full bg-lavender dark:bg-primary/15 grid place-items-center text-[26px]">{forgotSent === 'sent' ? '📬' : '🛠️'}</div>
      <p className="mt-3 text-[18px] font-extrabold">{forgotSent === 'sent' ? 'Kiểm tra hộp thư nhé' : 'Chưa gửi được email'}</p>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">{forgotSent === 'sent' ? <>Nếu <b className="text-foreground">{email.trim()}</b> có tài khoản, link đặt lại (hiệu lực 60 phút) đã được gửi. Xem cả mục Spam.</> : 'Máy chủ chưa bật gửi email. Hãy liên hệ quản trị viên để được đặt lại mật khẩu.'}</p>
      <Button variant="outline" className="w-full h-12 rounded-full mt-5" onClick={goLogin}>Quay lại đăng nhập</Button>
    </div>
  ) : (
    <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
      <CardHead icon="module/settings" title="Quên mật khẩu" subtitle="Nhập email, LIO gửi link đặt lại cho bạn" onBack={() => { setShowForgotPassword(false); setFormError(undefined); }} />
      <TextInput id="forgot-email" label="Email" icon={Mail} {...emailAttrs} enterKeyHint="send" placeholder="ban@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={isLoading} autoComplete="email" autoFocus />
      <FormError msg={formError} />
      {submitBtn('Gửi link đặt lại')}
    </form>
  );

  const loginForm = (
    <form onSubmit={handleSignIn} className="space-y-4" noValidate>
      {!isMobile && <TabHead title="Chào mừng bạn trở lại!" subtitle="Đăng nhập để tiếp tục hành trình của bạn." />}
      <GoogleSignInButton text="signin_with" onCredential={handleGoogle} onError={onGoogleError} />
      <TextInput id="signin-email" label="Email" icon={Mail} {...emailAttrs} enterKeyHint="next" placeholder="ban@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={isLoading} autoComplete="username"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('signin-password')?.focus(); } }} />
      <TextInput id="signin-password" label="Mật khẩu" icon={Lock} type={showPassword ? 'text' : 'password'} enterKeyHint="go" placeholder="Mật khẩu của bạn" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={isLoading} autoComplete="current-password" reveal={showPassword} onReveal={() => setShowPassword(!showPassword)} />
      <div className="flex items-center justify-between text-[13px]">
        <label className="inline-flex items-center gap-2 cursor-pointer py-1"><Checkbox id="keep" checked={keepSignedIn} onCheckedChange={(c) => setKeepSignedIn(c === true)} />Duy trì đăng nhập</label>
        <button type="button" onClick={() => { setShowForgotPassword(true); setFormError(undefined); setErrors({}); }} className="font-semibold text-primary py-1">Quên mật khẩu?</button>
      </div>
      <FormError msg={formError} />
      {submitBtn('Đăng nhập')}
      <p className="text-center text-[13px] text-muted-foreground">Chưa có tài khoản? <button type="button" onClick={() => { setMode('register'); setTimeout(() => document.getElementById('signup-name')?.focus(), 50); }} className="font-semibold text-primary">Tạo tài khoản</button></p>
    </form>
  );
  const loginCard = showForgotPassword ? forgotCard : loginForm;

  const registerCard = (
    <form onSubmit={handleSignUp} className="space-y-4" noValidate>
      {!isMobile && <TabHead title="Tạo tài khoản mới" subtitle="Miễn phí — chỉ mất 30 giây." />}
      <GoogleSignInButton text="signup_with" onCredential={handleGoogle} onError={onGoogleError} />
      <TextInput id="signup-name" label="Tên của bạn" icon={User} enterKeyHint="next" placeholder="LIO sẽ gọi bạn bằng tên này" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} disabled={isLoading} autoComplete="given-name" autoCapitalize="words"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('signup-email')?.focus(); } }} />
      <TextInput id="signup-email" label="Email" icon={Mail} {...emailAttrs} enterKeyHint="next" placeholder="ban@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={isLoading} autoComplete="email"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('signup-password')?.focus(); } }} />
      <TextInput id="signup-password" label="Mật khẩu" icon={Lock} type={showPassword ? 'text' : 'password'} enterKeyHint="done" placeholder={`Ít nhất ${MIN_PW} ký tự`} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={isLoading} autoComplete="new-password" reveal={showPassword} onReveal={() => setShowPassword(!showPassword)} hint={<StrengthHint pw={password} />} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-px w-px opacity-0" />
      <FormError msg={formError} />
      {submitBtn('Tạo tài khoản')}
      <p className="text-center text-[11.5px] text-muted-foreground">Bằng việc tạo tài khoản, bạn đồng ý để LifeOS lưu dữ liệu nhằm cá nhân hoá trải nghiệm. Bạn có thể xuất hoặc xoá dữ liệu bất cứ lúc nào.</p>
    </form>
  );

  const resetCard = resetDone ? (
    <div className="text-center py-2">
      <div className="mx-auto h-14 w-14 rounded-full bg-mint/40 grid place-items-center text-[26px]">✅</div>
      <p className="mt-3 text-[18px] font-extrabold">Đã đổi mật khẩu</p>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">Đăng nhập lại bằng mật khẩu mới nhé. Các thiết bị khác đã được đăng xuất để an toàn.</p>
      <Button className="w-full h-12 rounded-full mt-5" onClick={goLogin}>Đăng nhập</Button>
    </div>
  ) : resetToken === 'true' ? (
    <div className="text-center py-2">
      <p className="text-[18px] font-extrabold">Link không còn hợp lệ</p>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">Hãy yêu cầu link đặt lại mới.</p>
      <Button className="w-full h-12 rounded-full mt-5" onClick={() => { goLogin(); setShowForgotPassword(true); }}>Gửi lại link</Button>
    </div>
  ) : (
    <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
      <CardHead icon="module/settings" title="Đặt mật khẩu mới" subtitle="Chọn mật khẩu bạn dễ nhớ nhưng khó đoán" />
      <TextInput id="new-password" label="Mật khẩu mới" icon={Lock} type={showPassword ? 'text' : 'password'} enterKeyHint="done" placeholder={`Ít nhất ${MIN_PW} ký tự`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.password} disabled={isLoading} autoComplete="new-password" reveal={showPassword} onReveal={() => setShowPassword(!showPassword)} hint={<StrengthHint pw={newPassword} />} autoFocus />
      <FormError msg={formError} />
      {submitBtn('Lưu mật khẩu mới')}
    </form>
  );

  const topBar = (
    <header className="flex items-center justify-between gap-3 px-4 lg:px-8 h-16">
      <Logo />
      <div className="flex items-center gap-2"><ThemeToggle />{!isMobile && !resetToken && <Button variant="outline" className="h-10 rounded-full px-5" onClick={() => { setShowForgotPassword(false); setMode(mode === 'register' ? 'login' : 'register'); }}>{mode === 'register' ? 'Đăng nhập' : 'Tạo tài khoản'}</Button>}</div>
    </header>
  );

  if (resetToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-mint/5">
        {topBar}
        <main className="px-4 py-10 grid place-items-center"><Surface className="w-full max-w-[440px] p-6">{resetCard}</Surface></main>
      </div>
    );
  }

  if (isMobile) {
    if (mode === 'welcome') {
      return (
        <div className="min-h-[100dvh] bg-gradient-to-b from-lavender/60 via-background to-background dark:from-primary/10">
          <main className="min-h-[100dvh] flex flex-col items-center justify-between px-6 pt-14 pb-[max(env(safe-area-inset-bottom),32px)] text-center">
            <Logo />
            <div className="flex flex-col items-center">
              <Mascot name="taro" pose="go" size={190} float />
              <p className="mt-4 text-[22px] font-extrabold leading-snug">Chào mừng đến với LifeOS! 💜</p>
              <p className="mt-1.5 text-[14px] text-muted-foreground">Việc, thói quen, mục tiêu & AI đồng hành — gọn trong một app.</p>
            </div>
            <div className="w-full space-y-2.5">
              <Button className="w-full h-12 rounded-full shadow-soft text-[15px] font-semibold" onClick={() => setMode('register')}>Bắt đầu miễn phí</Button>
              <Button variant="outline" className="w-full h-12 rounded-full text-[15px]" onClick={() => setMode('login')}>Tôi đã có tài khoản</Button>
            </div>
          </main>
        </div>
      );
    }
    const isReg = mode === 'register';
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-lavender via-lavender/60 to-background dark:from-primary/15 dark:via-primary/5">
        <header className="relative px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
          <div className="flex items-center justify-between h-12">
            <button type="button" onClick={() => setMode('welcome')} aria-label="Quay lại" className="h-10 w-10 rounded-full bg-card/80 grid place-items-center"><ArrowLeft className="h-4 w-4" /></button>
            <ThemeToggle />
          </div>
          <div className="flex items-end justify-between gap-3 mt-1">
            <div className="min-w-0 pb-2">
              <p className="text-[24px] font-extrabold leading-tight tracking-tight">{showForgotPassword ? 'Lấy lại tài khoản' : isReg ? 'Tạo tài khoản' : 'Chào mừng trở lại!'}</p>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{showForgotPassword ? 'Đừng lo, chuyện thường thôi 🙂' : isReg ? 'Chỉ 3 thông tin, mất 30 giây' : 'Đăng nhập để tiếp tục hành trình'}</p>
            </div>
            <Mascot name="taro" pose={isReg ? 'go' : 'care'} size={92} />
          </div>
        </header>
        <main className="flex-1 rounded-t-[32px] bg-card border-t border-border/50 shadow-[0_-8px_30px_rgba(80,60,180,0.08)] px-5 pt-5 pb-[max(env(safe-area-inset-bottom),28px)]">
          {!showForgotPassword && (
            <div role="tablist" aria-label="Chọn hình thức" className="grid grid-cols-2 p-1 mb-5 rounded-full bg-secondary">
              {([['login', 'Đăng nhập'], ['register', 'Đăng ký']] as const).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
                  className={cn('h-10 rounded-full text-[14px] font-semibold transition', mode === k ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground')}>{label}</button>
              ))}
            </div>
          )}
          {isReg && !showForgotPassword ? registerCard : loginCard}
        </main>
      </div>
    );
  }

  const tab: 'login' | 'register' = mode === 'register' ? 'register' : 'login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-mint/5">
      <div className="max-w-[1180px] mx-auto">
        {topBar}
        <main className="px-8 pb-10">
          <div className="grid grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_460px] gap-6 items-stretch min-h-[calc(100vh-7rem)]">
            {/* Bên trái: giới thiệu thương hiệu */}
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-lavender via-[#EEF3FF] to-[#E8FBF4] dark:from-primary/15 dark:via-card dark:to-card border border-border/60 shadow-soft p-10 flex flex-col">
              <div>
                <h1 className="text-[34px] font-extrabold leading-tight tracking-tight">Chào mừng đến với<br />LifeOS! 💙</h1>
                <p className="mt-2 text-[15px] text-muted-foreground max-w-[420px]">Bắt đầu hành trình xây dựng cuộc sống ý nghĩa hơn ngay hôm nay!</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {FEATURES.map((f) => (
                    <span key={f.label} className="inline-flex items-center gap-2 h-9 pl-1.5 pr-3.5 rounded-full bg-card/70 dark:bg-card/60 border border-border/60 text-[12.5px] font-semibold">
                      <span className={cn('h-6 w-6 rounded-full grid place-items-center', TINTS[f.tint].bg)}><LifeIcon name={f.icon} size={15} variant="duotone" /></span>{f.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 grid place-items-center py-6">
                <Mascot name="taro" pose="go" size={230} float />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {HIGHLIGHTS.map((h) => (
                  <div key={h.title} className="rounded-2xl bg-card/70 dark:bg-card/60 border border-border/60 p-3 flex items-center gap-2.5">
                    <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', TINTS[h.tint].bg)}><LifeIcon name={h.icon} size={20} variant="duotone" /></span>
                    <span className="min-w-0"><span className="block text-[13px] font-extrabold leading-tight">{h.title}</span><span className="block text-[11px] text-muted-foreground leading-tight">{h.desc}</span></span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[14px] italic text-primary/90 font-medium">“Cuộc sống tốt đẹp hơn không tự nhiên mà có, nó được tạo nên từ những lựa chọn nhỏ mỗi ngày.” 💜</p>
            </section>

            {/* Bên phải: một thẻ duy nhất, chuyển tab Đăng nhập / Đăng ký */}
            <div className="flex flex-col justify-center">
              <Surface className="p-7">
                {!showForgotPassword && (
                  <div role="tablist" aria-label="Chọn hình thức" className="grid grid-cols-2 p-1 mb-6 rounded-full bg-secondary">
                    {([['login', 'Đăng nhập'], ['register', 'Đăng ký']] as const).map(([k, label]) => (
                      <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setShowForgotPassword(false); setMode(k); }}
                        className={cn('h-10 rounded-full text-[13.5px] font-semibold transition', tab === k ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {tab === 'register' && !showForgotPassword ? registerCard : loginCard}
              </Surface>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
