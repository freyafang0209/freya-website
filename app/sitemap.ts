import { MetadataRoute } from "next";
import { getArticles, Article } from "@/lib/notion";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || "https://example.com";

  let articles: Article[] = [];
  try {
    articles = await getArticles();
  } catch {
    // Notion API not configured yet
  }

  const articleEntries = articles.map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: new Date(article.lastEdited),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...articleEntries,
  ];
}
