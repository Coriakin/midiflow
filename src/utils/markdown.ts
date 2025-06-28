/**
 * Simple markdown parser for basic About page content
 */

interface ParsedMarkdown {
  title: string;
  sections: Array<{
    type: 'paragraph' | 'heading' | 'list' | 'link' | 'separator';
    content: string;
    level?: number;
    items?: string[];
    href?: string;
  }>;
}

export const parseMarkdown = (markdown: string): ParsedMarkdown => {
  const lines = markdown.split('\n');
  const sections: ParsedMarkdown['sections'] = [];
  let title = '';
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line) {
      i++;
      continue;
    }
    
    // Main heading (title)
    if (line.startsWith('# ')) {
      title = line.slice(2);
    }
    // Sub headings
    else if (line.startsWith('## ')) {
      sections.push({
        type: 'heading',
        content: line.slice(3),
        level: 2
      });
    }
    // Separator
    else if (line === '---') {
      sections.push({
        type: 'separator',
        content: ''
      });
    }
    // Lists
    else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      sections.push({
        type: 'list',
        content: '',
        items
      });
      continue; // Skip the i++ at the end
    }
    // Links
    else if (line.match(/^\[(.+)\]\((.+)\)$/)) {
      const match = line.match(/^\[(.+)\]\((.+)\)$/);
      if (match) {
        sections.push({
          type: 'link',
          content: match[1],
          href: match[2]
        });
      }
    }
    // Italic text (emphasis)
    else if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
      sections.push({
        type: 'paragraph',
        content: line.slice(1, -1) // Remove asterisks
      });
    }
    // Regular paragraphs
    else {
      sections.push({
        type: 'paragraph',
        content: line
      });
    }
    
    i++;
  }
  
  return { title, sections };
};

export const loadMarkdownFile = async (path: string): Promise<string> => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load markdown file: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading markdown file:', error);
    throw error;
  }
};
