import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Modal from "@/components/common/Modal";
import Button from "@/components/atoms/Button";
import { adminApi } from "@/api/admin";
import useToast from "@/hooks/useToast";

type FormValues = {
  text: string;
  isActive: boolean;
  scrollSpeed: number;
};

interface Notice {
  id: number;
  text: string;
  sortOrder: number;
  isActive: boolean;
  scrollSpeed: number;
}

export default function AdminNotices() {
  const { showToast } = useToast();
  const location = useLocation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      text: "",
      isActive: true,
      scrollSpeed: 50,
    },
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.notices.list();
      setNotices(res.data.data ?? []);
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

  useEffect(() => {
    if (editing) {
      form.reset({
        text: editing.text,
        isActive: editing.isActive,
        scrollSpeed: editing.scrollSpeed,
      });
    }
  }, [editing, form]);

  const onAdd = form.handleSubmit(async (data) => {
    if (!data.text?.trim()) {
      showToast("Text is required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.notices.create({
        text: data.text.trim(),
        isActive: data.isActive,
        scrollSpeed: data.scrollSpeed,
      });
      showToast("Notice added.", "success");
      setAddOpen(false);
      form.reset({ text: "", isActive: true, scrollSpeed: 50 });
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
    if (!data.text?.trim()) {
      showToast("Text is required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.notices.update(editing.id, {
        text: data.text.trim(),
        isActive: data.isActive,
        scrollSpeed: data.scrollSpeed,
      });
      showToast("Notice updated.", "success");
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
      await adminApi.notices.delete(deleting.id);
      showToast("Notice deleted.", "success");
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
            Notices
          </h1>
          <Button
            type="button"
            onClick={() => {
              setAddOpen(true);
              form.reset({ text: "", isActive: true, scrollSpeed: 50 });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={18} />
            Add Notice
          </Button>
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

        {!loading && !error && notices.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">
              No notices yet. Add a notice to get started.
            </p>
            <Button
              type="button"
              onClick={() => {
                setAddOpen(true);
                form.reset({ text: "", isActive: true });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Notice
            </Button>
          </div>
        )}

        {!loading && !error && notices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left py-3.5 px-4 font-semibold text-gray-700">
                      Text
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-gray-700">
                      Speed
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-gray-700">
                      Active
                    </th>
                    <th className="text-right py-3.5 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notices.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-gray-900 max-w-md truncate">
                        {n.text}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                          {n.scrollSpeed} px/s
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            n.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {n.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(n)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(n)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          form.reset({ text: "", isActive: true });
        }}
        title="Add Notice"
      >
        <form onSubmit={onAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notice Text <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter notice text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              {...form.register("text")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scroll Speed (pixels/sec) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="10"
              max="200"
              placeholder="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...form.register("scrollSpeed", {
                valueAsNumber: true,
              })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              {...form.register("isActive")}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => {
                setAddOpen(false);
                form.reset({ text: "", isActive: true, scrollSpeed: 50 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Notice"
      >
        <form onSubmit={onEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notice Text <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter notice text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              {...form.register("text")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scroll Speed (pixels/sec) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="10"
              max="200"
              placeholder="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...form.register("scrollSpeed", {
                valueAsNumber: true,
              })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsActive"
              {...form.register("isActive")}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="editIsActive"
              className="text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleting}
        title="Delete Notice"
        message={`Are you sure you want to delete this notice? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onDelete}
        onCancel={() => setDeleting(null)}
        loading={submitting}
        danger
      />
    </>
  );
}
