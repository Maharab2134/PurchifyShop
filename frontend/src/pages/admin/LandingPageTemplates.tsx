import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImageIcon, Plus } from "lucide-react";
import { adminApi, type AdminLandingPageTemplate } from "@/api/admin";
import useToast from "@/hooks/useToast";

export default function LandingPageTemplates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminLandingPageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.landingPageTemplates.list({ limit: 200 });
      setItems(res.data.data?.templates ?? []);
    } catch {
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Landing Page Templates
        </h1>
        <button
          type="button"
          onClick={() => navigate("/dashboard/marketing/templates/new")}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Template
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-500 dark:text-slate-400">
          Loading templates...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            No templates found. Create your first template.
          </p>
          <Link
            to="/dashboard/marketing/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" /> Create Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                navigate(`/dashboard/marketing/templates/${item.id}/edit`)
              }
              className="text-left rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {item.previewImage ? (
                  <img
                    src={item.previewImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="px-4 py-3.5">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {item.name}
                </h2>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${
                      item.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    ID: {item.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
