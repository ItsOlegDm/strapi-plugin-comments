import { useMemo } from "react";
import sanitizeHtml from "sanitize-html";
import { useSettingsStore } from "../store/settings.store";

const sanitizeOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'i', 'em', 'del',
    'blockquote',
    'ul', 'ol', 'li',
    'pre', 'code',
    'a',
    'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'video', 'audio', 'source',
  ],
  allowedAttributes: {
    '*': ['href', 'align', 'alt', 'center', 'width', 'height', 'type', 'controls', 'target'],
    img: ['src', 'alt'],
    source: ['src', 'type'],
    video: ['src', 'controls', 'width', 'height'],
    audio: ['src', 'controls'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
} as const;

export const useSanitizedHTML = (html: string) => {
  const sanitizeComments = useSettingsStore(
    (state) => (state.settings.sanitizeComments ?? true),
  );

  return useMemo(() => {
    if (!sanitizeComments) {
      return html;
    }

    return sanitizeHtml(html, sanitizeOptions);
  }, [html, sanitizeComments]);
};