import { getArticles, Article } from "@/lib/notion";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value?: string | Date): string {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
}

type UrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

function buildXml(entries: UrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
      ];
      if (entry.lastmod) {
        lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }
      if (entry.changefreq) {
        lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      if (typeof entry.priority === "number") {
        lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      }
      lines.push("  </url>");
      return lines.join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");
}

export async function GET(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const siteUrl = process.env.SITE_URL || origin;

  let articles: Article[] = [];
  try {
    articles = await getArticles();
  } catch {
    // Notion API not configured yet
  }

  const entries: UrlEntry[] = [
    {
      loc: siteUrl,
      lastmod: toIsoDate(),
      changefreq: "daily",
      priority: 1,
    },
    ...articles.map((article) => ({
      loc: `${siteUrl}/articles/${article.slug}`,
      lastmod: toIsoDate(article.lastEdited),
      changefreq: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const xml = buildXml(entries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
