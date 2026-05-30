import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = [
  { key: '1', path: '/', label: 'Today' },
  { key: '2', path: '/dashboard', label: 'Dashboard' },
  { key: '3', path: '/habits', label: 'Habits' },
  { key: '4', path: '/tasks', label: 'Tasks' },
  { key: '5', path: '/goals', label: 'Goals' },
  { key: '6', path: '/journal', label: 'Journal' },
  { key: '7', path: '/life-wheel', label: 'Life Wheel' },
  { key: '8', path: '/weekly-review', label: 'Weekly Review' },
  { key: '9', path: '/ai-chat', label: 'AI Coach' },
  { key: '0', path: '/me', label: 'Profile' },
];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Alt key
      if (!e.altKey) return;
      
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const shortcut = SHORTCUTS.find(s => s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        navigate(shortcut.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return SHORTCUTS;
}

export { SHORTCUTS };
