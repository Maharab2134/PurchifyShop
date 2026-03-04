import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Plus, Layers, Pencil } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/atoms/Button";
import { adminApi, type AdminAttribute } from "@/api/admin";
import useToast from "@/hooks/useToast";
import { getColorDisplayName, getColorSwatchValue } from "@/utils/colorSwatch";

type FormValues = { name: string; valuesText: string };

export default function AdminAttributes() {
  const { showToast } = useToast();
  const location = useLocation();
  const [attrs, setAttrs] = useState<AdminAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<AdminAttribute | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Set<string>>(new Set());
  const [masterSelected, setMasterSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalAttrs, setTotalAttrs] = useState(0);
  const [addColorDraft, setAddColorDraft] = useState({
    name: "",
    hex: "#F59E0B",
  });
  const [editColorDraft, setEditColorDraft] = useState({
    name: "",
    hex: "#F59E0B",
  });

  const { control, handleSubmit, reset, watch, setValue, getValues } =
    useForm<FormValues>({
      defaultValues: { name: "", valuesText: "" },
    });

  const addColorToValuesText = (mode: "add" | "edit") => {
    const draft = mode === "add" ? addColorDraft : editColorDraft;
    const name = draft.name.trim();
    const hex = draft.hex.trim().toUpperCase();

    if (!name) {
      showToast("Please enter color name.", "error");
      return;
    }

    if (!/^#([A-F0-9]{3}|[A-F0-9]{6})$/.test(hex)) {
      showToast("Please enter a valid hex color.", "error");
      return;
    }

    const composed = `${name}|${hex}`;
    const existing = (getValues("valuesText") || "")
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const alreadyExists = existing.some(
      (item) => item.toLowerCase() === composed.toLowerCase(),
    );
    if (!alreadyExists) {
      const nextValues = [...existing, composed];
      setValue("valuesText", nextValues.join(", "), {
        shouldDirty: true,
        shouldTouch: true,
      });
    }

    if (mode === "add") {
      setAddColorDraft({ name: "", hex });
    } else {
      setEditColorDraft({ name: "", hex });
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.attributes.list();
      setAttrs(res.data.data ?? []);
      setTotalAttrs(res.data.data?.length ?? 0);
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
  }, [location.pathname]);

  const onAdd = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const values = data.valuesText
        ? data.valuesText
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      await adminApi.attributes.create({
        name: data.name,
        values: values.length ? values : undefined,
      });
      showToast("Attribute created.", "success");
      setAddOpen(false);
      reset();
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

  const onEditOpen = (a: AdminAttribute) => {
    setEditingAttr(a);
    setEditColorDraft({ name: "", hex: "#F59E0B" });
    reset({
      name: a.name,
      valuesText: a.values?.map((v) => v.value).join(", ") ?? "",
    });
  };

  const openAddModal = () => {
    setEditingAttr(null);
    setAddColorDraft({ name: "", hex: "#F59E0B" });
    reset({ name: "", valuesText: "" });
    setAddOpen(true);
  };

  const onEditSave = handleSubmit(async (data) => {
    if (!editingAttr) return;
    setSubmitting(true);
    try {
      const values = data.valuesText
        ? data.valuesText
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      await adminApi.attributes.update(editingAttr.id, {
        name: data.name,
        values,
      });
      showToast("Attribute updated.", "success");
      setEditingAttr(null);
      reset();
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

  const handleSelectAll = () => {
    if (masterSelected) {
      setSelectedAttrs(new Set());
      setMasterSelected(false);
    } else {
      setSelectedAttrs(new Set(attrs.map((a) => a.id)));
      setMasterSelected(true);
    }
  };

  const handleSelectAttr = (id: string) => {
    const newSelected = new Set(selectedAttrs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAttrs(newSelected);
  };

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Attributes
          </h1>
          <Button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={18} />
            Add Attribute
          </Button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && attrs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Layers className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No attributes yet.</p>
            <Button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Attribute
            </Button>
          </div>
        )}
        {!loading && !error && attrs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                      <input
                        type="checkbox"
                        checked={masterSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              selectedAttrs.size > 0 &&
                              selectedAttrs.size < attrs.length;
                          }
                        }}
                        onChange={handleSelectAll}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Slug
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Values
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attrs.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedAttrs.has(a.id)}
                          onChange={() => handleSelectAttr(a.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {a.name}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{a.slug}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {a.values?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {a.values.map((v) => (
                              <span
                                key={v.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700"
                              >
                                {a.name.toLowerCase() === "color" && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-gray-300"
                                    style={{
                                      backgroundColor: getColorSwatchValue(
                                        v.value,
                                      ),
                                    }}
                                  />
                                )}
                                {a.name.toLowerCase() === "color"
                                  ? getColorDisplayName(v.value)
                                  : v.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onEditOpen(a)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                          title="Edit attribute"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-gray-600">
                  in {totalAttrs} records ({(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, totalAttrs)} of {totalAttrs}
                  )
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  PV
                </button>

                {(() => {
                  const totalPages = Math.ceil(totalAttrs / pageSize);
                  const pages: (number | string)[] = [];

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 4) {
                      for (let i = 1; i <= 5; i++) pages.push(i);
                      pages.push("...");
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1);
                      pages.push("...");
                      for (let i = totalPages - 4; i <= totalPages; i++)
                        pages.push(i);
                    } else {
                      pages.push(1);
                      pages.push("...");
                      for (let i = currentPage - 1; i <= currentPage + 1; i++)
                        pages.push(i);
                      pages.push("...");
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) =>
                    typeof page === "number" ? (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg font-medium ${
                          currentPage === page
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={index} className="px-2 text-gray-400">
                        ...
                      </span>
                    ),
                  );
                })()}

                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        Math.ceil(totalAttrs / pageSize),
                        currentPage + 1,
                      ),
                    )
                  }
                  disabled={currentPage >= Math.ceil(totalAttrs / pageSize)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  NX
                </button>
              </div>
            </div>
          </div>
        )}

        {addOpen && (
          <Modal
            open={true}
            onClose={() => {
              setAddOpen(false);
              setAddColorDraft({ name: "", hex: "#F59E0B" });
              reset();
            }}
            title="Add Attribute"
            size="md"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAdd();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Color"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Values (comma or newline)
                </label>
                <Controller
                  name="valuesText"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Red, Blue, Green"
                    />
                  )}
                />
              </div>
              {watch("name")?.trim().toLowerCase() === "color" && (
                <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
                  <p className="text-xs font-medium text-gray-600">
                    Add custom color
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                    <input
                      type="text"
                      value={addColorDraft.name}
                      onChange={(e) =>
                        setAddColorDraft((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Color name (e.g. Golden Yellow)"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="color"
                      value={addColorDraft.hex}
                      onChange={(e) =>
                        setAddColorDraft((prev) => ({
                          ...prev,
                          hex: e.target.value.toUpperCase(),
                        }))
                      }
                      className="h-10 w-14 p-1 border border-gray-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      value={addColorDraft.hex}
                      onChange={(e) =>
                        setAddColorDraft((prev) => ({
                          ...prev,
                          hex: e.target.value,
                        }))
                      }
                      placeholder="#F59E0B"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-indigo-500 w-28"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => addColorToValuesText("add")}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add Color
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    setAddColorDraft({ name: "", hex: "#F59E0B" });
                    reset();
                  }}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-lg shadow-indigo-500/30"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {editingAttr && (
          <Modal
            open={true}
            onClose={() => {
              setEditingAttr(null);
              setEditColorDraft({ name: "", hex: "#F59E0B" });
              reset();
            }}
            title="Edit Attribute"
            size="md"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEditSave();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Color"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Values (comma or newline)
                </label>
                <Controller
                  name="valuesText"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Red, Blue, Green"
                    />
                  )}
                />
              </div>
              {watch("name")?.trim().toLowerCase() === "color" && (
                <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
                  <p className="text-xs font-medium text-gray-600">
                    Add custom color
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                    <input
                      type="text"
                      value={editColorDraft.name}
                      onChange={(e) =>
                        setEditColorDraft((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Color name (e.g. Golden Yellow)"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="color"
                      value={editColorDraft.hex}
                      onChange={(e) =>
                        setEditColorDraft((prev) => ({
                          ...prev,
                          hex: e.target.value.toUpperCase(),
                        }))
                      }
                      className="h-10 w-14 p-1 border border-gray-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      value={editColorDraft.hex}
                      onChange={(e) =>
                        setEditColorDraft((prev) => ({
                          ...prev,
                          hex: e.target.value,
                        }))
                      }
                      placeholder="#F59E0B"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-indigo-500 w-28"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => addColorToValuesText("edit")}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add Color
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAttr(null);
                    setEditColorDraft({ name: "", hex: "#F59E0B" });
                    reset();
                  }}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-lg shadow-indigo-500/30"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </>
  );
}
