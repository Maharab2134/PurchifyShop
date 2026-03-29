import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, WandSparkles } from "lucide-react";
import {
  adminApi,
  type AdminLandingPageTemplate,
  type AdminProduct,
} from "@/api/admin";
import useToast from "@/hooks/useToast";

type FormValues = {
  title: string;
  slug: string;
  templateId: string;
  template: string;
  productId: string;
  heroHeadline: string;
  heroText: string;
  videoUrl: string;
  primaryColor: string;
};

const DEFAULT_FORM: FormValues = {
  title: "",
  slug: "",
  templateId: "",
  template: "",
  productId: "",
  heroHeadline: "",
  heroText: "",
  videoUrl: "",
  primaryColor: "#F97316",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function AdminLandingPageForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [templates, setTemplates] = useState<AdminLandingPageTemplate[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingPage(true);
    adminApi.landingPages
      .get(id)
      .then((res) => {
        const existing = res.data.data;
        setForm({
          title: existing.title,
          slug: existing.slug,
          templateId: existing.templateId || "",
          template: existing.templateName || existing.template || "",
          productId: existing.productId || "",
          heroHeadline: existing.heroHeadline || "",
          heroText: existing.heroText || "",
          videoUrl: existing.videoUrl || "",
          primaryColor: existing.primaryColor || "#F97316",
        });
      })
      .catch(() => {
        showToast("Landing page not found", "error");
        navigate("/dashboard/marketing/landing-pages", { replace: true });
      })
      .finally(() => setLoadingPage(false));
  }, [id, isEditMode, navigate, showToast]);

  useEffect(() => {
    setLoadingProducts(true);
    adminApi.products
      .list({ limit: 200 })
      .then((res) => setProducts(res.data.data?.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    setLoadingTemplates(true);
    adminApi.landingPageTemplates
      .list({ limit: 200 })
      .then((res) => setTemplates(res.data.data?.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const updateField = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onTitleBlur = () => {
    if (!form.title || form.slug) return;
    updateField("slug", slugify(form.title));
  };

  const selectedProductThumbnail = useMemo(() => {
    if (!form.productId) return undefined;
    const target = products.find((p) => p.id === form.productId);
    return target?.images?.[0];
  }, [form.productId, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      showToast("Page title is required", "error");
      return;
    }
    if (!form.slug.trim()) {
      showToast("URL slug is required", "error");
      return;
    }
    if (!form.templateId.trim()) {
      showToast("Template selection is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: slugify(form.slug),
        templateId: form.templateId,
        template: form.template,
        productId: form.productId || null,
        heroHeadline: form.heroHeadline.trim() || undefined,
        heroText: form.heroText.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        primaryColor: form.primaryColor,
        thumbnail: selectedProductThumbnail,
      };

      if (isEditMode && id) {
        await adminApi.landingPages.update(id, payload);
        showToast("Landing page updated", "success");
      } else {
        await adminApi.landingPages.create(payload);
        showToast("Landing page generated", "success");
      }

      navigate("/dashboard/marketing/landing-pages");
    } catch {
      showToast("Could not save landing page", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <Link
          to="/dashboard/marketing/landing-pages"
          className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {isEditMode ? "Edit Landing Page" : "Create Landing Page"}
          </span>
        </Link>

        <button
          type="submit"
          form="landing-page-form"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md disabled:opacity-60"
        >
          {isEditMode ? (
            <Pencil className="w-5 h-5" />
          ) : (
            <WandSparkles className="w-5 h-5" />
          )}
          {isEditMode ? "Update Page" : "Generate Page"}
        </button>
      </div>

      {loadingPage ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500 dark:text-slate-400">
          Loading landing page...
        </div>
      ) : (
        <form
          id="landing-page-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm">
                1
              </span>
              Basic Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Page Title
                </span>
                <input
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  onBlur={onTitleBlur}
                  placeholder="e.g., Summer Sale Deal"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  URL Slug
                </span>
                <div className="mt-1 flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950">
                  <span className="px-3 py-2.5 text-slate-500 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    /landing.php?slug=
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      updateField("slug", slugify(e.target.value))
                    }
                    placeholder="summer-sale"
                    className="flex-1 px-3 py-2.5 bg-transparent"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm">
                2
              </span>
              Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Template
                </span>
                <select
                  value={form.templateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const selected = templates.find((tpl) => tpl.id === id);
                    updateField("templateId", id);
                    updateField("template", selected?.name || "");
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5"
                  disabled={loadingTemplates}
                >
                  <option value="">-- Choose Template --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Product
                </span>
                <select
                  value={form.productId}
                  onChange={(e) => updateField("productId", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5"
                  disabled={loadingProducts}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm">
                3
              </span>
              Content Customization
            </h2>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Hero Headline
                </span>
                <input
                  value={form.heroHeadline}
                  onChange={(e) => updateField("heroHeadline", e.target.value)}
                  placeholder="Grab this amazing deal now!"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Hero Text / Subheadline
                </span>
                <textarea
                  value={form.heroText}
                  onChange={(e) => updateField("heroText", e.target.value)}
                  placeholder="Short description regarding the offer..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Video URL (Embed/YouTube)
                  </span>
                  <input
                    value={form.videoUrl}
                    onChange={(e) => updateField("videoUrl", e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Primary Color
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1.5 bg-white dark:bg-slate-950">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) =>
                        updateField("primaryColor", e.target.value)
                      }
                      className="h-10 w-12 rounded cursor-pointer"
                    />
                    <input
                      value={form.primaryColor}
                      onChange={(e) =>
                        updateField("primaryColor", e.target.value)
                      }
                      className="flex-1 bg-transparent"
                    />
                  </div>
                </label>
              </div>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
