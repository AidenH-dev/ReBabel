import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { textToId } from '@/lib/research/extractHeadings';
import 'highlight.js/styles/github.css';

export default function ResearchMarkdown({ content }) {
  return (
    <article
      className="max-w-3xl mx-auto px-5 py-6 dark:bg-gray-900 "
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-bold dark:text-white text-gray-900 mt-6 mb-4 pb-2 border-b dark:border-gray-700 border-gray-300 text-center leading-tight"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          h2: ({ node, children, ...props }) => {
            const text = children?.toString() || '';
            const id = textToId(text);
            return (
              <h2
                id={id}
                className="text-xl font-bold dark:text-white text-gray-900 mt-6 mb-3 pb-1 border-b dark:border-gray-700 border-gray-300 scroll-mt-24"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3: ({ node, children, ...props }) => {
            const text = children?.toString() || '';
            const id = textToId(text);
            return (
              <h3
                id={id}
                className="text-lg font-semibold dark:text-white text-gray-900 mt-5 mb-2 scroll-mt-24"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4: ({ node, children, ...props }) => {
            const text = children?.toString() || '';
            const id = textToId(text);
            return (
              <h4
                id={id}
                className="text-base font-semibold dark:text-gray-200 text-gray-800 mt-4 mb-2 italic scroll-mt-24"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
                {...props}
              >
                {children}
              </h4>
            );
          },
          p: ({ node, ...props }) => (
            <p
              className="dark:text-gray-300 text-gray-800 text-sm leading-relaxed mb-4 text-justify"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-[#e30a5f] hover:text-[#ff1f75] underline transition-colors"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc dark:text-gray-300 text-gray-800 mb-4 space-y-1 ml-6 text-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal dark:text-gray-300 text-gray-800 mb-4 space-y-1 ml-6 text-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              className="dark:text-gray-300 text-gray-800 leading-relaxed"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-[#e30a5f] dark:bg-gray-800 bg-gray-50 dark:bg-opacity-50 pl-4 pr-3 py-3 my-4 italic dark:text-gray-300 text-gray-700 text-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                className="dark:bg-gray-800 bg-gray-100 text-[#e30a5f] px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              />
            ) : (
              <code
                className="dark:bg-gray-800 bg-gray-50 dark:text-gray-200 text-gray-800 p-3 rounded block overflow-x-auto mb-4 font-mono text-xs border dark:border-gray-700 border-gray-300"
                {...props}
              />
            ),
          pre: ({ node, ...props }) => (
            <pre
              className="dark:bg-gray-800 bg-gray-50 p-4 rounded-md mb-4 overflow-x-auto border dark:border-gray-700 border-gray-300"
              {...props}
            />
          ),
          img: ({ node, alt, src, ...props }) => (
            <div className="my-6 text-center">
              <Image
                src={src}
                alt={alt || 'Research image'}
                width={600}
                height={450}
                className="max-w-full h-auto rounded-md shadow-md inline-block"
                {...props}
              />
              {alt && (
                <p
                  className="text-xs dark:text-gray-400 text-gray-600 mt-2 italic text-center"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  {alt}
                </p>
              )}
            </div>
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="w-full border-collapse border dark:border-gray-700 border-gray-400 text-xs"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
                {...props}
              />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="border dark:border-gray-700 border-gray-400 dark:bg-gray-800 bg-gray-100 px-3 py-2 text-left dark:text-white text-gray-900 font-bold text-xs"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border dark:border-gray-700 border-gray-400 px-3 py-2 dark:text-gray-300 text-gray-800 text-xs"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 dark:border-gray-600 border-gray-400 border-t" {...props} />
          ),
          // Academic citation styling
          sup: ({ node, ...props }) => (
            <sup className="text-[#e30a5f] hover:text-[#ff1f75] text-xs" {...props} />
          ),
          sub: ({ node, ...props }) => <sub className="dark:text-gray-300 text-gray-800 text-xs" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-bold dark:text-white text-gray-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic dark:text-gray-300 text-gray-800" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
