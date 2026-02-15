import { Metadata } from "next";
import { notFound } from "next/navigation";
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
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
        />
      </article>
    </>
  );
}

/** Simple markdown-to-HTML conversion for rendered content */
function markdownToHtml(md: string): string {
  let html = md
    // Code blocks (must come before inline code)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, "<hr />")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Line breaks to paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

  // Wrap in paragraph tags
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");
  // Fix nested block elements inside <p>
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<pre>)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");
  html = html.replace(/<p>(<blockquote>)/g, "$1");
  html = html.replace(/(<\/blockquote>)<\/p>/g, "$1");
  html = html.replace(/<p>(<hr \/>)/g, "$1");
  html = html.replace(/(<hr \/>)<\/p>/g, "$1");
  html = html.replace(/<p>(<li>)/g, "<ul>$1");
  html = html.replace(/(<\/li>)<\/p>/g, "$1</ul>");

  return html;
}
