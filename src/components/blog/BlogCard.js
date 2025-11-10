import Link from 'next/link';
import { formatDate } from '@/lib/blog/date';

export default function BlogCard({ slug, frontmatter }) {
  const { title, excerpt, date, author, tags, image } = frontmatter;

  return (
    <Link href={`/blog/${slug}`}>
      <article className="dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 bg-gradient-to-br from-white to-gray-50 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:border dark:border-gray-700 dark:hover:border-[#e30a5f] border border-gray-200 hover:border-[#e30a5f] group cursor-pointer h-full flex flex-col">
        {image && (
          <div className="relative h-48 dark:bg-gray-900 bg-gray-100 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex flex-wrap gap-2 mb-3">
            {tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#e30a5f] bg-opacity-20 text-white text-sm rounded-full font-fredoka"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2 group-hover:text-[#e30a5f] transition-colors font-fredoka">
            {title}
          </h2>

          <p className="dark:text-gray-400 text-gray-600 mb-4 line-clamp-2 flex-grow">{excerpt}</p>

          <div className="flex items-center justify-between pt-4 dark:border-t dark:border-gray-700 border-t border-gray-200 mt-auto">
            <div className="flex flex-col text-sm">
              <span className="dark:text-gray-500 text-gray-500">{formatDate(date)}</span>
              {author && <span className="dark:text-gray-400 text-gray-600">By {author}</span>}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
