import { useEffect } from 'react';

/**
 * Notes when the reader leaves the tab or window mid-run. One episode counts
 * once, however many events the browser fires on the way out.
 */
export function useTabFocusGuard(active: boolean, onFocusLoss: () => void) {
  useEffect(() => {
    if (!active) {
      return;
    }

    let away = false;

    const leave = () => {
      if (away) {
        return;
      }

      away = true;
      onFocusLoss();
    };

    const returned = () => {
      away = false;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        leave();
      } else {
        returned();
      }
    };

    window.addEventListener('blur', leave);
    window.addEventListener('focus', returned);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', returned);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [active, onFocusLoss]);
}
