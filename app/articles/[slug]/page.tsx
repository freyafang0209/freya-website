import { Metadata } from "next";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { getArticles, getArticleBySlug, getArticleContent } from "@/lib/notion";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const articles = await getArticles();
    return articles.map((article) => ({ slug: article.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "Article Not Found" };

  const siteUrl = process.env.SITE_URL || "https://example.com";

  return {
    title: article.title,
    description: article.description || `Read "${article.title}" on HigherEd Signals.`,
    openGraph: {
      title: article.title,
      description: article.description || `Read "${article.title}" on HigherEd Signals.`,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.lastEdited,
      ...(article.cover && { images: [{ url: article.cover }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
    alternates: {
      canonical: `${siteUrl}/articles/${article.slug}`,
    },
  };
}

/** Notion sometimes inserts line breaks inside table cells, breaking markdown tables.
 *  This rejoins split table rows so `marked` can parse them correctly. */
function fixBrokenTables(md: string): string {
  const lines = md.split("\n");
  const fixed: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // A line that starts with | but doesn't end with | is a broken table row
    if (line.startsWith("|") && !line.trimEnd().endsWith("|")) {
      // Concatenate following lines until we find one ending with |
      let joined = line;
      while (i + 1 < lines.length && !joined.trimEnd().endsWith("|")) {
        i++;
        joined += " " + lines[i].trim();
      }
      fixed.push(joined);
    } else {
      fixed.push(line);
    }
  }
  return fixed.join("\n");
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const content = await getArticleContent(article.id);

  const siteUrl = process.env.SITE_URL || "https://example.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.lastEdited,
    publisher: {
      "@type": "Organization",
      name: "HigherEd Signals",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/articles/${article.slug}`,
    },
    ...(article.cover && { image: article.cover }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <header className="mb-8">
          <time
            dateTime={article.date}
            className="text-sm text-gray-500"
          >
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {article.title}
          </h1>
          {article.description && (
            <p className="mt-3 text-lg text-gray-600">
              {article.description}
            </p>
          )}
        </header>
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: marked.parse(fixBrokenTables(content)) as string }}
        />
      </article>
    </>
  );
}

