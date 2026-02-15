import { getArticles, Article } from "@/lib/notion";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 60;

export default async function HomePage() {
  let articles: Article[] = [];
  try {
    articles = await getArticles();
  } catch {
    // Notion API not configured yet — show empty state
  }

  return (
    <>
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          HigherEd Signals
        </h1>
        <p className="mt-2 text-gray-600">
          Insights and analysis on trends shaping higher education.
        </p>
      </section>

      {articles.length === 0 ? (
        <p className="text-gray-500">
          No articles yet. Connect your Notion database to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}
