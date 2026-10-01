import type { ReactNode } from 'react';
import { Fab, Page, PageHeader, SegmentedTabs } from '@/components/lio';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReviewSwitcher } from './ReviewParts';

/** Khung trang chung cho 4 trang Review: tiêu đề + chuyển kỳ + tab nội dung + FAB mobile. */
export function ReviewLayout<T extends string>({ title, subtitle, actions, tabs, view, onView, fab, children }: {
  title: string; subtitle: string; actions?: ReactNode; tabs: { id: NoInfer<T>; label: string }[]; view: T; onView: (v: NoInfer<T>) => void; fab?: { label: string; onClick: () => void }; children: ReactNode;
}) {
  const isMobile = useIsMobile();
  return (
    <Page>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">{title} <ModuleHelpButton module="weeklyreview" /></span>}
        subtitle={subtitle}
        actions={!isMobile && <><ReviewSwitcher />{actions}</>}
      />
      {isMobile && <ReviewSwitcher full className="mb-3" />}
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
        <SegmentedTabs items={tabs} value={view} onChange={onView} full={isMobile && tabs.length <= 4} />
      </div>
      {children}
      {isMobile && fab && <Fab onClick={fab.onClick} label={fab.label} />}
    </Page>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Xóa', onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode; confirmLabel?: string; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
