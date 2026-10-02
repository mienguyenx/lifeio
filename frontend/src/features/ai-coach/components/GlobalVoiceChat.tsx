import { useEffect, useState } from 'react';
import { useCoach } from '../hooks/useCoach';
import { VoiceChat } from './VoiceChat';

const EVENT = 'lifeos:voice-chat';

/** Mở Voice Chat từ bất kỳ đâu (header, Quick Add, AI Coach…). */
export const openVoiceChat = () => window.dispatchEvent(new Event(EVENT));

/** Một phiên Voice Chat dùng chung cho toàn ứng dụng — gắn một lần trong AppLayout. */
export function GlobalVoiceChat() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    const key = (e: KeyboardEvent) => { if (e.altKey && (e.key === 'v' || e.key === 'V' || e.code === 'KeyV')) { e.preventDefault(); setOpen(true); } };
    window.addEventListener(EVENT, on);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener(EVENT, on); window.removeEventListener('keydown', key); };
  }, []);
  return open ? <Mounted open={open} onOpenChange={setOpen} /> : null;
}

function Mounted({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const api = useCoach();
  return <VoiceChat api={api} open={open} onOpenChange={onOpenChange} />;
}
