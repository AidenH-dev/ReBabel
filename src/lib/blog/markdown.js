import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "public/blog/posts");

export function getPostSlugs() {
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md"));
}

export function getPostBySlug(slug) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // Convert date to string for JSON serialization
  const frontmatter = {
    ...data,
    date: data.date instanceof Date ? data.date.toISOString() : data.date,
  };

  return {
    slug: realSlug,
    frontmatter,
    content,
  };
}

export function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .sort((post1, post2) => new Date(post2.frontmatter.date) - new Date(post1.frontmatter.date));

  return posts;
}

export function getRelatedPosts(currentSlug, limit = 3) {
  const allPosts = getAllPosts();
  const currentPost = allPosts.find((post) => post.slug === currentSlug);

  if (!currentPost) return [];

  const currentTags = currentPost.frontmatter.tags || [];

  return allPosts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => ({
      ...post,
      matchCount: (post.frontmatter.tags || []).filter((tag) =>
        currentTags.includes(tag)
      ).length,
    }))
    .filter((post) => post.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit)
    .map(({ matchCount, ...rest }) => rest);
}
