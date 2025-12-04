export interface LinkSegment {
  type: 'text' | 'link' | 'tag';
  content: string;
  linkName?: string;
  tagName?: string;
}

/**
 * Parses note content and extracts [[notename]] links
 * @param content The note content to parse
 * @returns Array of segments (text or link)
 */
export const parseNoteLinks = (content: string): LinkSegment[] => {
  if (!content) return [{ type: 'text', content: '' }];

  const segments: LinkSegment[] = [];
  const regex = /(\[\[(.*?)\]\]|#[\w-]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }

    if (match[0].startsWith('[[')) {
      const linkName = match[2]?.trim() ?? '';
      segments.push({
        type: 'link',
        content: match[0],
        linkName,
      });
    } else if (match[0].startsWith('#')) {
      const tagName = match[0].substring(1);
      segments.push({
        type: 'tag',
        content: match[0],
        tagName,
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after the last link
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  // If no links found, return the whole content as text
  if (segments.length === 0) {
    segments.push({ type: 'text', content });
  }

  return segments;
};

