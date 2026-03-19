import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Sparkles, Target, CheckCircle2, TrendingUp, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { SimpleCaptcha } from '@/components/auth/SimpleCaptcha';

const emailSchema = z.string().email('Email không hợp lệ');
const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự');

export default function AuthPage() {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-[1280px] flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-l-2xl my-8 ml-8">
          <div className="max-w-md text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-primary/20">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">LifeOS</h1>
            </div>
            
            <p className="text-xl text-muted-foreground">
              Hệ điều hành cuộc sống - Quản lý mục tiêu, thói quen và phát triển bản thân
            </p>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur">
                <Target className="h-6 w-6 text-primary" />
                <span className="text-foreground">Theo dõi mục tiêu và milestones</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur">
                <CheckCircle2 className="h-6 w-6 text-accent" />
                <span className="text-foreground">Xây dựng thói quen tích cực</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur">
                <TrendingUp className="h-6 w-6 text-success" />
                <span className="text-foreground">Phân tích và cải thiện liên tục</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:my-8 lg:mr-8">
          <Card className="w-full max-w-md animate-fade-in">
            <CardHeader className="text-center">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">LifeOS</span>
              </div>
              {showResetPassword ? (
                <>
                  <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
                  <CardDescription>
                    Nhập mật khẩu mới cho tài khoản của bạn
                  </CardDescription>
                </>
              ) : showForgotPassword ? (
                <>
                  <CardTitle className="text-2xl">Quên mật khẩu?</CardTitle>
                  <CardDescription>
                    Nhập email để nhận link đặt lại mật khẩu
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl">Chào mừng bạn!</CardTitle>
                  <CardDescription>
                    Đăng nhập hoặc tạo tài khoản để bắt đầu
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {showResetPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={isLoading}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật mật khẩu'
                    )}
                  </Button>
                </form>
              ) : showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi link đặt lại mật khẩu'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại đăng nhập
                  </Button>
                </form>
              ) : (
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Đăng nhập</TabsTrigger>
                    <TabsTrigger value="signup">Đăng ký</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="animate-fade-in">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Mật khẩu</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 h-auto text-sm text-muted-foreground hover:text-primary"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Quên mật khẩu?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked === true)}
                        />
                        <Label
                          htmlFor="remember-me"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Ghi nhớ tài khoản
                        </Label>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang đăng nhập...
                          </>
                        ) : (
                          'Đăng nhập'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="animate-fade-in">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Họ tên</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Mật khẩu</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">Xác nhận mật khẩu</Label>
                        <div className="relative">
                          <Input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Mã xác nhận</Label>
                        <SimpleCaptcha
                          onVerify={setCaptchaValid}
                          disabled={isLoading}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading || !captchaValid}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tạo tài khoản...
                          </>
                        ) : (
                          'Tạo tài khoản'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
