import { useEffect, useState, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { Plus, Pencil, Trash2, FileText, HelpCircle } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Modal from "@/components/common/Modal";
import Button from "@/components/atoms/Button";
import ImageUpload from "@/components/admin/ImageUpload";
import { adminApi, type AdminPage } from "@/api/admin";
import useToast from "@/hooks/useToast";

type FormValues = {
  title: string;
  slug: string;
  description: string;
  content: string;
  images?: string[] | null;
  isActive: boolean;
};

type FAQItem = { question: string; answer: string };

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// Helper to decode HTML entities and strip tags
const decodeAndStripHtml = (html: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  const decoded = textarea.value;
  return decoded.replace(/<[^>]*>/g, "");
};

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command: string, commandValue?: string) => {
    if (typeof document === "undefined") return;
    document.execCommand(command, false, commandValue);
    const el = editorRef.current;
    if (el) {
      onChange(el.innerHTML);
    }
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    exec("createLink", url);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      exec("insertImage", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          U
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => exec("formatBlock", "H1")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "H2")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "H3")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "P")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          P
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => exec("justifyLeft")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => exec("justifyCenter")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Center
        </button>
        <button
          type="button"
          onClick={() => exec("justifyRight")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Right
        </button>
        <button
          type="button"
          onClick={() => exec("justifyFull")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Justify
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "BLOCKQUOTE")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Quote
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={handleLink}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Link
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Image
        </button>
        <button
          type="button"
          onClick={() => exec("removeFormat")}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          Clear
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        onBlur={() => onChange(editorRef.current?.innerHTML || "")}
        className="min-h-[220px] max-h-[420px] overflow-y-auto p-3 text-sm text-gray-800 outline-none prose prose-sm max-w-none"
        data-placeholder={placeholder}
      />
    </div>
  );
}

export default function AdminPages() {
  const { showToast } = useToast();
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPage | null>(null);
  const [deleting, setDeleting] = useState<AdminPage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      images: null,
      isActive: true,
    },
  });

  // Generate URL-friendly slug from title
  const generateSlug = useCallback((text: string): string => {
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, "");
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    return cleanText
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }, []);

  // Watch title and auto-generate slug if slug is empty
  const titleValue = form.watch("title");
  const slugValue = form.watch("slug");

  useEffect(() => {
    if (titleValue) {
      const autoSlug = generateSlug(titleValue);
      form.setValue("slug", autoSlug, { shouldValidate: false });
    }
  }, [titleValue, generateSlug, form]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.pages.list({
        limit: 200,
        search: search || undefined,
      });
      setPages(res.data.data?.pages ?? []);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to load";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (editing) {
      form.reset({
        title: editing.title,
        slug: editing.slug,
        description: editing.description ?? "",
        content: editing.content ?? "",
        images: editing.images ?? null,
        isActive: editing.isActive ?? true,
      });
      if (
        (editing.slug || "").toLowerCase().trim() === "faq" &&
        editing.content?.trim()
      ) {
        try {
          const parsed = JSON.parse(editing.content) as FAQItem[];
          setFaqItems(
            Array.isArray(parsed)
              ? parsed.map((x) => ({
                  question: x?.question ?? "",
                  answer: x?.answer ?? "",
                }))
              : [],
          );
        } catch {
          setFaqItems([]);
        }
      } else {
        setFaqItems([]);
      }
    }
  }, [editing, form]);

  const isFaqPage =
    (form.watch("slug") || "")
      .replace(/<[^>]*>/g, "")
      .toLowerCase()
      .trim() === "faq";

  const onAdd = form.handleSubmit(async (data) => {
    if (!data.title?.trim()) {
      showToast("Title is required.", "error");
      return;
    }
    const slug = (data.slug || "")
      .replace(/<[^>]*>/g, "")
      .trim()
      .toLowerCase();
    const content =
      slug === "faq"
        ? JSON.stringify(faqItems)
        : data.content?.trim() || undefined;
    setSubmitting(true);
    try {
      await adminApi.pages.create({
        title: data.title.trim(),
        slug: data.slug?.trim() || undefined,
        description: data.description?.trim() || undefined,
        content: content || undefined,
        images: data.images ?? undefined,
        isActive: data.isActive ?? true,
      });
      showToast("Page created.", "success");
      setAddOpen(false);
      form.reset({
        title: "",
        slug: "",
        description: "",
        content: "",
        images: null,
        isActive: true,
      });
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Create failed";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  });

  const onEdit = form.handleSubmit(async (data) => {
    if (!editing) return;
    if (!data.title?.trim()) {
      showToast("Title is required.", "error");
      return;
    }
    const slug = (data.slug || "")
      .replace(/<[^>]*>/g, "")
      .trim()
      .toLowerCase();
    const content =
      slug === "faq"
        ? JSON.stringify(faqItems)
        : data.content?.trim() || undefined;
    setSubmitting(true);
    try {
      await adminApi.pages.update(editing.id, {
        title: data.title.trim(),
        slug: data.slug?.trim() || undefined,
        description: data.description?.trim() || undefined,
        content: content || undefined,
        images: data.images ?? undefined,
        isActive: data.isActive ?? true,
      });
      showToast("Page updated.", "success");
      setEditing(null);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Update failed";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  });

  const onDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await adminApi.pages.delete(deleting.id);
      showToast("Page deleted.", "success");
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Delete failed";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Pages
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Create pages like footer, about-us, FAQ (slug: faq), etc. Use
              description for promotion or short text.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="Search pages..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 text-sm w-full sm:w-64"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => load()}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              Search
            </button>
            <Button
              type="button"
              onClick={() => {
                setAddOpen(true);
                setFaqItems([]);
                form.reset({
                  title: "",
                  slug: "",
                  description: "",
                  content: "",
                  images: null,
                  isActive: true,
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-sm hover:shadow transition-all"
            >
              <Plus size={18} />
              Add Page
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        </div>
      )}

      {!loading && !error && pages.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-6">
            <FileText
              className="text-indigo-600 dark:text-indigo-400"
              size={36}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No pages yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get started by creating your first page. Add content for footer,
            about us, FAQ (use slug{" "}
            <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm">
              faq
            </code>{" "}
            for the FAQ page at /faq), or any other information pages.
          </p>
          <Button
            type="button"
            onClick={() => {
              setAddOpen(true);
              setFaqItems([]);
              form.reset({
                title: "",
                slug: "",
                description: "",
                content: "",
                images: null,
                isActive: true,
              });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-sm hover:shadow transition-all"
          >
            <Plus size={18} />
            Create First Page
          </Button>
        </div>
      )}

      {!loading && !error && pages.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Title
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Slug
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                          <FileText
                            className="text-indigo-600 dark:text-indigo-400"
                            size={20}
                          />
                        </div>
                        <div>
                          <div
                            className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-1 [&_div[align='center']]:text-center [&_div[align='left']]:text-left [&_div[align='right']]:text-right [&_div[align='justify']]:text-justify"
                            dangerouslySetInnerHTML={{ __html: p.title }}
                          />
                          {p.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                              {decodeAndStripHtml(p.description).length > 100
                                ? decodeAndStripHtml(p.description).slice(
                                    0,
                                    100,
                                  ) + "..."
                                : decodeAndStripHtml(p.description)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm font-mono">
                        /{p.slug}
                      </code>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          p.isActive
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination placeholder */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pages.length} of {pages.length} pages
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                Previous
              </button>
              <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                1
              </button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit - Updated styling */}
      {(addOpen || editing) && (
        <Modal
          open={true}
          onClose={() => (addOpen ? setAddOpen(false) : setEditing(null))}
          title={
            addOpen
              ? "Create New Page"
              : `Edit: ${editing?.title.replace(/<[^>]*>/g, "")}`
          }
          size="xl"
        >
          <form onSubmit={addOpen ? onAdd : onEdit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="title"
                  control={form.control}
                  rules={{ required: "Title is required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="e.g. Footer, About Us"
                      />
                      {fieldState.error && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Slug
                </label>
                <div className="relative">
                  <Controller
                    name="slug"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        {...field}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 bg-gray-50"
                        placeholder="Auto-generated from title"
                        readOnly
                      />
                    )}
                  />
                  <svg
                    className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  <Controller
                    name="isActive"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="sr-only"
                        />
                        <label
                          htmlFor="isActive"
                          className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${field.value ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${field.value ? "translate-x-6" : ""}`}
                          />
                        </label>
                      </div>
                    )}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {form.watch("isActive") ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                {" "}
                <Controller
                  name="images"
                  control={form.control}
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      label="Page Images"
                      maxFiles={5}
                      folder="utility"
                      deleteConfig={{
                        ownerType: "settings",
                        ownerId: editing?.id,
                        field: "images",
                      }}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                {" "}
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Description / Promotion
                </label>
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Short text or promotion for this page..."
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                {isFaqPage ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-5 h-5 text-indigo-500" />
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                        FAQ items (Question & Answer)
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      This page will be shown at{" "}
                      <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        /faq
                      </code>
                      . Add questions and answers below.
                    </p>
                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                      {faqItems.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFaqItems((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) =>
                              setFaqItems((prev) =>
                                prev.map((x, i) =>
                                  i === index
                                    ? { ...x, question: e.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder="Question"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          />
                          <textarea
                            value={item.answer}
                            onChange={(e) =>
                              setFaqItems((prev) =>
                                prev.map((x, i) =>
                                  i === index
                                    ? { ...x, answer: e.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder="Answer"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-y"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFaqItems((prev) => [
                          ...prev,
                          { question: "", answer: "" },
                        ])
                      }
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 border border-dashed border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium text-sm transition-colors"
                    >
                      <Plus size={18} />
                      Add FAQ item
                    </button>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Content
                    </label>
                    <Controller
                      name="content"
                      control={form.control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Write full page content..."
                        />
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => (addOpen ? setAddOpen(false) : setEditing(null))}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {addOpen ? "Creating..." : "Updating..."}
                  </span>
                ) : addOpen ? (
                  "Create Page"
                ) : (
                  "Update Page"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          open={true}
          onCancel={() => setDeleting(null)}
          onConfirm={onDelete}
          title="Delete Page"
          message={`Are you sure you want to delete "${deleting.title.replace(/<[^>]*>/g, "")}"? This action cannot be undone.`}
          confirmLabel="Delete Page"
          danger
          loading={submitting}
        />
      )}
    </div>
  );
}
