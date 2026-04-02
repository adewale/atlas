import { useEffect } from 'react';

const BASE_TITLE = 'Atlas — Periodic Table';
const BASE_DESCRIPTION = 'Atlas is an interactive periodic table featuring element folios, discovery timelines, etymology maps, property comparisons, and neighbourhood graphs — all rendered in a Byrne-inspired geometric design.';

let metaDescription: HTMLMetaElement | null = null;

function getMetaDescription(): HTMLMetaElement {
  if (!metaDescription) {
    metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
  }
  return metaDescription;
}

export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Atlas` : BASE_TITLE;
    getMetaDescription().content = description ?? BASE_DESCRIPTION;
    return () => {
      document.title = BASE_TITLE;
      getMetaDescription().content = BASE_DESCRIPTION;
    };
  }, [title, description]);
}
