import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer for About page content
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (!line) {
        i++;
        continue;
      }
      
      // Main heading (title)
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={i} className="text-xl font-semibold mb-4">
            {line.slice(2)}
          </h2>
        );
      }
      // Sub headings
      else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={i} className="text-lg font-medium text-white mb-3">
            {line.slice(3)}
          </h3>
        );
      }
      // Separator
      else if (line === '---') {
        elements.push(
          <hr key={i} className="border-gray-600 my-4" />
        );
      }
      // Lists
      else if (line.startsWith('- ')) {
        const items: string[] = [];
        const startIndex = i;
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          const item = lines[i].trim().slice(2);
          // Handle checkmarks
          if (item.startsWith('✓ ')) {
            items.push(item.slice(2));
          } else {
            items.push(item);
          }
          i++;
        }
        
        elements.push(
          <div key={startIndex} className="bg-gray-700 rounded-lg p-4">
            <ul className="space-y-2 text-sm">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        continue; // Skip the i++ at the end
      }
      // Links
      else if (line.match(/^\[(.+)\]\((.+)\)$/)) {
        const match = line.match(/^\[(.+)\]\((.+)\)$/);
        if (match) {
          elements.push(
            <div key={i} className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Open Source</h3>
              <p className="text-sm mb-3">
                MIDIFlow is open source software. You can find the source code, report issues, 
                and contribute to the project on GitHub.
              </p>
              <a
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span>{match[1]}</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          );
        }
      }
      // Italic text (emphasis)
      else if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
        elements.push(
          <div key={i} className="text-center text-sm text-gray-500">
            {line.slice(1, -1)}
          </div>
        );
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={i} className="text-gray-300">
            {line}
          </p>
        );
      }
      
      i++;
    }
    
    return elements;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {renderContent()}
    </div>
  );
};
