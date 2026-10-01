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
import { SimpleCaptcha } from '@/components/auth/SimpleCaptcha';
import { Mascot } from '@/components/brand/Mascot';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { Surface, TINTS, type Tint } from '@/components/lio';
import { cn } from '@/lib/utils';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';

/**
 * Module 17 — Đăng nhập / Đăng ký (LIO kit). Toàn bộ logic giữ nguyên từ trang cũ (/auth/classic):
 * signIn, signUp + captcha, ghi nhớ email, quên mật khẩu (resetPassword), đặt lại mật khẩu (?reset=true).
 */
const emailSchema = z.string().email('Email không hợp lệ');
const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự');

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

const inputCls = 'h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-10 text-[14px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:opacity-60';

function TextInput({ id, label, icon: Icon, error, reveal, onReveal, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: typeof Mail; error?: string; reveal?: boolean; onReveal?: () => void }) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-[12.5px] font-semibold mb-1.5">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input id={id} className={cn(inputCls, error && 'border-destructive/60')} {...rest} />
        {onReveal && (
          <button type="button" onClick={onReveal} aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
      {error && <span className="block text-[12px] text-destructive mt-1">{error}</span>}
    </label>
  );
}

function CardHead({ icon, title, subtitle, onBack }: { icon: LifeIconName; title: string; subtitle: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {onBack && <button type="button" onClick={onBack} aria-label="Quay lại" className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"><ArrowLeft className="h-4 w-4" /></button>}
      <span className="h-11 w-11 rounded-[14px] grid place-items-center bg-lavender dark:bg-primary/15 shrink-0"><LifeIcon name={icon} size={24} variant="duotone" /></span>
      <span className="min-w-0"><span className="block text-[18px] font-extrabold leading-tight">{title}</span><span className="block text-[12.5px] text-muted-foreground">{subtitle}</span></span>
    </div>
  );
}

const Logo = () => (
  <span className="inline-flex items-center gap-2">
    <span className="h-9 w-9 rounded-[12px] bg-primary/10 grid place-items-center text-[18px]">🌱</span>
    <span className="leading-tight"><span className="block text-[18px] font-extrabold tracking-tight">LifeOS</span><span className="block text-[11px] text-muted-foreground">Your Life, More Meaningful</span></span>
  </span>
);

export default function AuthPage() {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Auth page

  // Load remembered email from localStorage
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && user && !showResetPassword) {
      navigate('/');
    }
  }, [user, loading, navigate, showResetPassword]);

  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setShowResetPassword(true);
    }
  }, [searchParams]);

  const validateForm = (isSignUp = false) => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    // Validate confirm password for signup
    if (isSignUp) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Save email to localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      let message = 'Đăng nhập thất bại';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email hoặc mật khẩu không đúng';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Vui lòng xác nhận email trước khi đăng nhập';
      }
      toast.error('Lỗi', { description: message });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    // Check captcha
    if (!captchaValid) {
      toast.error('Lỗi xác nhận', { description: 'Vui lòng nhập đúng mã xác nhận' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        console.error('Sign up error in AuthPage:', error);
        
        let message = 'Đăng ký thất bại';
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('user already registered') || errorMsg.includes('already registered')) {
          message = 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
        } else if (errorMsg.includes('password') || errorMsg.includes('weak password')) {
          message = 'Mật khẩu không hợp lệ. Mật khẩu phải có ít nhất 6 ký tự.';
        } else if (errorMsg.includes('email') && errorMsg.includes('invalid')) {
          message = 'Email không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
          message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.';
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          message = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
        } else {
          // Hiển thị error message chi tiết hơn
          message = `Đăng ký thất bại: ${error.message}`;
        }
        
        toast.error('Lỗi đăng ký', { description: message });
      } else {
        toast.success('Thành công!', { description: 'Tài khoản đã được tạo. Vui lòng kiểm tra email để xác nhận tài khoản (nếu cần).' });
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setCaptchaValid(false);
        setMode('login');
      }
    } catch (err) {
      console.error('Unexpected error in handleSignUp:', err);
      toast.error('Lỗi', { description: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      toast.error('Lỗi', { description: 'Không thể gửi email reset mật khẩu' });
    } else {
      toast.success('Thành công!', { description: 'Vui lòng kiểm tra email để đặt lại mật khẩu' });
      setShowForgotPassword(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      setErrors({ password: passwordResult.error.errors[0].message });
      return;
    }
    
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      toast.error('Lỗi', { description: 'Không thể cập nhật mật khẩu' });
    } else {
      toast.success('Thành công!', { description: 'Mật khẩu đã được cập nhật' });
      setShowResetPassword(false);
      navigate('/');
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const submitBtn = (label: string) => (
    <Button type="submit" className="w-full h-11 rounded-full shadow-soft text-[14px]" disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{label}
    </Button>
  );

  const loginCard = showForgotPassword ? (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <CardHead icon="module/settings" title="Quên mật khẩu" subtitle="Nhập email để nhận link đặt lại mật khẩu" onBack={() => setShowForgotPassword(false)} />
      <TextInput id="forgot-email" label="Email" icon={Mail} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={isLoading} autoComplete="email" />
      {submitBtn('Gửi link đặt lại')}
    </form>
  ) : (
    <form onSubmit={handleSignIn} className="space-y-4">
      <CardHead icon="module/profile" title="Đăng nhập" subtitle="Chào mừng bạn trở lại!" onBack={isMobile ? () => setMode('welcome') : undefined} />
      <TextInput id="signin-email" label="Email" icon={Mail} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={isLoading} autoComplete="username" />
      <TextInput id="signin-password" label="Mật khẩu" icon={Lock} type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={isLoading} autoComplete="current-password" reveal={showPassword} onReveal={() => setShowPassword(!showPassword)} />
      <div className="flex items-center justify-between text-[12.5px]">
        <label className="inline-flex items-center gap-2 cursor-pointer"><Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c === true)} />Ghi nhớ đăng nhập</label>
        <button type="button" onClick={() => setShowForgotPassword(true)} className="font-semibold text-primary">Quên mật khẩu?</button>
      </div>
      {submitBtn('Đăng nhập')}
      <p className="text-center text-[12.5px] text-muted-foreground">Chưa có tài khoản? <button type="button" onClick={() => { setMode('register'); setTimeout(() => document.getElementById('signup-name')?.focus(), 50); }} className="font-semibold text-primary">Đăng ký ngay</button></p>
    </form>
  );

  const registerCard = (
    <form onSubmit={handleSignUp} className="space-y-3.5">
      <CardHead icon="module/goals" title="Tạo tài khoản mới" subtitle="Bắt đầu hành trình tốt hơn của bạn!" onBack={isMobile ? () => setMode('welcome') : undefined} />
      <TextInput id="signup-name" label="Họ và tên" icon={User} placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} autoComplete="name" />
      <TextInput id="signup-email" label="Email" icon={Mail} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={isLoading} autoComplete="email" />
      <TextInput id="signup-password" label="Mật khẩu" icon={Lock} type={showPassword ? 'text' : 'password'} placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={isLoading} autoComplete="new-password" reveal={showPassword} onReveal={() => setShowPassword(!showPassword)} />
      <TextInput id="signup-confirm" label="Xác nhận mật khẩu" icon={Lock} type={showConfirmPassword ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} disabled={isLoading} autoComplete="new-password" reveal={showConfirmPassword} onReveal={() => setShowConfirmPassword(!showConfirmPassword)} />
      <div><span className="block text-[12.5px] font-semibold mb-1.5">Mã xác nhận</span><SimpleCaptcha onVerify={setCaptchaValid} disabled={isLoading} /></div>
      {submitBtn('Tạo tài khoản')}
      <p className="text-center text-[12.5px] text-muted-foreground">Đã có tài khoản? <button type="button" onClick={() => { setMode('login'); setShowForgotPassword(false); setTimeout(() => document.getElementById('signin-email')?.focus(), 50); }} className="font-semibold text-primary">Đăng nhập</button></p>
    </form>
  );

  const resetCard = (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <CardHead icon="module/settings" title="Đặt lại mật khẩu" subtitle="Nhập mật khẩu mới cho tài khoản của bạn" />
      <TextInput id="new-password" label="Mật khẩu mới" icon={Lock} type={showNewPassword ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.password} disabled={isLoading} autoComplete="new-password" reveal={showNewPassword} onReveal={() => setShowNewPassword(!showNewPassword)} />
      {submitBtn('Cập nhật mật khẩu')}
    </form>
  );

  const topBar = (
    <header className="flex items-center justify-between gap-3 px-4 lg:px-8 h-16">
      <Logo />
      <div className="flex items-center gap-2"><ThemeToggle />{!isMobile && !showResetPassword && <Button variant="outline" className="h-10 rounded-full px-5" onClick={() => document.getElementById('signin-email')?.focus()}>Đăng nhập</Button>}</div>
    </header>
  );

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-mint/5">
        {topBar}
        <main className="px-4 py-10 grid place-items-center"><Surface className="w-full max-w-[440px] p-6">{resetCard}</Surface></main>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lavender/60 via-background to-background dark:from-primary/10">
        {mode === 'welcome' ? (
          <main className="min-h-screen flex flex-col items-center justify-between px-6 pt-14 pb-8 text-center">
            <Logo />
            <div className="flex flex-col items-center">
              <Mascot name="taro" pose="go" size={190} float />
              <p className="mt-4 text-[20px] font-extrabold leading-snug">Chào mừng đến với LifeOS! 💜</p>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground italic">Sống một cuộc sống ý nghĩa hơn</p>
            </div>
            <div className="w-full space-y-2.5">
              <Button className="w-full h-12 rounded-full shadow-soft text-[15px]" onClick={() => setMode('register')}>Bắt đầu ngay</Button>
              <Button variant="outline" className="w-full h-12 rounded-full text-[15px]" onClick={() => setMode('login')}>Tôi đã có tài khoản</Button>
            </div>
          </main>
        ) : (
          <main className="px-4 pt-6 pb-10">
            <Surface className="p-5">{mode === 'register' ? registerCard : loginCard}</Surface>
          </main>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-mint/5">
      <div className="max-w-[1280px] mx-auto">
        {topBar}
        <main className="px-8 pb-10 space-y-5">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-lavender via-[#EEF3FF] to-[#E8FBF4] dark:from-primary/15 dark:via-card dark:to-card border border-border/60 shadow-soft px-10 py-8 flex items-center gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-[34px] font-extrabold leading-tight tracking-tight">Chào mừng đến với<br />LifeOS! 💙</h1>
              <p className="mt-2 text-[15px] text-muted-foreground max-w-[420px]">Bắt đầu hành trình xây dựng cuộc sống ý nghĩa hơn ngay hôm nay!</p>
              <div className="mt-6 flex flex-wrap gap-6">
                {FEATURES.map((f) => (
                  <span key={f.label} className="flex flex-col items-center gap-1.5 w-[92px] text-center">
                    <span className={cn('h-11 w-11 rounded-[14px] grid place-items-center', TINTS[f.tint].bg)}><LifeIcon name={f.icon} size={24} variant="duotone" /></span>
                    <span className="text-[12px] font-semibold leading-tight">{f.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <Mascot name="taro" pose="go" size={200} float className="shrink-0" />
            <p className="hidden xl:block w-[220px] shrink-0 text-[15px] italic text-primary/90 font-medium">“Một cuộc sống tốt đẹp hơn bắt đầu từ chính bạn!” 💙</p>
          </section>
          <div className="grid gap-5 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px] items-start">
            <Surface className={cn('p-6 transition', mode === 'register' && 'opacity-90')}>{loginCard}</Surface>
            <Surface className="p-6">{registerCard}</Surface>
            <aside className="hidden xl:block space-y-4">
              <Surface className="p-5 text-center bg-gradient-to-b from-lavender/70 to-card dark:from-primary/10">
                <p className="text-[14px] italic text-primary/90 font-medium leading-relaxed">“Cuộc sống tốt đẹp hơn không tự nhiên mà có, nó được tạo nên từ những lựa chọn nhỏ mỗi ngày.” 💜</p>
                <Mascot name="ori" pose="learn" size={120} className="mx-auto mt-3" />
              </Surface>
              <Surface className="p-4 space-y-3">
                {HIGHLIGHTS.map((h) => (
                  <div key={h.title} className="flex items-center gap-3">
                    <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center', TINTS[h.tint].bg)}><LifeIcon name={h.icon} size={22} variant="duotone" /></span>
                    <span><span className="block text-[14px] font-extrabold">{h.title}</span><span className="block text-[11.5px] text-muted-foreground">{h.desc}</span></span>
                  </div>
                ))}
              </Surface>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
