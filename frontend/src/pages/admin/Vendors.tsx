import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Plus, Pencil, Trash2, Store, CheckCircle } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Modal from "@/components/common/Modal";
import Button from "@/components/atoms/Button";
import { adminApi, type AdminVendor } from "@/api/admin";
import useToast from "@/hooks/useToast";

type FormValues = {
  name: string;
  email: string;
  address: string;
  whatsappNumber: string;
  contactName: string;
};

export default function AdminVendors() {
  const { showToast } = useToast();
  const location = useLocation();
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVendor | null>(null);
  const [deleting, setDeleting] = useState<AdminVendor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved"
  >("all");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [vendorSystemActive, setVendorSystemActive] = useState(true);
  const [systemStatusLoading, setSystemStatusLoading] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      address: "",
      whatsappNumber: "",
      contactName: "",
    },
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { limit: number; status?: "pending" | "approved" } = {
        limit: 200,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await adminApi.vendors.list(params);
      setVendors(res.data.data?.vendors ?? []);
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

  const loadSystemStatus = async () => {
    try {
      const res = await adminApi.vendors.getSystemStatus();
      setVendorSystemActive(!!res.data.data?.isActive);
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    load();
    loadSystemStatus();
  }, [location.pathname, statusFilter]);

  const onToggleVendorSystem = async (isActive: boolean) => {
    setSystemStatusLoading(true);
    try {
      await adminApi.vendors.updateSystemStatus({ isActive });
      setVendorSystemActive(isActive);
      showToast(
        isActive ? "Vendor system activated." : "Vendor system deactivated.",
        "success",
      );
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update vendor system status";
      showToast(msg, "error");
    } finally {
      setSystemStatusLoading(false);
    }
  };

  const onApprove = async (v: AdminVendor) => {
    if (v.status === "approved") return;
    setApprovingId(v.id);
    try {
      await adminApi.vendors.approve(v.id);
      showToast(
        "Vendor approved. Login credentials are email + phone password.",
        "success",
      );
      load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to approve";
      showToast(msg, "error");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        email: editing.email ?? "",
        address: editing.address ?? "",
        whatsappNumber: editing.whatsappNumber ?? "",
        contactName: editing.contactName ?? "",
      });
    }
  }, [editing, form]);

  const onAdd = form.handleSubmit(async (data) => {
    if (!data.name?.trim()) {
      showToast("Name is required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.vendors.create({
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        whatsappNumber: data.whatsappNumber?.trim() || undefined,
        contactName: data.contactName?.trim() || undefined,
      });
      showToast("Vendor added.", "success");
      setAddOpen(false);
      form.reset({
        name: "",
        email: "",
        address: "",
        whatsappNumber: "",
        contactName: "",
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
    if (!data.name?.trim()) {
      showToast("Name is required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.vendors.update(editing.id, {
        name: data.name.trim(),
        email: data.email?.trim() ?? undefined,
        address: data.address?.trim() ?? undefined,
        whatsappNumber: data.whatsappNumber?.trim() ?? undefined,
        contactName: data.contactName?.trim() ?? undefined,
      });
      showToast("Vendor updated.", "success");
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
      await adminApi.vendors.delete(deleting.id);
      showToast("Vendor deleted.", "success");
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
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Vendors
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${vendorSystemActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              Vendor System: {vendorSystemActive ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={() => onToggleVendorSystem(!vendorSystemActive)}
              disabled={systemStatusLoading}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${vendorSystemActive ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"} disabled:opacity-60`}
            >
              {systemStatusLoading
                ? "Updating..."
                : vendorSystemActive
                  ? "Deactivate System"
                  : "Activate System"}
            </button>
            <span className="text-sm text-gray-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "pending" | "approved",
                )
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
            <Button
              type="button"
              onClick={() => {
                setAddOpen(true);
                form.reset({
                  name: "",
                  email: "",
                  address: "",
                  whatsappNumber: "",
                  contactName: "",
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Plus size={18} />
              Add Vendor
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!loading && !error && vendors.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Store className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">
              No vendors yet. Add a vendor to get started.
            </p>
            <Button
              type="button"
              onClick={() => {
                setAddOpen(true);
                form.reset({
                  name: "",
                  email: "",
                  address: "",
                  whatsappNumber: "",
                  contactName: "",
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Vendor
            </Button>
          </div>
        )}

        {!loading && !error && vendors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Contact Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      WhatsApp
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Address
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {v.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {v.email ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {v.contactName ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {v.whatsappNumber ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${(v.status ?? "pending") === "approved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {(v.status ?? "pending") === "approved"
                            ? "Approved"
                            : "Pending"}
                        </span>
                        {(v.status ?? "pending") === "pending" && (
                          <button
                            type="button"
                            onClick={() => onApprove(v)}
                            disabled={!!approvingId}
                            className="ml-2 p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Approve (sends email to vendor)"
                            aria-label="Approve"
                          >
                            {approvingId === v.id ? (
                              <span className="w-5 h-5 block border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                            ) : (
                              <CheckCircle size={18} />
                            )}
                          </button>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-gray-600 max-w-[200px] truncate"
                        title={v.address ?? undefined}
                      >
                        {v.address ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(v)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(v)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
          </div>
        )}

        {addOpen && (
          <Modal
            open={true}
            onClose={() => setAddOpen(false)}
            title="Add Vendor"
            size="lg"
          >
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Controller
                  name="name"
                  control={form.control}
                  rules={{ required: "Required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <input
                        {...field}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? "border-red-300" : "border-gray-300"}`}
                        placeholder="Vendor name"
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
                  Email
                </label>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="vendor@example.com"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <Controller
                  name="contactName"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Contact person name"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <Controller
                  name="whatsappNumber"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="+880..."
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Full address"
                    />
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {editing && (
          <Modal
            open={true}
            onClose={() => setEditing(null)}
            title={`Edit Vendor: ${editing.name}`}
            size="lg"
          >
            <form onSubmit={onEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Controller
                  name="name"
                  control={form.control}
                  rules={{ required: "Required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <input
                        {...field}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? "border-red-300" : "border-gray-300"}`}
                        placeholder="Vendor name"
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
                  Email
                </label>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="vendor@example.com"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <Controller
                  name="contactName"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Contact person name"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <Controller
                  name="whatsappNumber"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="+880..."
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Full address"
                    />
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        <ConfirmModal
          open={!!deleting}
          title="Delete Vendor"
          message={
            deleting ? `Delete "${deleting.name}"? This cannot be undone.` : ""
          }
          confirmLabel="Delete"
          danger
          loading={submitting}
          onConfirm={onDelete}
          onCancel={() => setDeleting(null)}
        />
      </div>
    </>
  );
}
