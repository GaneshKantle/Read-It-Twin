import { countWords } from '@/lib/reading';

/** Join authored paragraphs into the DB `content` column representation. */
export function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean).join('\n\n');
}

/** Split DB `content` back into paragraphs for the reading UI. */
export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Word count for stored passage content — same definition as paragraph counting. */
export function countWordsInContent(content: string): number {
  return countWords(content.replace(/\n+/g, ' '));
}
