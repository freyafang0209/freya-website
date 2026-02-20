import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const SITE_URL =
  process.env.SITE_URL || "https://higher-education-signals.vercel.app";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PARENT_PAGE_ID = process.env.NOTION_DATABASE_ID;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function getTitle(page) {
  const prop =
    page.properties["Name"] ||
    page.properties["Title"] ||
    page.properties["title"];
  if (prop?.type === "title") {
    return prop.title.map((t) => t.plain_text).join("");
  }
  return "Untitled";
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getArticles() {
  const blocks = await notion.blocks.children.list({
    block_id: PARENT_PAGE_ID,
    page_size: 100,
  });

  const childPageBlocks = blocks.results.filter(
    (block) => "type" in block && block.type === "child_page"
  );

  const articles = [];

  for (const block of childPageBlocks) {
    try {
      const page = await notion.pages.retrieve({ page_id: block.id });
      if (!("properties" in page)) continue;
      const title = getTitle(page);
      if (title.length < 10) continue;
      articles.push({
        slug: slugify(title),
        lastEdited: page.last_edited_time,
      });
    } catch {
      // skip
    }
  }

  for (const block of childPageBlocks) {
    try {
      const subBlocks = await notion.blocks.children.list({
        block_id: block.id,
        page_size: 100,
      });
      const subPages = subBlocks.results.filter(
        (b) => "type" in b && b.type === "child_page"
      );
      for (const subPage of subPages) {
        try {
          const page = await notion.pages.retrieve({ page_id: subPage.id });
          if (!("properties" in page)) continue;
          const title = getTitle(page);
          articles.push({
            slug: slugify(title),
            lastEdited: page.last_edited_time,
          });
        } catch {
          // skip
        }
      }
    } catch {
      // skip
    }
  }

  return articles;
}

async function main() {
  console.log("Generating sitemap...");
  let articles = [];
  try {
    articles = await getArticles();
  } catch (err) {
    console.warn("Warning: Could not fetch articles from Notion:", err.message);
    console.warn("Generating sitemap with homepage only.");
  }

  const urls = [
    `  <url>
    <loc>${escapeXml(SITE_URL)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ...articles.map(
      (a) => `  <url>
    <loc>${escapeXml(`${SITE_URL}/articles/${a.slug}`)}</loc>
    <lastmod>${new Date(a.lastEdited).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  writeFileSync("public/sitemap.xml", xml);
  console.log(`Sitemap generated with ${urls.length} URLs`);
}

main().catch((err) => {
  console.error("Failed to generate sitemap:", err.message);
  console.error("Build will continue without sitemap.");
});
