import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
  disabled?: boolean;
}

export function SimpleCaptcha({ onVerify, disabled }: SimpleCaptchaProps) {
  const [captchaValue, setCaptchaValue] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Generate random captcha (4-5 characters)
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    const length = 4 + Math.floor(Math.random() * 2); // 4 or 5 chars
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    const newCaptcha = generateCaptcha();
    setCaptchaValue(newCaptcha);
    setUserInput('');
    setIsValid(false);
    onVerify(false);
  }, []);

  const handleRefresh = () => {
    const newCaptcha = generateCaptcha();
    setCaptchaValue(newCaptcha);
    setUserInput('');
    setIsValid(false);
    onVerify(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);
    
    const valid = value === captchaValue;
    setIsValid(valid);
    onVerify(valid);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-center h-12 bg-muted rounded-md border-2 border-dashed border-primary/30">
            <span className="text-2xl font-bold tracking-widest text-foreground select-none">
              {captchaValue}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={disabled}
          className="h-12 w-12"
          title="Làm mới mã"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        type="text"
        placeholder="Nhập mã xác nhận"
        value={userInput}
        onChange={handleInputChange}
        disabled={disabled}
        className="text-center font-mono text-lg tracking-widest uppercase"
        maxLength={captchaValue.length}
      />
      {userInput && !isValid && (
        <p className="text-sm text-destructive">Mã xác nhận không đúng</p>
      )}
      {isValid && (
        <p className="text-sm text-green-600">✓ Mã xác nhận đúng</p>
      )}
    </div>
  );
}

