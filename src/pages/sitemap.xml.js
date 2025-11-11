import { getAllPosts } from '@/lib/blog/markdown';

function generateSiteMap(posts) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://rebabel.org</loc>
       <lastmod>2025-01-15</lastmod>
       <changefreq>weekly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>https://rebabel.org/blog</loc>
       <lastmod>2025-01-15</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>https://rebabel.org/help</loc>
       <lastmod>2025-01-15</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     ${posts
       .map(({ slug, frontmatter }) => {
         return `
     <url>
       <loc>${`https://rebabel.org/blog/${slug}`}</loc>
       <lastmod>${frontmatter.date}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
   `;
       })
       .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }) {
  const posts = getAllPosts();
  const sitemap = generateSiteMap(posts);

  res.setHeader('Content-Type', 'text/xml');
  // we send the XML to the browser
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
