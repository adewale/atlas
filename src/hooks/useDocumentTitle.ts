import { useEffect } from 'react';
import {
  applySeoMetadata,
  getNotFoundMetadata,
  getSeoMetadata,
} from '../lib/seo';

/**
 * Keep metadata correct after client-side navigation. Direct requests receive
 * the same data in their build-generated HTML, so crawlers do not need to run
 * JavaScript to see it.
 */
export function useRouteMetadata(pathname: string) {
  useEffect(() => {
    applySeoMetadata(getSeoMetadata(pathname) ?? getNotFoundMetadata(pathname));
  }, [pathname]);
}

export function useDocumentTitle(title?: string, description?: string) {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  useEffect(() => {
    const routeMetadata = getSeoMetadata(pathname);
    if (routeMetadata) {
      applySeoMetadata(routeMetadata);
      return;
    }

    const notFound = getNotFoundMetadata(pathname);
    if (title) notFound.title = `${title} — Atlas`;
    if (description) notFound.description = description;
    applySeoMetadata(notFound);
  }, [title, description, pathname]);
}
