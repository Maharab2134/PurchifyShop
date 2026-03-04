import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import { pagesApi, type PublicPage } from "@/api/pages";
import { API_BASE_URL } from "@/lib/config";
import he from "he";

// Helper to convert storage path to full image URL
const assetUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base =
    API_BASE_URL.replace(/\/api\/v1$/, "") || "http://localhost:8000";
  return `${base}/storage/${path.replace(/^\//, "")}`;
};

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PublicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Page not found");
      return;
    }

    setLoading(true);
    setError(null);

    pagesApi
      .getBySlug(slug)
      .then((res) => {
        setPage(res.data.data.page ?? null);
      })
      .catch(() => {
        setPage(null);
        setError("Page not found");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Page not found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              The page you are looking for does not exist or is inactive.
            </p>
          </div>
        )}

        {!loading && !error && page && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
            <div
              className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2
                [&_div[align='center']]:text-center [&_div[align='left']]:text-left [&_div[align='right']]:text-right [&_div[align='justify']]:text-justify"
              dangerouslySetInnerHTML={{ __html: he.decode(page.title) }}
            />
            {page.description && (
              <p
                className="text-gray-600 dark:text-gray-400 mb-6"
                dangerouslySetInnerHTML={{
                  __html: he.decode(page.description),
                }}
              />
            )}

            {page.images && page.images.length > 0 && (
              <div className="mb-8">
                <div className="space-y-4">
                  {page.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={assetUrl(image)}
                      alt={`Page image ${idx + 1}`}
                      className="w-full max-w-4xl mx-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow object-contain"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 dark:text-gray-300">
              {page.content?.trim() ? (
                <div
                  dangerouslySetInnerHTML={{ __html: he.decode(page.content) }}
                  className="[&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2 
                    [&_div[align='center']]:text-center [&_div[align='left']]:text-left [&_div[align='right']]:text-right [&_div[align='justify']]:text-justify
                    [&_p[align='center']]:text-center [&_p[align='left']]:text-left [&_p[align='right']]:text-right [&_p[align='justify']]:text-justify
                    [&_h1[align='center']]:text-center [&_h1[align='left']]:text-left [&_h1[align='right']]:text-right [&_h1[align='justify']]:text-justify
                    [&_h2[align='center']]:text-center [&_h2[align='left']]:text-left [&_h2[align='right']]:text-right [&_h2[align='justify']]:text-justify
                    [&_h3[align='center']]:text-center [&_h3[align='left']]:text-left [&_h3[align='right']]:text-right [&_h3[align='justify']]:text-justify
                    [&_br]:block
                    dark:[&_*]:text-gray-300! dark:[&_h1]:text-gray-100! dark:[&_h2]:text-gray-100! dark:[&_h3]:text-gray-100! dark:[&_h4]:text-gray-100! dark:[&_h5]:text-gray-100! dark:[&_h6]:text-gray-100!
                    dark:[&_strong]:text-gray-200! dark:[&_b]:text-gray-200!"
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No content available.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
