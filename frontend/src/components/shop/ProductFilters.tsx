import { useForm, Controller } from "react-hook-form";
import { X, SlidersHorizontal } from "lucide-react";
import Dropdown from "@/components/molecules/Dropdown";
import { debounce } from "lodash";
import type { FilterValues } from "@/pages/Shop";
import type { Category } from "@/api/categories";
import type { Subcategory } from "@/api/subcategories";

interface ProductFiltersProps {
  initialFilters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  categories: Category[];
  subcategories?: Subcategory[];
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function ProductFilters({
  initialFilters,
  onFilterChange,
  categories,
  subcategories = [],
  isMobile = false,
  onCloseMobile,
}: ProductFiltersProps) {
  const { control, watch, reset, handleSubmit } = useForm<FilterValues>({
    defaultValues: initialFilters,
  });

  const formValues = watch();
  const selectedCategoryId = watch("categoryId");

  const debouncedSearch = debounce((searchValue: string) => {
    onFilterChange({ ...formValues, search: searchValue });
  }, 500);

  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  const onSubmit = (data: FilterValues) => {
    onFilterChange(data);
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  const handleReset = () => {
    reset({
      search: "",
      categoryId: undefined,
      subcategoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
    });
    onFilterChange({
      search: "",
      categoryId: undefined,
      subcategoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
    });
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  const activeFilterCount = Object.values(formValues).filter(
    (value) => value !== undefined && value !== "" && value !== false,
  ).length;

  return (
    <aside
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${
        isMobile
          ? "w-full h-[78vh] max-h-[85vh] rounded-t-2xl rounded-b-none shadow-2xl overflow-hidden"
          : "sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto"
      }`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
        <div className={`${isMobile ? "pt-2 px-4" : ""}`}>
          {isMobile && (
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
          )}
        </div>
        <div
          className={`flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${isMobile ? "px-4 pb-4" : "p-6 pb-4"}`}
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal
              size={20}
              className="text-indigo-600 dark:text-indigo-400"
            />
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full px-2.5 py-1">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1.5 font-medium"
              >
                <X size={16} />
                Clear all
              </button>
            )}
            {isMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div
          className={`flex-1 space-y-6 ${isMobile ? "p-4 pb-5" : "p-6 pt-4"} overflow-y-auto`}
        >
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Search Products
            </label>
            <Controller
              name="search"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleSearchChange(e.target.value);
                  }}
                />
              )}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Category
            </label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={categoryOptions}
                  value={field.value || ""}
                  onChange={(val) => {
                    field.onChange(val || undefined);
                    // Clear subcategory when category changes
                    control.setValue("subcategoryId", undefined);
                    onFilterChange({
                      ...formValues,
                      categoryId: val || undefined,
                      subcategoryId: undefined,
                    });
                  }}
                  className="w-full"
                />
              )}
            />
          </div>

          {selectedCategoryId && subcategories.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Subcategory
              </label>
              <Controller
                name="subcategoryId"
                control={control}
                render={({ field }) => {
                  const categorySubcats = subcategories.filter(
                    (sc) => sc.categoryId === selectedCategoryId,
                  );
                  const subcategoryOptions = [
                    { label: "All Subcategories", value: "" },
                    ...categorySubcats.map((subcat) => ({
                      label: subcat.name,
                      value: subcat.id,
                    })),
                  ];
                  return (
                    <Dropdown
                      options={subcategoryOptions}
                      value={field.value || ""}
                      onChange={(val) => {
                        field.onChange(val || undefined);
                        onFilterChange({
                          ...formValues,
                          subcategoryId: val || undefined,
                        });
                      }}
                      className="w-full"
                    />
                  );
                }}
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Price Range
            </label>
            <div className="flex items-center space-x-3">
              <Controller
                name="minPrice"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    placeholder="Min"
                    className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 w-1/2"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                  />
                )}
              />
              <Controller
                name="maxPrice"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    placeholder="Max"
                    className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 w-1/2"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Rating
            </label>
            <Controller
              name="minRating"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    field.onChange(val);
                    onFilterChange({ ...formValues, minRating: val });
                  }}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 text-gray-800 dark:text-gray-100"
                >
                  <option value="">Any rating</option>
                  <option value="4">4+ stars</option>
                  <option value="3">3+ stars</option>
                  <option value="2">2+ stars</option>
                  <option value="1">1+ star</option>
                </select>
              )}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Show products with at least this rating
            </p>
          </div>
        </div>

        <div
          className={`border-t border-gray-100 dark:border-gray-700 ${isMobile ? "p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]" : "p-6 pt-4"}`}
        >
          <button
            type="submit"
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3.5 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </aside>
  );
}
