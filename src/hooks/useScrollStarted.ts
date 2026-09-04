import { useEffect, useState } from 'react';

/** True once the page has moved off the very top, used to compact the header. */
export function useScrollStarted(threshold = 50) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const update = () => setStarted(window.scrollY > threshold);

    update();
    window.addEventListener('scroll', update, { passive: true });

    return () => window.removeEventListener('scroll', update);
  }, [threshold]);

  return started;
}
