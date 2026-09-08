import { useEffect } from 'react';

const DEFAULT_TITLE = 'Read It Twin';
const DEFAULT_DESCRIPTION =
  'Read faster. Understand more. Challenge a friend. Read It Twin scores speed and comprehension together.';

type DocumentMetaOptions = {
  title?: string;
  description?: string;
  /** Defaults to indexable. Use noindex for private room/session routes. */
  robots?: 'index,follow' | 'noindex,nofollow';
};

function ensureMeta(name: string): HTMLMetaElement {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  return meta as HTMLMetaElement;
}

/**
 * Sets document title, description, and robots for the active route.
 * Room pages must use generic copy — never nicknames or scores.
 */
export function useDocumentMeta(options: DocumentMetaOptions = {}): void {
  const title = options.title?.trim() || DEFAULT_TITLE;
  const description = options.description?.trim() || DEFAULT_DESCRIPTION;
  const robots = options.robots ?? 'index,follow';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const descriptionMeta = ensureMeta('description');
    const previousDescription = descriptionMeta.getAttribute('content');
    descriptionMeta.setAttribute('content', description);

    const robotsMeta = ensureMeta('robots');
    const previousRobots = robotsMeta.getAttribute('content');
    robotsMeta.setAttribute('content', robots);

    return () => {
      document.title = previousTitle;
      if (previousDescription != null) {
        descriptionMeta.setAttribute('content', previousDescription);
      }
      if (previousRobots != null) {
        robotsMeta.setAttribute('content', previousRobots);
      } else {
        robotsMeta.remove();
      }
    };
  }, [description, robots, title]);
}
