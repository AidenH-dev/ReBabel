import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/atom-one-dark.css';

export default function BlogMarkdown({ content }) {
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold dark:text-white text-gray-900 mt-8 mb-4 font-fredoka" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-bold dark:text-white text-gray-900 mt-8 mb-3 font-fredoka" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-semibold dark:text-white text-gray-900 mt-6 mb-2 font-fredoka" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xl font-semibold dark:text-gray-200 text-gray-800 mt-4 mb-2 font-fredoka" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="dark:text-gray-300 text-gray-700 text-base leading-relaxed mb-4" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-[#e30a5f] hover:text-[#ff1f75] underline transition-colors" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside dark:text-gray-300 text-gray-700 mb-4 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside dark:text-gray-300 text-gray-700 mb-4 space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="dark:text-gray-300 text-gray-700 ml-2" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-[#e30a5f] dark:bg-gray-900 bg-gray-100 dark:bg-opacity-50 pl-4 py-2 my-4 italic dark:text-gray-300 text-gray-700"
              {...props}
            />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="dark:bg-gray-900 bg-gray-100 text-[#ff6b9d] px-2 py-1 rounded text-sm font-mono" {...props} />
            ) : (
              <code className="dark:bg-gray-900 bg-gray-100 dark:text-gray-200 text-gray-800 p-4 rounded block overflow-x-auto mb-4 font-mono text-sm" {...props} />
            ),
          pre: ({ node, ...props }) => (
            <pre className="dark:bg-gray-900 bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto" {...props} />
          ),
          img: ({ node, alt, ...props }) => (
            <img
              className="max-w-full h-auto rounded-lg my-4 shadow-lg"
              alt={alt || 'Blog image'}
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <table className="w-full border-collapse my-4" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border dark:border-gray-700 border-gray-300 dark:bg-gray-900 bg-gray-100 px-4 py-2 text-left dark:text-white text-gray-900 font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border dark:border-gray-700 border-gray-300 px-4 py-2 dark:text-gray-300 text-gray-700" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 dark:border-gray-700 border-gray-300" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
