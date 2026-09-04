import { useEffect, useState } from 'react';

const query = '(hover: hover) and (pointer: fine)';

/** Guards the hover-only flourishes so touch devices never get stuck mid-effect. */
export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setFine(media.matches);

    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  return fine;
}
