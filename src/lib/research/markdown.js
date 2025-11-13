import fs from "fs";
import path from "path";
import matter from "gray-matter";

const researchDirectory = path.join(process.cwd(), "public/research/posts");

export function getResearchSlugs() {
  if (!fs.existsSync(researchDirectory)) {
    return [];
  }
  return fs
    .readdirSync(researchDirectory)
    .filter((file) => file.endsWith(".md"));
}

export function getResearchBySlug(slug) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = path.join(researchDirectory, `${realSlug}.md`);
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

export function getAllResearch() {
  const slugs = getResearchSlugs();
  const research = slugs
    .map((slug) => getResearchBySlug(slug))
    .sort((post1, post2) => new Date(post2.frontmatter.date) - new Date(post1.frontmatter.date));

  return research;
}

export function getRelatedResearch(currentSlug, limit = 3) {
  const allResearch = getAllResearch();
  const currentArticle = allResearch.find((article) => article.slug === currentSlug);

  if (!currentArticle) return [];

  const currentTags = currentArticle.frontmatter.tags || [];

  return allResearch
    .filter((article) => article.slug !== currentSlug)
    .map((article) => ({
      ...article,
      matchCount: (article.frontmatter.tags || []).filter((tag) =>
        currentTags.includes(tag)
      ).length,
    }))
    .filter((article) => article.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit)
    .map(({ matchCount, ...rest }) => rest);
}
