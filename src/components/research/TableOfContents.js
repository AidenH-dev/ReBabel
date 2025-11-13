import { useState, useEffect, useMemo } from 'react';

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  // Build hierarchical structure
  const structure = useMemo(() => {
    const tree = [];
    const stack = [];

    headings.forEach((heading) => {
      const item = { ...heading, children: [] };

      // Pop stack until we find the parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        tree.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }

      stack.push(item);
    });

    return tree;
  }, [headings]);

  useEffect(() => {
    const handleScroll = () => {
      let currentHeading = '';

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            currentHeading = heading.id;
          }
        }
      }

      if (currentHeading) {
        setActiveId(currentHeading);

        // Auto-expand only immediate parent section when child becomes active
        setExpandedSections((prev) => {
          const newExpanded = {};
          const activeHeading = headings.find((h) => h.id === currentHeading);

          if (activeHeading) {
            // Find only the immediate parent (closest heading with lower level)
            for (let i = headings.indexOf(activeHeading) - 1; i >= 0; i--) {
              if (headings[i].level < activeHeading.level) {
                newExpanded[headings[i].id] = true;
                break; // Only expand immediate parent, stop here
              }
            }
          }

          return newExpanded;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleSection = (id, hasChildren) => {
    if (hasChildren) {
      setExpandedSections((prev) => {
        // If expanding this section, close all others
        if (!prev[id]) {
          return { [id]: true };
        } else {
          // If closing this section, close everything
          return {};
        }
      });
    }
  };

  if (!headings || headings.length === 0) {
    return null;
  }

  const renderHeadings = (items) => {
    return items.map((heading) => {
      const hasChildren = heading.children && heading.children.length > 0;
      const isExpanded = expandedSections[heading.id] === true; // Collapsed by default
      const isActive = activeId === heading.id;

      return (
        <div key={heading.id} style={{ fontFamily: 'IBM Plex Serif' }} >
          <button
            onClick={() => {
              scrollToHeading(heading.id);
              toggleSection(heading.id, hasChildren);
            }}
            className={`w-full text-left py-1.5 text-xs transition-all duration-200 flex items-center gap-2 group ${
              isActive
                ? 'dark:text-[#e30a5f] text-[#e30a5f] font-semibold'
                : 'dark:text-gray-500 text-gray-500 hover:dark:text-gray-400 hover:text-gray-700'
            }`}
            style={{ paddingLeft: `${(heading.level - 2) * 16}px` }}
          >
            <div
              className={`w-0.5 h-4 transition-all duration-200 ${
                isActive
                  ? 'dark:bg-[#e30a5f] bg-[#e30a5f] w-1'
                  : 'dark:bg-gray-600 bg-gray-300 group-hover:dark:bg-gray-500 group-hover:bg-gray-400'
              }`}
            />
            <span className="line-clamp-2 text-xs flex-1">{heading.text}</span>
            {hasChildren && (
              <svg
                className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {hasChildren && isExpanded && (
            <div className="space-y-1">
              {renderHeadings(heading.children)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside
      className="hidden xl:block w-48 pt-15"
      style={{
        position: 'sticky',
        top: '20px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        alignSelf: 'flex-start'
      }}
    >
      <nav className="space-y-1.5">
        {renderHeadings(structure)}
      </nav>
    </aside>
  );
}
