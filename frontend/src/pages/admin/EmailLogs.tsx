import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Eraser,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/common/Modal";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { adminApi } from "@/api/admin";
import useToast from "@/hooks/useToast";

type EmailLog = {
  id: number;
  templateId: string | null;
  templateName: string | null;
  eventType: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  bodyHtml?: string;
  status: string;
  errorMessage: string | null;
  variablesUsed: Record<string, any> | null;
  relatedModelType: string | null;
  relatedModelId: string | null;
  sentAt: string | null;
  createdAt: string;
};

export default function EmailLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [deleteLog, setDeleteLog] = useState<EmailLog | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    event_type: "",
    recipient_email: "",
  });
  const [pagination, setPagination] = useState({
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
    resultsPerPage: 50,
  });

  useEffect(() => {
    loadLogs();
  }, [filters, pagination.currentPage]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.resultsPerPage,
      };
      if (filters.status) params.status = filters.status;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.recipient_email)
        params.recipient_email = filters.recipient_email;

      const res = await adminApi.emailLogs.list(params);
      setLogs(res.data.data.logs);
      setPagination({
        totalResults: res.data.data.totalResults,
        totalPages: res.data.data.totalPages,
        currentPage: res.data.data.currentPage,
        resultsPerPage: res.data.data.resultsPerPage,
      });
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || "Failed to load email logs",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!deleteLog) return;
    setSubmitting(true);
    try {
      await adminApi.emailLogs.delete(deleteLog.id);
      showToast("Email log deleted successfully", "success");
      setDeleteLog(null);
      loadLogs();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to delete log", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onClearAll = async () => {
    setSubmitting(true);
    try {
      await adminApi.emailLogs.clearAll();
      showToast("All email logs cleared", "success");
      setClearAllConfirm(false);
      loadLogs();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to clear logs", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            Email Logs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage all sent email logs
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setClearAllConfirm(true)}
          className="shrink-0"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Type
            </label>
            <input
              type="text"
              value={filters.event_type}
              onChange={(e) =>
                setFilters({ ...filters, event_type: e.target.value })
              }
              placeholder="order_created, order_processing..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Email
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={filters.recipient_email}
                onChange={(e) =>
                  setFilters({ ...filters, recipient_email: e.target.value })
                }
                placeholder="Search by email..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <ClipboardCheck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400">
            No email logs found
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">
                      Recipient
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">
                      Template
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">
                      Subject
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">
                      Sent At
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {log.recipientName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.recipientEmail}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-gray-900 dark:text-gray-100">
                            {log.templateName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.eventType}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="max-w-xs truncate text-gray-900 dark:text-gray-100"
                          title={log.subject}
                        >
                          {log.subject}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}
                          >
                            {log.status.toUpperCase()}
                          </span>
                        </div>
                        {log.errorMessage && (
                          <div
                            className="text-xs text-red-600 dark:text-red-400 mt-1 truncate max-w-xs"
                            title={log.errorMessage}
                          >
                            {log.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                        {log.sentAt
                          ? formatDate(log.sentAt)
                          : formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteLog(log)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Delete"
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing{" "}
                  {(pagination.currentPage - 1) * pagination.resultsPerPage + 1}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.resultsPerPage,
                    pagination.totalResults,
                  )}{" "}
                  of {pagination.totalResults} results
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage - 1,
                      })
                    }
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage + 1,
                      })
                    }
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* View Log Modal */}
      {selectedLog && (
        <Modal
          open={true}
          onClose={() => setSelectedLog(null)}
          title="Email Log Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Recipient
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.recipientName} ({selectedLog.recipientEmail})
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Template
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.templateName || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Event Type
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.eventType}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedLog.status)}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedLog.status)}`}
                  >
                    {selectedLog.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Subject
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.subject}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Sent At
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.sentAt
                    ? formatDate(selectedLog.sentAt)
                    : formatDate(selectedLog.createdAt)}
                </p>
              </div>
            </div>

            {selectedLog.errorMessage && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <label className="text-xs font-medium text-red-700 dark:text-red-300">
                  Error Message
                </label>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {selectedLog.errorMessage}
                </p>
              </div>
            )}

            {selectedLog.variablesUsed &&
              Object.keys(selectedLog.variablesUsed).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Variables Used
                  </label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto">
                      {JSON.stringify(selectedLog.variablesUsed, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Email Body (HTML)
              </label>
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-h-96 overflow-auto border border-gray-200 dark:border-gray-600">
                {selectedLog.bodyHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedLog.bodyHtml }}
                    className="dark:**:text-gray-300! dark:[&_h1]:text-gray-100! dark:[&_h2]:text-gray-100! dark:[&_h3]:text-gray-100! dark:[&_h4]:text-gray-100! dark:[&_h5]:text-gray-100! dark:[&_h6]:text-gray-100! dark:[&_strong]:text-gray-200! dark:[&_b]:text-gray-200!"
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Email body not available
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        open={!!deleteLog}
        title="Delete Email Log"
        message={
          deleteLog ? `Delete email log for "${deleteLog.recipientEmail}"?` : ""
        }
        confirmLabel="Delete"
        danger
        loading={submitting}
        onConfirm={onDelete}
        onCancel={() => setDeleteLog(null)}
      />

      <ConfirmModal
        open={clearAllConfirm}
        title="Clear All Email Logs"
        message="Remove all email logs from the database? This cannot be undone."
        confirmLabel="Clear All"
        danger
        loading={submitting}
        onConfirm={onClearAll}
        onCancel={() => setClearAllConfirm(false)}
      />
    </div>
  );
}
