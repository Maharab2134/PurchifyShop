import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/atoms/Button";
import { categoriesApi, type Category } from "@/api/categories";
import { adminApi, type AdminProduct } from "@/api/admin";
import { brandsApi, type Brand } from "@/api/brands";
import useToast from "@/hooks/useToast";
// import { generateProductPlaceholder } from '@/utils/placeholderImage'
import { toImageUrl } from "@/utils/imageUrl";
import { getColorDisplayName, getColorSwatchValue } from "@/utils/colorSwatch";
import ImageUpload from "@/components/admin/ImageUpload";
import RichTextEditor from "@/components/admin/RichTextEditor";

type FormValues = {
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  vendorId: string;
  brandId: string;
  status: "active" | "inactive";
  isNew: boolean;
  isFeatured: boolean;
  images: string[];
};

type VariantFormValues = {
  sku: string;
  stock: number;
  lowStockAlert: number;
  price: number;
  discountType: "percentage" | "flat" | "";
  discountValue: number;
  discountStartAt: string;
  discountEndAt: string;
  sizeIds: string[];
  attributeValueIds: string[];
};

type VariantDraft = VariantFormValues & {
  id?: string;
  tempId: string;
};

export default function ProductForm() {
  const defaultProductValues: FormValues = {
    name: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    vendorId: "",
    brandId: "",
    status: "active",
    isNew: false,
    isFeatured: false,
    images: [],
  };

  const buildDefaultVariant = (): VariantDraft => ({
    tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sku: "",
    stock: 0,
    lowStockAlert: 10,
    price: 0,
    discountType: "",
    discountValue: 0,
    discountStartAt: "",
    discountEndAt: "",
    sizeIds: [],
    attributeValueIds: [],
  });

  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<
    Array<{ id: string; name: string; categoryId: string }>
  >([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>(() => [
    buildDefaultVariant(),
  ]);
  const [variantsLoaded, setVariantsLoaded] = useState(!id);
  const [sizes, setSizes] = useState<Array<{ id: string; name: string }>>([]);
  const [attributes, setAttributes] = useState<
    Array<{
      id: string;
      name: string;
      values: Array<{ id: string; value: string }>;
    }>
  >([]);
  const isEdit = !!id;

  const mapAttributes = (
    list: Array<{
      id: string;
      name: string;
      values: Array<{ id: string; value: string }>;
    }>,
  ) =>
    list.map((a) => ({
      id: a.id,
      name: a.name,
      values: a.values || [],
    }));

  const form = useForm<FormValues>({
    defaultValues: defaultProductValues,
    mode: "onChange",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, vRes, bRes, sRes, aRes] = await Promise.all([
          categoriesApi.getAll(),
          adminApi.vendors
            .list({ limit: 100, status: "approved" })
            .catch(() => ({ data: { data: { vendors: [] } } })),
          brandsApi
            .getAll({ limit: 200 })
            .catch(() => ({ data: { data: { brands: [] } } })),
          adminApi.sizes
            .list({ all: true })
            .catch(() => ({ data: { data: [] } })),
          adminApi.attributes.list().catch(() => ({ data: { data: [] } })),
        ]);
        setCategories(cRes.data.data ?? []);
        setVendors(
          vRes.data.data?.vendors?.map((v: { id: string; name: string }) => ({
            id: v.id,
            name: v.name,
          })) ?? [],
        );
        setBrands(bRes.data.data?.brands ?? []);
        setSizes(
          (sRes.data.data ?? []).map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          })),
        );
        setAttributes(mapAttributes(aRes.data.data ?? []));
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load";
        showToast(msg, "error");
      }
    };
    load();
  }, [isEdit, showToast]);

  // Load subcategories when category changes
  useEffect(() => {
    const categoryId = form.watch("categoryId");
    if (categoryId) {
      adminApi.subcategories
        .list({ categoryId })
        .then((res) => {
          setSubcategories(
            (res.data.data?.subcategories ?? []).map(
              (sc: { id: string; name: string; categoryId: string }) => ({
                id: sc.id,
                name: sc.name,
                categoryId: sc.categoryId,
              }),
            ),
          );
        })
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
      form.setValue("subcategoryId", "");
    }
  }, [form.watch("categoryId"), form]);

  useEffect(() => {
    if (id) {
      const loadProduct = async () => {
        try {
          setLoading(true);
          const { data } = await adminApi.products.get(id);
          const p = data.data;
          setProduct(p);

          // Now set form values with the loaded product data
          form.reset({
            name: p.name,
            shortDescription: p.shortDescription ?? "",
            description: p.description ?? "",
            categoryId: p.categoryId ?? "",
            subcategoryId: (p as any).subcategoryId ?? "",
            vendorId: p.vendorId ?? "",
            brandId: (p as any).brandId ?? "",
            status: p.status ?? "active",
            isNew: p.isNew ?? false,
            isFeatured: p.isFeatured ?? false,
            images: p.images ?? [],
          });
          const selectedBrand = brands.find((b) => b.id === (p as any).brandId);
          if (selectedBrand) {
            setBrandSearch(selectedBrand.name);
          }

          // Load subcategories for the selected category
          if (p.categoryId) {
            adminApi.subcategories
              .list({ categoryId: p.categoryId })
              .then((res) => {
                setSubcategories(
                  (res.data.data?.subcategories ?? []).map(
                    (sc: { id: string; name: string; categoryId: string }) => ({
                      id: sc.id,
                      name: sc.name,
                      categoryId: sc.categoryId,
                    }),
                  ),
                );
              })
              .catch(() => setSubcategories([]));
          }
        } catch (e: unknown) {
          const msg =
            (e as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to load product";
          showToast(msg, "error");
          navigate("/dashboard/products");
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    }
  }, [id, form, navigate, showToast]);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setBrandSearch("");
      setSubcategories([]);
      form.reset(defaultProductValues);
      setVariants([buildDefaultVariant()]);
      setVariantsLoaded(true);
    }
  }, [id]);

  const loadVariants = async () => {
    if (!id) return;
    try {
      const res = await adminApi.variants.list({ productId: id, limit: 200 });
      const mapped: VariantDraft[] = (res.data.data?.variants ?? []).map(
        (v) => ({
          id: v.id,
          tempId: v.id,
          sku: v.sku,
          stock: v.stock ?? 0,
          lowStockAlert: v.lowStockAlert ?? 10,
          price: v.price ?? 0,
          discountType: (v.discountType as "percentage" | "flat") || "",
          discountValue: v.discountValue ?? 0,
          discountStartAt: v.discountStartAt
            ? v.discountStartAt.slice(0, 10)
            : "",
          discountEndAt: v.discountEndAt ? v.discountEndAt.slice(0, 10) : "",
          sizeIds: v.sizeIds ?? (v.sizes ?? []).map((s) => s.id),
          attributeValueIds: v.attributeValueIds ?? [],
        }),
      );
      setVariants(mapped.length > 0 ? [mapped[0]] : [buildDefaultVariant()]);
      setVariantsLoaded(true);
    } catch {
      setVariants([buildDefaultVariant()]);
      setVariantsLoaded(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [id]);

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    const payloadVariants = variants.slice(0, 1).map((v) => ({
      id: v.id,
      sku: v.sku,
      stock: Number(v.stock) ?? 0,
      lowStockAlert: Number(v.lowStockAlert) ?? 10,
      price: Number(v.price) ?? 0,
      discountType:
        v.discountType === "percentage" || v.discountType === "flat"
          ? v.discountType
          : undefined,
      discountValue: Number(v.discountValue) || 0,
      discountStartAt: v.discountStartAt || undefined,
      discountEndAt: v.discountEndAt || undefined,
      sizeIds: v.sizeIds?.length ? v.sizeIds : [],
      attributeValueIds: v.attributeValueIds?.length ? v.attributeValueIds : [],
    }));
    try {
      if (isEdit && id) {
        await adminApi.products.update(id, {
          name: data.name,
          shortDescription: data.shortDescription || undefined,
          description: data.description || undefined,
          categoryId: data.categoryId || undefined,
          subcategoryId: data.subcategoryId || undefined,
          vendorId: data.vendorId || undefined,
          brandId: data.brandId || undefined,
          status: data.status,
          isNew: data.isNew,
          isFeatured: data.isFeatured,
          images: data.images,
          suggestedSizeIds: [],
          suggestedAttributeValueIds: [],
          variants: variantsLoaded ? payloadVariants : undefined,
        });
        showToast("Product updated successfully", "success");
      } else {
        await adminApi.products.create({
          name: data.name,
          shortDescription: data.shortDescription || undefined,
          description: data.description || undefined,
          categoryId: data.categoryId || undefined,
          subcategoryId: data.subcategoryId || undefined,
          vendorId: data.vendorId || undefined,
          brandId: data.brandId || undefined,
          status: data.status,
          isNew: data.isNew,
          isFeatured: data.isFeatured,
          images: data.images,
          suggestedSizeIds: [],
          suggestedAttributeValueIds: [],
          variants: payloadVariants,
        });
        showToast("Product created successfully", "success");
        form.reset(defaultProductValues);
        setVariants([buildDefaultVariant()]);
        setBrandSearch("");
        setSubcategories([]);
        navigate("/dashboard/products");
        return;
      }
      navigate("/dashboard/products");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Operation failed";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  const updateVariant = (tempId: string, updates: Partial<VariantDraft>) => {
    setVariantsLoaded(true);
    setVariants((prev) =>
      prev.map((v) => (v.tempId === tempId ? { ...v, ...updates } : v)),
    );
  };

  const filteredSizes = () => sizes;
  const filteredAttributes = () => attributes;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Button
          type="button"
          onClick={() => navigate("/dashboard/products")}
          className="inline-flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEdit ? `Edit Product: ${product?.name || ""}` : "Add New Product"}
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
      >
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Controller
                name="name"
                control={form.control}
                rules={{ required: "Product name is required" }}
                render={({ field, fieldState }) => (
                  <div>
                    <input
                      {...field}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${fieldState.error ? "border-red-300 focus:ring-red-500" : "border-gray-300"}`}
                      placeholder="Product name"
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short description
              </label>
              <Controller
                name="shortDescription"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief summary — shown in product info (optional)"
                    maxLength={500}
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Shown in product info / Description area. Max 500 chars.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (long)
              </label>
              <RichTextEditor
                name="description"
                control={form.control}
                editorKey={isEdit ? `edit-${id}` : "add"}
                placeholder="Full description — shown in Description section (optional). Use toolbar for bold, lists, links, etc."
                className="rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shown in the Description section on product page. Styles (bold,
                lists, links) will display for users.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {form.watch("categoryId") && subcategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory (Optional)
                </label>
                <Controller
                  name="subcategoryId"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">—</option>
                      {subcategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  )}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Images
              </label>
              <Controller
                name="images"
                control={form.control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    multiple
                    maxFiles={10}
                    label=""
                    deleteConfig={
                      isEdit && id
                        ? { ownerType: "product", ownerId: id, field: "images" }
                        : undefined
                    }
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload product images. First image will be the main image.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => navigate("/dashboard/products")}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              Vendor & Brand
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor (Optional)
                </label>
                <Controller
                  name="vendorId"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Select Vendor —</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select vendor for this product. Used for order sharing via
                  WhatsApp.
                </p>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand (Optional)
                </label>
                <Controller
                  name="brandId"
                  control={form.control}
                  render={({ field }) => {
                    const selectedBrand = brands.find(
                      (b) => b.id === field.value,
                    );
                    const filteredBrands = brands.filter((b) =>
                      b.name.toLowerCase().includes(brandSearch.toLowerCase()),
                    );
                    return (
                      <div>
                        <input
                          type="text"
                          value={brandSearch}
                          onChange={(e) => {
                            setBrandSearch(e.target.value);
                            setShowBrandSuggestions(true);
                            if (!e.target.value) {
                              field.onChange("");
                            }
                          }}
                          onFocus={() => setShowBrandSuggestions(true)}
                          onBlur={() => {
                            setTimeout(
                              () => setShowBrandSuggestions(false),
                              200,
                            );
                          }}
                          placeholder="Search or select brand..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {showBrandSuggestions && filteredBrands.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredBrands.map((brand) => (
                              <button
                                key={brand.id}
                                type="button"
                                onClick={() => {
                                  field.onChange(brand.id);
                                  setBrandSearch(brand.name);
                                  setShowBrandSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3"
                              >
                                {brand.logo && (
                                  <img
                                    src={toImageUrl(brand.logo)}
                                    alt={brand.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                )}
                                <span>{brand.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedBrand && (
                          <p className="text-xs text-gray-500 mt-1">
                            Selected: {selectedBrand.name}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select brand for this product. Start typing to search.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.tempId}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {index === 0
                    ? "Pricing & Stock Details"
                    : `Option ${index + 1}`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(variant.tempId, { sku: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="SKU"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (৳) *
                    </label>
                    <input
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(variant.tempId, {
                          price: Number(e.target.value),
                        })
                      }
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock *
                    </label>
                    <input
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(variant.tempId, {
                          stock: Number(e.target.value),
                        })
                      }
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Alert
                    </label>
                    <input
                      value={variant.lowStockAlert}
                      onChange={(e) =>
                        updateVariant(variant.tempId, {
                          lowStockAlert: Number(e.target.value),
                        })
                      }
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Discount
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={variant.discountType}
                        onChange={(e) =>
                          updateVariant(variant.tempId, {
                            discountType: e.target
                              .value as VariantFormValues["discountType"],
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">None</option>
                        <option value="percentage">%</option>
                        <option value="flat">৳ off</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Value
                      </label>
                      <input
                        value={variant.discountValue}
                        onChange={(e) =>
                          updateVariant(variant.tempId, {
                            discountValue: Number(e.target.value),
                          })
                        }
                        type="number"
                        step="0.01"
                        min={0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Start
                      </label>
                      <input
                        type="date"
                        value={variant.discountStartAt}
                        onChange={(e) =>
                          updateVariant(variant.tempId, {
                            discountStartAt: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        End
                      </label>
                      <input
                        type="date"
                        value={variant.discountEndAt}
                        onChange={(e) =>
                          updateVariant(variant.tempId, {
                            discountEndAt: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sizes
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {filteredSizes().map((s) => (
                      <label
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={variant.sizeIds.includes(s.id)}
                          onChange={() => {
                            const next = variant.sizeIds.includes(s.id)
                              ? variant.sizeIds.filter((id) => id !== s.id)
                              : [...variant.sizeIds, s.id];
                            updateVariant(variant.tempId, { sizeIds: next });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm">{s.name}</span>
                      </label>
                    ))}
                    {filteredSizes().length === 0 && (
                      <span className="text-xs text-gray-500">
                        No sizes selected.
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attributes
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select attribute values for this option.
                  </p>
                  <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                    {filteredAttributes().length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No attributes available.
                      </p>
                    ) : (
                      filteredAttributes().map((attr) => (
                        <div
                          key={attr.id}
                          className="bg-white rounded-lg p-3 border border-gray-200"
                        >
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            {attr.name}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map((val) => (
                              <label
                                key={val.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={variant.attributeValueIds.includes(
                                    val.id,
                                  )}
                                  onChange={() => {
                                    const next =
                                      variant.attributeValueIds.includes(val.id)
                                        ? variant.attributeValueIds.filter(
                                            (id) => id !== val.id,
                                          )
                                        : [
                                            ...variant.attributeValueIds,
                                            val.id,
                                          ];
                                    updateVariant(variant.tempId, {
                                      attributeValueIds: next,
                                    });
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                {attr.name.toLowerCase() === "color" ? (
                                  <span className="inline-flex items-center gap-2">
                                    <span
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{
                                        backgroundColor: getColorSwatchValue(
                                          val.value,
                                        ),
                                      }}
                                    />
                                    {getColorDisplayName(val.value)}
                                  </span>
                                ) : (
                                  <span>{val.value}</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
