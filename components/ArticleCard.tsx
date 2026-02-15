import Link from "next/link";
import type { Article } from "@/lib/notion";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group block">
      <article className="rounded-lg border border-gray-200 p-6 transition-colors hover:border-gray-400 hover:bg-gray-50">
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
        <h2 className="mt-2 text-xl font-semibold text-gray-900 group-hover:text-blue-600">
          {article.title}
        </h2>
        {article.description && (
          <p className="mt-2 text-gray-600 line-clamp-2">
            {article.description}
          </p>
        )}
      </article>
    </Link>
  );
}
