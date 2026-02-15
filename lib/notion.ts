import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

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
  const prop = page.properties["Name"] || page.properties["Title"];
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

function getDate(page: PageObjectResponse): string {
  const prop = page.properties["Date"];
  if (prop?.type === "date" && prop.date?.start) {
    return prop.date.start;
  }
  return page.created_time.split("T")[0];
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
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "Status",
      status: {
        equals: "Published",
      },
    },
    sorts: [
      {
        timestamp: "created_time",
        direction: "descending",
      },
    ],
  });

  return response.results
    .filter((page): page is PageObjectResponse => "properties" in page)
    .map((page) => {
      const title = getTitle(page);
      return {
        id: page.id,
        title,
        slug: slugify(title),
        description: getDescription(page),
        date: getDate(page),
        lastEdited: page.last_edited_time,
        cover: getCover(page),
      };
    });
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
