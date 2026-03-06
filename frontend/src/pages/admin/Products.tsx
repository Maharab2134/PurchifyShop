import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Button from "@/components/atoms/Button";
import { categoriesApi, type Category } from "@/api/categories";
import { adminApi, type AdminProduct } from "@/api/admin";
import useToast from "@/hooks/useToast";
import { generateProductPlaceholder } from "@/utils/placeholderImage";
import { toImageUrl } from "@/utils/imageUrl";
import ImageUpload from "@/components/admin/ImageUpload";
import RichTextEditor from "@/components/admin/RichTextEditor";
import Modal from "@/components/common/Modal";

type FormValues = {
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  vendorId: string;
  status: "active" | "inactive";
  isNew: boolean;
  isFeatured: boolean;
  images: string[];
};

export default function AdminProducts() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<AdminProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const returnState = location.state as {
    currentPage?: number;
    pageSize?: number;
    search?: string;
  } | null;
  const [currentPage, setCurrentPage] = useState(returnState?.currentPage || 1);
  const [pageSize, setPageSize] = useState(returnState?.pageSize || 10);
  const [search, setSearch] = useState(returnState?.search || "");
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [masterSelected, setMasterSelected] = useState(false);

  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      categoryId: "",
      vendorId: "",
      status: "active",
      isNew: false,
      isFeatured: false,
      images: [],
    },
    mode: "onChange",
  });

  const load = async (page = 1, size = 10) => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes, vendorsRes] = await Promise.all([
        adminApi.products.list({
          limit: size,
          page: page,
          search: search || undefined,
        }),
        categoriesApi.getAll(),
        adminApi.vendors
          .list({ limit: 100, status: "approved" })
          .catch(() => ({ data: { data: { vendors: [] } } })),
      ]);
      setProducts(pRes.data.data?.products ?? []);
      setTotalProducts(
        pRes.data.data?.totalResults ?? pRes.data.data?.products?.length ?? 0,
      );
      setCategories(cRes.data.data ?? []);
      setVendors(
        vendorsRes.data.data?.vendors?.map((v) => ({
          id: v.id,
          name: v.name,
        })) ?? [],
      );
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
    // Clear state after reading it to prevent it persisting on next visit
    if (returnState) {
      window.history.replaceState({}, document.title);
    }
    load(currentPage, pageSize);
  }, [location.pathname, currentPage, pageSize]);

  const onAdd = handleSubmit(
    async (data) => {
      setSubmitting(true);
      try {
        await adminApi.products.create({
          name: data.name.trim(),
          shortDescription: data.shortDescription?.trim() || undefined,
          description: data.description?.trim() || undefined,
          categoryId: data.categoryId || undefined,
          vendorId: data.vendorId || undefined,
          status: data.status,
          isNew: Boolean(data.isNew),
          isFeatured: Boolean(data.isFeatured),
          images: data.images?.length ? data.images : undefined,
        });
        showToast(
          "Product created. Add variants on the Product page.",
          "success",
        );
        reset({
          name: "",
          shortDescription: "",
          description: "",
          categoryId: "",
          status: "active",
          isNew: false,
          isFeatured: false,
          images: [],
        });
        setCurrentPage(1);
        await load(1, pageSize);
      } catch (e: unknown) {
        const err = e as {
          response?: {
            data?: { message?: string; errors?: Record<string, string[]> };
          };
        };
        let errorMsg =
          err.response?.data?.message ?? "Failed to create product";
        if (err.response?.data?.errors) {
          const msgs = Object.entries(err.response.data.errors).map(
            ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`,
          );
          errorMsg = msgs.join("; ");
        }
        showToast(errorMsg, "error");
      } finally {
        setSubmitting(false);
      }
    },
    (errors) => {
      const firstError = Object.values(errors)[0];
      if (firstError?.message) showToast(firstError.message, "error");
      else showToast("Please fill all required fields.", "error");
    },
  );

  const onDelete = async () => {
    if (!deleteProduct) return;
    setSubmitting(true);
    try {
      await adminApi.products.delete(deleteProduct.id);
      showToast("Product deleted.", "success");
      setDeleteProduct(null);
      setCurrentPage(1);
      load(1, pageSize);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Delete failed";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    await load(1, pageSize);
  };

  const handleSelectAll = () => {
    if (masterSelected) {
      setSelectedProducts(new Set());
      setMasterSelected(false);
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
      setMasterSelected(true);
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const isSomeSelected =
    selectedProducts.size > 0 && selectedProducts.size < products.length;

  const totalPages = Math.ceil(totalProducts / pageSize);
  const startRecord =
    totalProducts === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalProducts);

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Products
          </h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search products..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-full sm:w-64"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
            >
              Search
            </button>
            <Button
              type="button"
              onClick={() => navigate("/dashboard/products/add")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Plus size={18} />
              Add Product
            </Button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">
              No products yet. Add a product to get started.
            </p>
            <Button
              type="button"
              onClick={() => navigate("/dashboard/products/add")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Product
            </Button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                      <input
                        type="checkbox"
                        checked={masterSelected}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = isSomeSelected;
                          }
                        }}
                        onChange={handleSelectAll}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Image
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Stock
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(p.id)}
                          onChange={() => handleSelectProduct(p.id)}
                          className="rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <img
                          src={
                            p.images?.[0]
                              ? toImageUrl(p.images[0])
                              : generateProductPlaceholder(p.name, 80)
                          }
                          alt={p.name}
                          width={80}
                          height={80}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = generateProductPlaceholder(
                              p.name,
                              80,
                            );
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">{p.name}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.isFeatured && (
                              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                Featured
                              </span>
                            )}
                            {p.isNew && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                New
                              </span>
                            )}
                            {p.discountBadge && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                {p.discountBadge}
                              </span>
                            )}
                            {p.isOutOfStock && (
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.category?.name ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-1">
                          {p.isDiscountActive &&
                            p.originalPrice > p.discountedPrice && (
                              <span className="text-gray-400 line-through text-xs">
                                ৳{p.originalPrice.toFixed(2)}
                              </span>
                            )}
                          <span className="font-medium text-gray-900">
                            ৳{p.discountedPrice.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.totalStock}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/dashboard/products/${p.id}/edit`, {
                                state: { currentPage, pageSize, search },
                              })
                            }
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteProduct(p)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <Link
                            to={`/product/${p.slug}`}
                            className="inline-flex items-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium text-sm"
                            aria-label="View"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Section */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Show
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  in {totalProducts} records
                </span>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  ({startRecord}-{endRecord} of {totalProducts})
                </span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
                >
                  PV
                </button>

                <div className="flex gap-0.5 flex-wrap justify-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (page === 1) return true;
                      if (page === totalPages) return true;
                      if (page === currentPage) return true;
                      if (page >= currentPage - 2 && page <= currentPage + 2)
                        return true;
                      return false;
                    })
                    .reduce(
                      (acc, page) => {
                        if (
                          acc.length > 0 &&
                          acc[acc.length - 1] !== page - 1
                        ) {
                          acc.push("...");
                        }
                        acc.push(page);
                        return acc;
                      },
                      [] as (number | string)[],
                    )
                    .map((item, index) => (
                      <div key={index}>
                        {item === "..." ? (
                          <span className="px-1 py-1 text-gray-600 text-xs">
                            ...
                          </span>
                        ) : (
                          <button
                            onClick={() => setCurrentPage(item as number)}
                            className={`px-2 py-1 text-xs font-medium rounded min-w-7 ${
                              currentPage === item
                                ? "bg-indigo-600 text-white"
                                : "border border-gray-300 text-gray-700 hover:bg-white"
                            }`}
                          >
                            {item}
                          </button>
                        )}
                      </div>
                    ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
                >
                  NX
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteProduct}
          title="Delete Product"
          message={
            deleteProduct
              ? `Delete "${deleteProduct.name}"? This cannot be undone.`
              : ""
          }
          confirmLabel="Delete"
          danger
          loading={submitting}
          onConfirm={onDelete}
          onCancel={() => setDeleteProduct(null)}
        />
      </div>
    </>
  );
}

function ProductFormModal({
  title,
  categories,
  control,
  onSubmit,
  onCancel,
  submitting,
  formErrors,
  vendors = [],
}: {
  title: string;
  categories: Category[];
  control: import("react-hook-form").Control<FormValues>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  formErrors: Record<string, any>;
  vendors?: Array<{ id: string; name: string }>;
}) {
  return (
    <Modal open={true} onClose={onCancel} title={title} size="xl">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <Controller
            name="name"
            control={control}
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
            control={control}
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
            control={control}
            editorKey="add"
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
            control={control}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor (Optional)
          </label>
          <Controller
            name="vendorId"
            control={control}
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
            Select vendor for this product. Used for order sharing via WhatsApp.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Controller
              name="status"
              control={control}
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
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <div>
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
                label="Product Images"
                maxFiles={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Add variants after saving the product.
              </p>
            </div>
          )}
        />
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <Controller
              name="isNew"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                  className="rounded"
                />
              )}
            />
            <span className="text-sm text-gray-700">New</span>
          </label>
          <label className="flex items-center gap-2">
            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                  className="rounded"
                />
              )}
            />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Product
              </>
            )}
          </button>
        </div>
        {Object.keys(formErrors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Please fix:</p>
            <ul className="text-xs text-red-700 list-disc list-inside">
              {formErrors.name && <li>{formErrors.name.message}</li>}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}
