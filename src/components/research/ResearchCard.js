import Link from 'next/link';
import { formatDate } from '@/lib/blog/date';

export default function ResearchCard({ slug, frontmatter }) {
  const { title, abstract, date, authors, journal, doi } = frontmatter;

  return (
    <Link href={`/research/${slug}`}>
      <article className="dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 bg-white rounded-md overflow-hidden hover:shadow-lg transition-shadow duration-300 dark:border dark:border-gray-700 dark:hover:border-[#e30a5f] border border-gray-300 hover:border-[#e30a5f] group cursor-pointer h-full flex flex-col">
        <div className="p-5 flex flex-col flex-grow">
          {/* Title - Academic style */}
          <h2
            className="text-lg font-bold dark:text-white text-gray-900 mb-2 group-hover:text-[#e30a5f] transition-colors leading-snug"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {title}
          </h2>

          {/* Authors - Academic style */}
          {authors && (
            <p
              className="dark:text-gray-400 text-gray-700 mb-2 text-sm italic"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {Array.isArray(authors) ? authors.join(', ') : authors}
            </p>
          )}

          {/* Journal/Publication info */}
          {journal && (
            <p
              className="dark:text-gray-500 text-gray-600 mb-3 text-xs"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              <span className="italic">{journal}</span> • {formatDate(date)}
            </p>
          )}

          {/* Abstract preview */}
          <p
            className="dark:text-gray-300 text-gray-700 mb-3 line-clamp-2 flex-grow text-sm leading-relaxed"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {abstract}
          </p>

          {/* Footer with DOI */}
          <div className="flex items-center justify-between pt-3 dark:border-t dark:border-gray-700 border-t border-gray-300 mt-auto">
            <div className="flex flex-col text-xs" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              <span className="dark:text-gray-500 text-gray-500">{formatDate(date)}</span>
              {doi && (
                <span className="dark:text-gray-500 text-gray-600 text-xs font-mono">
                  DOI: {doi}
                </span>
              )}
            </div>
            <span className="text-[#e30a5f] text-sm group-hover:translate-x-1 transition-transform font-fredoka font-semibold">
              Read →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
