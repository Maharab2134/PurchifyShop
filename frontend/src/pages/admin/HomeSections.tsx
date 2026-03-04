import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  LayoutList,
  GripVertical,
  X,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Modal from "@/components/common/Modal";
import Button from "@/components/atoms/Button";
import { adminApi } from "@/api/admin";
import { productsApi, type Product } from "@/api/products";
import useToast from "@/hooks/useToast";
import { API_BASE_URL } from "@/lib/config";

type SectionItem = {
  id: number;
  name: string;
  slug: string;
  themeType?: string;
  title?: string | null;
  description?: string | null;
  subtitle?: string | null;
  themeData?: Record<string, any>;
  backgroundColor?: string | null;
  textColor?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  isVisible?: boolean;
  sortOrder: number;
  productsCount: number;
  countdownEnd?: string | null;
  icon?: string | null;
  image?: string | null;
};
type SliderItem = {
  id: number;
  title: string | null;
  image: string;
  link: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};
type SliderFormValues = {
  title: string;
  image: string;
  link: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminHomeSections() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"sections" | "sliders">(
    "sections",
  );
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<SectionItem | null>(null);
  const [manageSection, setManageSection] = useState<SectionItem | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sliderAddOpen, setSliderAddOpen] = useState(false);
  const [sliderEditing, setSliderEditing] = useState<SliderItem | null>(null);
  const [sliderDeleting, setSliderDeleting] = useState<SliderItem | null>(null);
  const [sliderDraggedIndex, setSliderDraggedIndex] = useState<number | null>(
    null,
  );
  const [sliderDragOverIndex, setSliderDragOverIndex] = useState<number | null>(
    null,
  );

  const sliderForm = useForm<SliderFormValues>({
    defaultValues: {
      title: "",
      image: "",
      link: "",
      description: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const load = async () => {
    setLoading(true);
    try {
      const [sectionsRes, slidersRes] = await Promise.all([
        adminApi.homeSections.list(),
        adminApi.sliders.list(),
      ]);
      setSections(sectionsRes.data.data ?? []);
      setSliders(slidersRes.data.data ?? []);
    } catch (e) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    productsApi
      .getAll({ limit: 500 })
      .then(({ data }) => setAllProducts(data.data?.products ?? []))
      .catch(() => []);
  }, []);

  const openManage = async (s: SectionItem) => {
    setManageSection(s);
    setSelectedIds(new Set());
    try {
      const res = await adminApi.homeSections.get(s.id);
      const prods = res.data.data?.products ?? [];
      setSelectedIds(new Set(prods.map((p) => p.id)));
    } catch {
      showToast("Failed to load section products", "error");
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveManage = async () => {
    if (!manageSection) return;
    setSubmitting(true);
    try {
      await adminApi.homeSections.updateProducts(
        manageSection.id,
        Array.from(selectedIds),
      );
      showToast("Section products updated", "success");
      setManageSection(null);
      await load();
    } catch {
      showToast("Failed to update section products", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVisibility = async (section: SectionItem) => {
    setSubmitting(true);
    try {
      await adminApi.homeSections.update(section.id, {
        isVisible: !section.isVisible,
      });
      showToast(
        `Section ${!section.isVisible ? "shown" : "hidden"}`,
        "success",
      );
      await load();
    } catch {
      showToast("Failed to update visibility", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await adminApi.homeSections.delete(deleting.id);
      showToast("Home section deleted", "success");
      setDeleting(null);
      await load();
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(dropIndex, 0, removed);

    setSections(newSections);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      const sectionIds = newSections.map((s) => s.id);
      await adminApi.homeSections.reorder(sectionIds);
      showToast("Sections reordered", "success");
      await load();
    } catch {
      showToast("Failed to reorder sections", "error");
      await load();
    }
  };

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base =
      API_BASE_URL?.replace(/\/api\/v1$/, "") || "http://localhost:8000";
    return `${base}/storage/${path.replace(/^\//, "")}`;
  };

  const handleSliderImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("images[]", file);
      const res = await adminApi.uploads(formData, { folder: "utility" });
      const path = res.data.data?.[0]?.path;
      if (path) {
        sliderForm.setValue("image", path);
      }
    } catch {
      showToast("Image upload failed", "error");
    } finally {
      setSubmitting(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSliderImageRemove = async (path: string, sliderId?: number) => {
    if (!path) return;
    if (sliderId) {
      try {
        await adminApi.images.delete({
          path,
          ownerType: "slider",
          ownerId: String(sliderId),
          field: "image",
        });
        showToast("Slide image removed", "success");
      } catch {
        showToast("Failed to delete slide image", "error");
        return;
      }
    }
    sliderForm.setValue("image", "");
  };

  const toNullableText = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  const onSliderAdd = sliderForm.handleSubmit(async (data) => {
    if (!data.image?.trim()) {
      showToast("Image is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.sliders.create({
        title: toNullableText(data.title),
        image: data.image.trim(),
        link: toNullableText(data.link),
        description: toNullableText(data.description),
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive,
      });
      showToast("Slider created", "success");
      setSliderAddOpen(false);
      sliderForm.reset({
        title: "",
        image: "",
        link: "",
        description: "",
        sortOrder: 0,
        isActive: true,
      });
      await load();
    } catch (e) {
      showToast(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Create failed",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  });

  const onSliderEdit = sliderForm.handleSubmit(async (data) => {
    if (!sliderEditing) return;
    if (!data.image?.trim()) {
      showToast("Image is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.sliders.update(sliderEditing.id, {
        title: toNullableText(data.title),
        image: data.image.trim(),
        link: toNullableText(data.link),
        description: toNullableText(data.description),
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive,
      });
      showToast("Slider updated", "success");
      setSliderEditing(null);
      sliderForm.reset({
        title: "",
        image: "",
        link: "",
        description: "",
        sortOrder: 0,
        isActive: true,
      });
      await load();
    } catch (e) {
      showToast(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Update failed",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  });

  const onSliderDelete = async () => {
    if (!sliderDeleting) return;
    setSubmitting(true);
    try {
      await adminApi.sliders.delete(sliderDeleting.id);
      showToast("Slider deleted", "success");
      setSliderDeleting(null);
      await load();
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSliderDragStart = (index: number) => {
    setSliderDraggedIndex(index);
  };

  const handleSliderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setSliderDragOverIndex(index);
  };

  const handleSliderDragEnd = () => {
    setSliderDraggedIndex(null);
    setSliderDragOverIndex(null);
  };

  const handleSliderDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (sliderDraggedIndex === null || sliderDraggedIndex === dropIndex) {
      setSliderDraggedIndex(null);
      setSliderDragOverIndex(null);
      return;
    }

    const newSliders = [...sliders];
    const [removed] = newSliders.splice(sliderDraggedIndex, 1);
    newSliders.splice(dropIndex, 0, removed);

    setSliders(newSliders);
    setSliderDraggedIndex(null);
    setSliderDragOverIndex(null);

    try {
      const sliderIds = newSliders.map((s) => s.id);
      await adminApi.sliders.reorder(sliderIds);
      showToast("Sliders reordered", "success");
      await load();
    } catch {
      showToast("Failed to reorder sliders", "error");
      await load();
    }
  };

  useEffect(() => {
    if (sliderEditing) {
      sliderForm.reset({
        title: sliderEditing.title || "",
        image: sliderEditing.image,
        link: sliderEditing.link || "",
        description: sliderEditing.description || "",
        sortOrder: sliderEditing.sortOrder,
        isActive: sliderEditing.isActive,
      });
    }
  }, [sliderEditing, sliderForm]);

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Home Content
        </h1>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "sections"
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            Sections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sliders")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "sliders"
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            Sliders
          </button>
        </div>

        {activeTab === "sections" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create sections (e.g. Winter, Summer) and add products. They
                appear on the home page.
              </p>
              <Button
                onClick={() => navigate("/dashboard/home-sections/add")}
                className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                <Plus size={18} />
                Add Section
              </Button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 w-8"></th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Name
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Image
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Slug
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Products
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Status
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Sort
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sections.map((s, index) => (
                        <tr
                          key={s.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-move ${
                            dragOverIndex === index
                              ? "bg-indigo-50 dark:bg-indigo-900/20"
                              : ""
                          } ${draggedIndex === index ? "opacity-50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <GripVertical
                              size={18}
                              className="text-gray-400 dark:text-gray-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {s.name}
                          </td>
                          <td className="px-4 py-3">
                            {s.image ? (
                              <img
                                src={getImageUrl(s.image)}
                                alt={s.name}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                No image
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {s.slug}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {s.productsCount}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleVisibility(s)}
                              disabled={submitting}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                s.isVisible !== false
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                              } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={
                                s.isVisible !== false
                                  ? "Visible on home page - Click to hide"
                                  : "Hidden - Click to show"
                              }
                            >
                              {s.isVisible !== false ? (
                                <Eye size={14} />
                              ) : (
                                <EyeOff size={14} />
                              )}
                              <span>
                                {s.isVisible !== false ? "Visible" : "Hidden"}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {s.sortOrder}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openManage(s)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <LayoutList size={14} />
                                Products
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/dashboard/home-sections/${s.id}/edit`,
                                  )
                                }
                                className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(s)}
                                className="rounded-lg border border-red-200 dark:border-red-800 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                aria-label="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!sections.length && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <Package size={48} className="mb-4 opacity-50" />
                    <p>
                      No home sections yet. Add one to show custom product
                      blocks on the home page.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "sliders" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage homepage slider. Sliders appear below the navbar on the
                home page.
              </p>
              <Button
                onClick={() => {
                  setSliderAddOpen(true);
                  sliderForm.reset({
                    title: "",
                    image: "",
                    link: "",
                    description: "",
                    sortOrder: 0,
                    isActive: true,
                  });
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                <Plus size={18} />
                Add Slide
              </Button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 w-8"></th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Image
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Title
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Link
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Status
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Sort
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sliders.map((s, index) => (
                        <tr
                          key={s.id}
                          draggable
                          onDragStart={() => handleSliderDragStart(index)}
                          onDragOver={(e) => handleSliderDragOver(e, index)}
                          onDragEnd={handleSliderDragEnd}
                          onDrop={(e) => handleSliderDrop(e, index)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-move ${
                            sliderDragOverIndex === index
                              ? "bg-indigo-50 dark:bg-indigo-900/20"
                              : ""
                          } ${sliderDraggedIndex === index ? "opacity-50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <GripVertical
                              size={18}
                              className="text-gray-400 dark:text-gray-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <img
                              src={getImageUrl(s.image)}
                              alt={s.title || "Slide"}
                              className="w-20 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {s.title || "No title"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {s.link ? (
                              <a
                                href={s.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs block"
                              >
                                {s.link}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                No link
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                s.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {s.sortOrder}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSliderEditing(s)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSliderDeleting(s)}
                                className="rounded-lg border border-red-200 dark:border-red-800 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                aria-label="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!sliders.length && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <ImageIcon size={48} className="mb-4 opacity-50" />
                    <p>
                      No sliders yet. Add slides to show them below the navbar
                      on the home page.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={!!manageSection}
        onClose={() => setManageSection(null)}
        title={manageSection ? `Products: ${manageSection.name}` : ""}
        size="lg"
      >
        {manageSection && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select products to show in this section. Order follows list order.
            </p>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {allProducts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {p.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {p.slug}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                onClick={() => setManageSection(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveManage}
                disabled={submitting}
                className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {deleting && (
        <ConfirmModal
          open
          onCancel={() => setDeleting(null)}
          onConfirm={onDelete}
          title="Delete section"
          message={`Delete "${deleting.name}"? Products in this section will not be removed.`}
          confirmLabel="Delete"
          danger
          loading={submitting}
        />
      )}

      <Modal
        open={sliderAddOpen}
        onClose={() => setSliderAddOpen(false)}
        title="Add Slide"
        size="md"
      >
        <form onSubmit={onSliderAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title (optional)
            </label>
            <input
              {...sliderForm.register("title")}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              placeholder="e.g. Summer Sale"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image *
            </label>
            <div className="space-y-2">
              {sliderForm.watch("image") && (
                <div className="relative inline-block">
                  <img
                    src={getImageUrl(sliderForm.watch("image"))}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleSliderImageRemove(sliderForm.watch("image"))
                    }
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleSliderImageUpload}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Upload slider image. Recommended: 1920x600px or similar wide
              format.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link (optional)
            </label>
            <input
              {...sliderForm.register("link")}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              placeholder="https://example.com/page"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              URL to navigate when slide is clicked.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              {...sliderForm.register("description")}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              placeholder="Slide description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              {...sliderForm.register("sortOrder", { valueAsNumber: true })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...sliderForm.register("isActive")}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              onClick={() => setSliderAddOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              {submitting ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!sliderEditing}
        onClose={() => setSliderEditing(null)}
        title="Edit Slide"
        size="md"
      >
        {sliderEditing && (
          <form onSubmit={onSliderEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title (optional)
              </label>
              <input
                {...sliderForm.register("title")}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image *
              </label>
              <div className="space-y-2">
                {sliderForm.watch("image") && (
                  <div className="relative inline-block">
                    <img
                      src={getImageUrl(sliderForm.watch("image"))}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSliderImageRemove(
                          sliderForm.watch("image"),
                          sliderEditing?.id,
                        )
                      }
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSliderImageUpload}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link (optional)
              </label>
              <input
                {...sliderForm.register("link")}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                {...sliderForm.register("description")}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                {...sliderForm.register("sortOrder", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...sliderForm.register("isActive")}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                onClick={() => setSliderEditing(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                {submitting ? "Saving..." : "Update"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {sliderDeleting && (
        <ConfirmModal
          open
          onCancel={() => setSliderDeleting(null)}
          onConfirm={onSliderDelete}
          title="Delete slide"
          message={`Delete this slide? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={submitting}
        />
      )}
    </>
  );
}
