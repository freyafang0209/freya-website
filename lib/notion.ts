import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type {
  PageObjectResponse,
  RichTextItemResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

const PARENT_PAGE_ID = process.env.NOTION_DATABASE_ID!;

export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  lastEdited: string;
  cover: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function getTitle(page: PageObjectResponse): string {
  const prop = page.properties["Name"] || page.properties["Title"] || page.properties["title"];
  if (prop?.type === "title") {
    return (prop.title as RichTextItemResponse[])
      .map((t) => t.plain_text)
      .join("");
  }
  return "Untitled";
}

function getDescription(page: PageObjectResponse): string {
  const prop = page.properties["Description"];
  if (prop?.type === "rich_text") {
    return (prop.rich_text as RichTextItemResponse[])
      .map((t) => t.plain_text)
      .join("");
  }
  return "";
}

function getCover(page: PageObjectResponse): string | null {
  if (page.cover?.type === "external") {
    return page.cover.external.url;
  }
  if (page.cover?.type === "file") {
    return page.cover.file.url;
  }
  return null;
}

export async function getArticles(): Promise<Article[]> {
  // Get child blocks of the parent page to find child_page blocks
  const blocks = await notion.blocks.children.list({
    block_id: PARENT_PAGE_ID,
    page_size: 100,
  });

  // Find all child_page blocks (these are the articles)
  const childPageBlocks = blocks.results.filter(
    (block): block is BlockObjectResponse =>
      "type" in block && block.type === "child_page"
  );

  // Fetch full page data for each child page
  const articles: Article[] = [];
  for (const block of childPageBlocks) {
    try {
      const page = await notion.pages.retrieve({ page_id: block.id });
      if (!("properties" in page)) continue;
      const fullPage = page as PageObjectResponse;
      const title = getTitle(fullPage);

      // Skip section pages like "Insights" that aren't real articles
      // Articles typically have longer titles
      if (title.length < 10) continue;

      articles.push({
        id: fullPage.id,
        title,
        slug: slugify(title),
        description: getDescription(fullPage),
        date: fullPage.created_time.split("T")[0],
        lastEdited: fullPage.last_edited_time,
        cover: getCover(fullPage),
      });
    } catch {
      // Skip pages that can't be retrieved
    }
  }

  // Also search for any sub-pages under child pages (e.g., articles inside "Insights")
  for (const block of childPageBlocks) {
    try {
      const subBlocks = await notion.blocks.children.list({
        block_id: block.id,
        page_size: 100,
      });
      const subPages = subBlocks.results.filter(
        (b): b is BlockObjectResponse =>
          "type" in b && b.type === "child_page"
      );
      for (const subPage of subPages) {
        try {
          const page = await notion.pages.retrieve({ page_id: subPage.id });
          if (!("properties" in page)) continue;
          const fullPage = page as PageObjectResponse;
          const title = getTitle(fullPage);
          articles.push({
            id: fullPage.id,
            title,
            slug: slugify(title),
            description: getDescription(fullPage),
            date: fullPage.created_time.split("T")[0],
            lastEdited: fullPage.last_edited_time,
            cover: getCover(fullPage),
          });
        } catch {
          // Skip
        }
      }
    } catch {
      // Skip
    }
  }

  // Sort by date descending
  articles.sort((a, b) => b.date.localeCompare(a.date));

  return articles;
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug);
}

export async function getArticleContent(pageId: string): Promise<string> {
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);
  return mdString.parent;
}
