import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, type AdminLandingPage } from "@/api/admin";
import useToast from "@/hooks/useToast";
import { toImageUrl } from "@/utils/imageUrl";

export default function AdminLandingPages() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminLandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.landingPages.list({ limit: 200 });
      setItems(res.data.data?.landingPages ?? []);
    } catch {
      showToast("Failed to load landing pages", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    const ok = window.confirm(`Delete landing page \"${target.title}\"?`);
    if (!ok) return;

    try {
      await adminApi.landingPages.delete(id);
      await load();
      showToast("Landing page deleted", "success");
    } catch {
      showToast("Could not delete landing page", "error");
    }
  };

  const handleCopyLink = async (slug: string) => {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    const url = `${origin}/landing.php?slug=${encodeURIComponent(slug)}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast("Landing page link copied", "success");
    } catch {
      showToast("Could not copy landing page link", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Landing Pages
        </h1>
        <button
          type="button"
          onClick={() => navigate("/dashboard/marketing/landing-pages/new")}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Page
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-500 dark:text-slate-400">
          Loading landing pages...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            No landing pages found. Create your first page.
          </p>
          <Link
            to="/dashboard/marketing/landing-pages/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" /> Start Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800">
                    {item.productImage || item.thumbnail ? (
                      <img
                        src={toImageUrl(
                          item.productImage || item.thumbnail || "",
                        )}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(135deg, ${item.primaryColor}, #111827)`,
                        }}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {item.title}
                    </h2>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <a
                        href={`/landing.php?slug=${encodeURIComponent(item.slug)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        /landing.php?slug={item.slug}
                      </a>
                      <span>• View Count: {item.viewCount}</span>
                      <span>• Template: {item.template}</span>
                      {item.productName && (
                        <span>• Product: {item.productName}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(item.slug)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                    aria-label="Copy landing page link"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/marketing/landing-pages/${item.id}/edit`,
                      )
                    }
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                    aria-label="Edit landing page"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40"
                    aria-label="Delete landing page"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
