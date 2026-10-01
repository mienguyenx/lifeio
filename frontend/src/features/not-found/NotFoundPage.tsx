import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/brand/Mascot';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { Page, Surface, TINTS } from '@/components/lio';
import { NAV_GROUPS } from '@/components/layout/navigationConfig';
import { cn } from '@/lib/utils';

/** 404 trong app shell — giữ sidebar/thanh điều hướng, gợi ý trang phổ biến. */
export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { console.error('404 Error: User attempted to access non-existent route:', location.pathname); }, [location.pathname]);
  const popular = NAV_GROUPS.flatMap((g) => g.items).slice(0, 6);
  const tints = ['violet', 'mint', 'sky', 'amber', 'rose', 'orange'] as const;

  return (
    <Page>
      <div className="max-w-2xl mx-auto pt-6 sm:pt-12">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#EFEBFF] via-[#F6F1FF] to-[#FFEFF6] dark:from-primary/20 dark:via-primary/10 dark:to-[#F2557A]/10 border border-border/40 p-6 sm:p-8 text-center">
          <Mascot name="ori" pose="explore" size={150} float className="mx-auto" />
          <p className="text-[56px] font-extrabold tracking-tight leading-none text-primary mt-2">404</p>
          <h1 className="text-[20px] sm:text-[24px] font-extrabold mt-2">Ối! Không tìm thấy trang này</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1.5">Đường dẫn <code className="rounded bg-card/80 px-1.5 py-0.5 text-[12px]">{location.pathname}</code> không tồn tại hoặc đã được di chuyển.</p>
          <div className="flex justify-center gap-2 mt-5">
            <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => navigate('/')}>Về Hôm nay</Button>
            <Button variant="outline" className="h-10 rounded-full px-5" onClick={() => navigate(-1)}>Quay lại</Button>
          </div>
        </div>
        <Surface className="p-4 mt-4">
          <p className="text-[15px] font-bold mb-3">Có thể bạn đang tìm</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {popular.map((it, i) => (
              <button key={it.path} onClick={() => navigate(it.path)} className="flex items-center gap-2.5 rounded-2xl border border-border/60 p-2.5 text-left hover:border-primary/40">
                <span className={cn('h-9 w-9 rounded-xl grid place-items-center shrink-0', TINTS[tints[i % tints.length]].bg)}><LifeIcon name={it.icon} size={20} variant="duotone" /></span>
                <span className="text-[13px] font-semibold truncate">{it.label}</span>
              </button>
            ))}
          </div>
        </Surface>
      </div>
    </Page>
  );
}
