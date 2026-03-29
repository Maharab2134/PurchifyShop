import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Save, X } from "lucide-react";
import { adminApi } from "@/api/admin";
import useToast from "@/hooks/useToast";

type FormValues = {
  name: string;
  slug: string;
  isActive: boolean;
  htmlStructure: string;
  customCss: string;
  customJavascript: string;
  previewImage: string;
};

const DEFAULT_FORM: FormValues = {
  name: "",
  slug: "",
  isActive: true,
  htmlStructure: `<div class=\"product-card\">\n  <div class=\"product-image\">\n    <img src=\"{{image}}\" alt=\"{{title}}\" class=\"full rounded-xl shadow-lg\" />\n  </div>\n  <div class=\"product-details\">\n    <h1 class=\"text-xl font-bold\">{{title}}</h1>\n    <p class=\"text-desc\">{{description}}</p>\n    <p class=\"buy-price\">৳{{price}}</p>\n    <a href=\"{{checkout_link}}\" class=\"btn-primary\">Order Now</a>\n  </div>\n</div>`,
  customCss: `.product-card {\n  border-radius: 20px;\n  background: #fff;\n  padding: 16px;\n}\n\n.text-desc {\n  color: #64748b;\n}\n\n.btn-primary {\n  background-color: {{primary_color}};\n  color: #fff;\n}`,
  customJavascript: `console.log(\"Landing page loaded\");`,
  previewImage: "",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function LandingPageTemplateForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!isEditMode || !id) return;

    setLoading(true);
    adminApi.landingPageTemplates
      .get(id)
      .then((res) => {
        const data = res.data.data;
        setForm({
          name: data.name,
          slug: data.slug,
          isActive: data.isActive,
          htmlStructure: data.htmlStructure || "",
          customCss: data.customCss || "",
          customJavascript: data.customJavascript || "",
          previewImage: data.previewImage || "",
        });
      })
      .catch(() => {
        showToast("Template not found", "error");
        navigate("/dashboard/marketing/templates", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, isEditMode, navigate, showToast]);

  const updateField = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onNameBlur = () => {
    if (!form.name || form.slug) return;
    updateField("slug", slugify(form.name));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("Template name is required", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      isActive: form.isActive,
      htmlStructure: form.htmlStructure,
      customCss: form.customCss,
      customJavascript: form.customJavascript,
      previewImage: form.previewImage.trim() || undefined,
    };

    try {
      if (isEditMode && id) {
        await adminApi.landingPageTemplates.update(id, payload);
        showToast("Template updated", "success");
      } else {
        await adminApi.landingPageTemplates.create(payload);
        showToast("Template created", "success");
      }
      navigate("/dashboard/marketing/templates");
    } catch {
      showToast("Could not save template", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/dashboard/marketing/templates"
          className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold">
            {isEditMode ? "Edit Template" : "New Template"}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm"
          >
            <BookOpen className="w-4 h-4" /> Guide
          </button>
          <button
            type="submit"
            form="template-form"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Save Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500 dark:text-slate-400">
          Loading template...
        </div>
      ) : (
        <form id="template-form" onSubmit={onSubmit} className="space-y-4">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Template Name
                </span>
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  onBlur={onNameBlur}
                  placeholder="e.g. Classic Sales Page"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-950"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block col-span-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Slug
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      updateField("slug", slugify(e.target.value))
                    }
                    placeholder="classic-sales-page"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-950"
                  />
                </label>
                <label className="block col-span-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Status
                  </span>
                  <select
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      updateField("isActive", e.target.value === "active")
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-950"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <label className="block mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                HTML Structure
              </span>
              <textarea
                value={form.htmlStructure}
                onChange={(e) => updateField("htmlStructure", e.target.value)}
                rows={12}
                className="mt-1 w-full font-mono text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-900 text-slate-100"
              />
            </label>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <label className="block mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Custom CSS
              </span>
              <textarea
                value={form.customCss}
                onChange={(e) => updateField("customCss", e.target.value)}
                rows={10}
                className="mt-1 w-full font-mono text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-900 text-slate-100"
              />
            </label>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <label className="block mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Custom JavaScript
              </span>
              <textarea
                value={form.customJavascript}
                onChange={(e) =>
                  updateField("customJavascript", e.target.value)
                }
                rows={8}
                className="mt-1 w-full font-mono text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-900 text-slate-100"
              />
            </label>
          </section>
        </form>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close template guide"
            onClick={() => setShowGuide(false)}
            className="absolute inset-0 bg-black/30"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" /> Template Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-sm">
              <section className="rounded-lg border border-violet-100 dark:border-violet-900/40 bg-violet-50/70 dark:bg-violet-900/10 p-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Available Placeholders
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "{{title}}",
                    "{{description}}",
                    "{{price}}",
                    "{{old_price}}",
                    "{{image}}",
                    "{{video_url}}",
                    "{{primary_color}}",
                    "{{checkout_link}}",
                  ].map((key) => (
                    <span
                      key={key}
                      className="px-2 py-1 rounded-md text-xs font-mono bg-violet-600 text-white"
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/10 p-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Special Features
                </h4>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc pl-4">
                  <li>Image gallery block with main image and thumbs</li>
                  <li>{"Checkout form action using {{checkout_link}}"}</li>
                  <li>{"Dynamic theme color with {{primary_color}}"}</li>
                </ul>
              </section>

              <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Basic Structure
                </h4>
                <pre className="text-xs leading-5 bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">
                  {`<div class="container">
  <h1>{{title}}</h1>
  <p>{{description}}</p>
  <img src="{{image}}" />
  <p>{{price}}</p>
  <a href="{{checkout_link}}">Order</a>
</div>`}
                </pre>
              </section>

              <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Color Example
                </h4>
                <pre className="text-xs leading-5 bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">
                  {`.btn-primary {
  background: {{primary_color}};
  color: #fff;
}`}
                </pre>
              </section>

              <section className="rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/10 p-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Best Practices
                </h4>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc pl-4">
                  <li>Use relative media paths or full URLs for assets.</li>
                  <li>Keep CSS focused to avoid global style collisions.</li>
                  <li>Access data from window.LANDING_PAGE_DATA in JS.</li>
                </ul>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
