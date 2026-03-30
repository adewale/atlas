import { useEffect } from 'react';

const BASE_TITLE = 'Atlas — Periodic Table';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Atlas` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [title]);
}
