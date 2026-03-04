import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, X } from "lucide-react";
import Button from "@/components/atoms/Button";
import IconSuggestInput from "@/components/admin/IconSuggestInput";
import { adminApi } from "@/api/admin";
import { productsApi, type Product } from "@/api/products";
import useToast from "@/hooks/useToast";
import { API_BASE_URL } from "@/lib/config";

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base =
    API_BASE_URL.replace(/\/api\/v1$/, "") || "http://localhost:8000";
  return `${base}/storage/${path.replace(/^\//, "")}`;
};

type FormValues = {
  name: string;
  slug: string;
  themeType: string;
  title?: string;
  description?: string;
  subtitle?: string;
  themeData?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
  ctaLink?: string;
  isVisible: boolean;
  sortOrder: number;
  countdownEnd?: string;
  icon?: string;
  image?: string;
};

export default function HomeSectionForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const isEdit = !!id;

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      slug: "",
      themeType: "PRODUCT_GRID",
      title: "",
      description: "",
      subtitle: "",
      themeData: {},
      backgroundColor: "",
      textColor: "",
      ctaText: "",
      ctaLink: "",
      isVisible: true,
      sortOrder: 0,
      countdownEnd: "",
      icon: "",
      image: "",
    },
  });

  // Auto-generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameValue = e.target.value;
    form.setValue("name", nameValue);

    if (!slugManuallyEdited) {
      form.setValue("slug", generateSlug(nameValue));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("slug", e.target.value);
    if (e.target.value.trim() !== "") {
      setSlugManuallyEdited(true);
    }
  };

  // Load section data if editing
  useEffect(() => {
    if (id) {
      const loadSection = async () => {
        try {
          const res = await adminApi.homeSections.get(Number(id));
          const section = res.data.data;

          const countdownValue = section.countdownEnd
            ? new Date(section.countdownEnd).toISOString().slice(0, 16)
            : "";
          const iconValue =
            section.icon && section.icon.trim() ? section.icon.trim() : "";
          const imageValue =
            section.image && section.image.trim() ? section.image.trim() : "";

          form.reset({
            name: section.name,
            slug: section.slug,
            themeType: section.themeType || "PRODUCT_GRID",
            title: section.title || "",
            description: section.description || "",
            subtitle: section.subtitle || "",
            themeData: section.themeData || {},
            backgroundColor: section.backgroundColor || "",
            textColor: section.textColor || "",
            ctaText: section.ctaText || "",
            ctaLink: section.ctaLink || "",
            isVisible: section.isVisible ?? true,
            sortOrder: section.sortOrder,
            countdownEnd: countdownValue,
            icon: iconValue,
            image: imageValue,
          });
          setSlugManuallyEdited(!!section.slug);

          // Load images for split layout if editing
          if (
            section.themeType === "SPLIT_LAYOUT" &&
            section.themeData?.images
          ) {
            // Images are already in themeData, no need to do anything
          }
        } catch (e) {
          showToast("Failed to load section", "error");
          navigate("/dashboard/home-sections");
        } finally {
          setLoading(false);
        }
      };
      loadSection();
    } else {
      setLoading(false);
    }
  }, [id, form, navigate, showToast]);

  // Load products for product selection
  useEffect(() => {
    productsApi
      .getAll({ limit: 500 })
      .then(({ data }) => setAllProducts(data.data?.products ?? []))
      .catch(() => []);
  }, []);

  // Load selected products if editing
  useEffect(() => {
    if (id) {
      adminApi.homeSections
        .get(Number(id))
        .then((res) => {
          const prods = res.data.data?.products ?? [];
          setSelectedIds(new Set(prods.map((p) => p.id)));
        })
        .catch(() => {});
    }
  }, [id]);

  const toggleProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("images[]", file);
      const res = await adminApi.uploads(formData, { folder: "utility" });
      const path = res.data.data?.[0]?.path;
      if (path) {
        form.setValue("image", path);
      }
    } catch {
      showToast("Image upload failed", "error");
    } finally {
      setSubmitting(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleImageRemove = async (path: string, field?: string) => {
    if (!path) return;
    if (isEdit && id) {
      try {
        await adminApi.images.delete({
          path,
          ownerType: "homeSection",
          ownerId: id,
          field: field || "image",
        });
      } catch {
        showToast("Failed to delete image", "error");
        return;
      }
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!data.name?.trim()) {
      showToast("Name is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await adminApi.homeSections.update(Number(id), {
          name: data.name.trim(),
          slug: data.slug?.trim() || undefined,
          themeType: data.themeType || "PRODUCT_GRID",
          title: data.title?.trim() || undefined,
          description: data.description?.trim() || undefined,
          subtitle: data.subtitle?.trim() ? data.subtitle.trim() : undefined,
          themeData: data.themeData || undefined,
          backgroundColor: data.backgroundColor?.trim() || undefined,
          textColor: data.textColor?.trim() || undefined,
          ctaText: data.ctaText?.trim() || undefined,
          ctaLink: data.ctaLink?.trim() || undefined,
          isVisible: data.isVisible ?? true,
          sortOrder: data.sortOrder ?? 0,
          countdownEnd: data.countdownEnd?.trim() || null,
          icon: data.icon?.trim() || undefined,
          image: data.image?.trim() || undefined,
        });

        // Update products if any selected
        if (selectedIds.size > 0) {
          await adminApi.homeSections.updateProducts(
            Number(id),
            Array.from(selectedIds),
          );
        }

        showToast("Home section updated", "success");
      } else {
        const res = await adminApi.homeSections.create({
          name: data.name.trim(),
          slug: data.slug?.trim() || generateSlug(data.name.trim()),
          themeType: data.themeType || "PRODUCT_GRID",
          title: data.title?.trim() || undefined,
          description: data.description?.trim() || undefined,
          subtitle: data.subtitle?.trim() ? data.subtitle.trim() : undefined,
          themeData: data.themeData || undefined,
          backgroundColor: data.backgroundColor?.trim() || undefined,
          textColor: data.textColor?.trim() || undefined,
          ctaText: data.ctaText?.trim() || undefined,
          ctaLink: data.ctaLink?.trim() || undefined,
          isVisible: data.isVisible ?? true,
          sortOrder: data.sortOrder ?? 0,
          countdownEnd: data.countdownEnd?.trim() || undefined,
          icon: data.icon?.trim() || undefined,
          image: data.image?.trim() || undefined,
        });

        const newId = res.data.data.id;

        // Add products if any selected
        if (selectedIds.size > 0) {
          await adminApi.homeSections.updateProducts(
            newId,
            Array.from(selectedIds),
          );
        }

        showToast("Home section created", "success");
      }
      navigate("/dashboard/home-sections");
    } catch (e) {
      showToast(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? (isEdit ? "Update failed" : "Create failed"),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard/home-sections")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home Sections
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? "Edit Home Section" : "Add Home Section"}
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main form fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  {...form.register("name")}
                  onChange={handleNameChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Winter Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug (optional)
                </label>
                <input
                  {...form.register("slug")}
                  onChange={handleSlugChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  placeholder="winter-collection"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Auto-generated from name. You can edit it manually.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme Type *
              </label>
              <select
                {...form.register("themeType")}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="PRODUCT_GRID">Product Grid</option>
                <option value="PROMOTIONAL_CARDS">Promotional Cards</option>
                <option value="PROMOTIONAL_BANNER">Promotional Banner</option>
                <option value="COUNTDOWN_TIMER">Countdown Timer</option>
                <option value="COUNTDOWN_GRID">Countdown + Product Grid</option>
                <option value="PRODUCT_CAROUSEL">Product Carousel</option>
                <option value="CATEGORY_SHOWCASE">Category Showcase</option>
                <option value="SPLIT_LAYOUT">
                  Split Layout (Left Image Slide, Right Products)
                </option>
                <option value="IMAGE_BANNER">
                  Image Banner (Only Images, No Products)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title (optional)
              </label>
              <input
                {...form.register("title")}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                placeholder="Section title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                {...form.register("description")}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                placeholder="Section description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtitle (optional)
              </label>
              <input
                {...form.register("subtitle")}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                placeholder="Section subtitle"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color (optional)
                </label>
                <input
                  type="color"
                  {...form.register("backgroundColor")}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Color (optional)
                </label>
                <input
                  type="color"
                  {...form.register("textColor")}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CTA Text (optional)
                </label>
                <input
                  {...form.register("ctaText")}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Shop Now"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CTA Link (optional)
                </label>
                <input
                  {...form.register("ctaLink")}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                  placeholder="/shop or https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  {...form.register("sortOrder", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Countdown End (optional)
                </label>
                <input
                  type="datetime-local"
                  {...form.register("countdownEnd")}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Set end date/time for countdown timer.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon (optional)
              </label>
              <IconSuggestInput
                value={form.watch("icon") || ""}
                onChange={(value) =>
                  form.setValue("icon", value, { shouldDirty: true })
                }
                placeholder="e.g. Snowflake, Gift, Star, Flame"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lucide icon name (e.g. Snowflake, Gift, Star).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section Image (optional)
              </label>
              <div className="space-y-2">
                {form.watch("image") && (
                  <div className="relative inline-block">
                    <img
                      src={getImageUrl(form.watch("image"))}
                      alt="Preview"
                      className="w-full max-w-md h-auto object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const current = form.watch("image");
                        if (current) {
                          await handleImageRemove(current, "image");
                        }
                        form.setValue("image", "");
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Upload an image for this section.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register("isVisible")}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Visible on home page
              </label>
            </div>

            {/* Split Layout: 2 layout options */}
            {form.watch("themeType") === "SPLIT_LAYOUT" && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Layout (choose one)
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 has-[:checked]:border-indigo-500 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500">
                    <input
                      type="radio"
                      name="splitImagePosition"
                      checked={
                        (form.watch("themeData")?.imagePosition || "left") ===
                        "left"
                      }
                      onChange={() => {
                        const themeData = form.watch("themeData") || {};
                        form.setValue("themeData", {
                          ...themeData,
                          imagePosition: "left",
                        });
                      }}
                      className="text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Option 1:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Left: image slider · Right: products
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 has-[:checked]:border-indigo-500 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500">
                    <input
                      type="radio"
                      name="splitImagePosition"
                      checked={
                        form.watch("themeData")?.imagePosition === "right"
                      }
                      onChange={() => {
                        const themeData = form.watch("themeData") || {};
                        form.setValue("themeData", {
                          ...themeData,
                          imagePosition: "right",
                        });
                      }}
                      className="text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Option 2:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Left: products · Right: image slider
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Additional Images for Split Layout */}
            {form.watch("themeType") === "SPLIT_LAYOUT" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Images for Slider (optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {form.watch("themeType") === "SPLIT_LAYOUT"
                    ? "Upload multiple images for the image slider. The section image will be included automatically."
                    : "Upload multiple images for the banner slider. The section image will be included automatically."}
                </p>
                <div className="space-y-2">
                  {(() => {
                    const themeData = form.watch("themeData");
                    const images = themeData?.images;
                    if (images && Array.isArray(images) && images.length > 0) {
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {images.map((img: string, index: number) => (
                            <div key={index} className="relative">
                              <img
                                src={getImageUrl(img)}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-32 md:h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const currentThemeData =
                                    form.watch("themeData") || {};
                                  const currentImages =
                                    currentThemeData.images || [];
                                  const newImages = currentImages.filter(
                                    (_: string, i: number) => i !== index,
                                  );
                                  await handleImageRemove(
                                    img,
                                    "themeData.images",
                                  );
                                  form.setValue("themeData", {
                                    ...currentThemeData,
                                    images: newImages,
                                  });
                                }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setSubmitting(true);
                      try {
                        const formData = new FormData();
                        files.forEach((file) =>
                          formData.append("images[]", file),
                        );
                        const res = await adminApi.uploads(formData, {
                          folder: "utility",
                        });
                        const paths =
                          res.data.data?.map((item: any) => item.path) || [];
                        const currentThemeData = form.watch("themeData") || {};
                        const currentImages = currentThemeData.images || [];
                        form.setValue("themeData", {
                          ...currentThemeData,
                          images: [...currentImages, ...paths],
                        });
                      } catch {
                        showToast("Image upload failed", "error");
                      } finally {
                        setSubmitting(false);
                        if (e.target) e.target.value = "";
                      }
                    }}
                    disabled={submitting}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right section: Products at top, then help — whole column sticky so nothing overlaps when scrolling */}
          <div className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start space-y-4">
            {form.watch("themeType") !== "IMAGE_BANNER" && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/30">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Products ({selectedIds.size} selected)
                </label>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
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
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Select products to show in this section.
                  {form.watch("themeType") === "SPLIT_LAYOUT" &&
                    " For Split Layout, product side depends on the layout you chose above."}
                  {form.watch("themeType") === "COUNTDOWN_GRID" &&
                    " Countdown Grid shows up to 10 products under the banner."}
                </p>
              </div>
            )}
            {form.watch("themeType") === "IMAGE_BANNER" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Image Banner sections don't require
                  products. Upload images and they display as a banner slider.
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                How each theme works:
              </p>
              <p>
                <strong>Product Grid</strong> — Title + grid of selected
                products; optional icon, image, view more.
              </p>
              <p>
                <strong>Promotional Cards</strong> — Custom cards from theme
                data (no product selection).
              </p>
              <p>
                <strong>Promotional Banner</strong> — Single banner from theme
                data.
              </p>
              <p>
                <strong>Countdown Timer</strong> — Shows countdown to end date;
                no products.
              </p>
              <p>
                <strong>Countdown + Product Grid</strong> — Countdown banner on
                top, up to 10 products below.
              </p>
              <p>
                <strong>Product Carousel</strong> — Selected products in a
                horizontal carousel.
              </p>
              <p>
                <strong>Category Showcase</strong> — Categories from theme data
                (no product selection).
              </p>
              <p>
                <strong>Split Layout</strong> — Left: image slider; right:
                selected products.
              </p>
              <p>
                <strong>Image Banner</strong> — Image slider only; no products.
                Use Section Image and optional extra images.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={() => navigate("/dashboard/home-sections")}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : isEdit
                ? "Update Section"
                : "Create Section"}
          </Button>
        </div>
      </form>
    </div>
  );
}
