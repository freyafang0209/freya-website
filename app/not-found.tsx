import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-600">This page could not be found.</p>
      <Link
        href="/"
        className="mt-6 text-blue-600 underline hover:text-blue-800"
      >
        Back to home
      </Link>
    </div>
  );
}
