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
        <p className="mt-2 text-lg font-medium text-gray-700">
          Research-informed commentary and conceptual frameworks on higher education enrollment strategy, international student demand, and decision-making in volatile policy environments.
        </p>
        <p className="mt-3 text-gray-600">
          HigherEd Signals publishes research-style commentary on how universities interpret early demand signals, manage enrollment risk, and adapt strategy in uncertain global markets. The focus is on behavior-based indicators, enrollment forecasting, and practical frameworks that help institutions act before late-cycle data becomes available.
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
