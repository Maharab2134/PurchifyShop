import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Upload, Search, RefreshCw, Check, Copy } from "lucide-react";
import { adminApi } from "@/api/admin";
import Button from "@/components/atoms/Button";
import useToast from "@/hooks/useToast";
import { toImageUrl } from "@/utils/imageUrl";

type MediaItem = {
  path: string;
  url: string;
  folder: string;
  name: string;
  sizeBytes: number;
  lastModified: string | null;
};

const FOLDERS = ["all", "logo", "categories", "products", "brands", "utility"] as const;

type FolderFilter = (typeof FOLDERS)[number];
type SelectionMode = "single" | "multiple";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString();
}

export default function AdminMediaManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<FolderFilter>("all");
  const [uploadFolder, setUploadFolder] = useState<Exclude<FolderFilter, "all">>("products");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("multiple");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const isSelected = (path: string) => selectedPaths.includes(path);

  const toggleSelect = (path: string) => {
    if (selectionMode === "single") {
      setSelectedPaths((prev) => (prev[0] === path ? [] : [path]));
      return;
    }

    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const copySelected = async () => {
    if (!selectedPaths.length) {
      showToast("No image selected", "error");
      return;
    }

    const text = selectedPaths.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        `${selectedPaths.length} image path${selectedPaths.length === 1 ? "" : "s"} copied`,
        "success",
      );
    } catch {
      showToast("Could not copy selected paths", "error");
    }
  };

  const copySinglePath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      showToast("Image path copied", "success");
    } catch {
      showToast("Could not copy path", "error");
    }
  };

  const loadMedia = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminApi.media.list({
        folder,
        search: query || undefined,
        page: targetPage,
        limit: 60,
      });
      const data = res.data.data;
      setItems(data.media ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalResults(data.totalResults ?? 0);
      setPage(data.currentPage ?? targetPage);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to load media";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia(1);
  }, [folder, query]);

  useEffect(() => {
    if (selectionMode === "single" && selectedPaths.length > 1) {
      setSelectedPaths((prev) => (prev.length ? [prev[0]] : []));
    }
  }, [selectionMode, selectedPaths]);

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("images[]", file));

    setUploading(true);
    try {
      await adminApi.uploads(formData, { folder: uploadFolder });
      showToast("Image upload successful", "success");
      loadMedia(1);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Upload failed";
      showToast(msg, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const headerSubtitle = useMemo(() => {
    if (loading) return "Loading media...";
    return `${totalResults} image${totalResults === 1 ? "" : "s"} found`;
  }, [loading, totalResults]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Media Manager</h1>
          <p className="text-sm text-gray-500 mt-1">{headerSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Upload Folder</label>
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value as Exclude<FolderFilter, "all">)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white"
            >
              {FOLDERS.filter((f) => f !== "all").map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer">
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload Images"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={onUpload}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by file name or path"
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={() => setQuery(search.trim())}
              className="h-10 px-4 bg-gray-900 text-white rounded-lg hover:bg-black"
            >
              Search
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value as FolderFilter)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white"
            >
              {FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {f === "all" ? "All Folders" : f}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadMedia(page)}
              className="h-10 w-10 rounded-lg border border-gray-300 grid place-items-center hover:bg-gray-100"
              aria-label="Refresh media"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Selection</label>
            <select
              value={selectionMode}
              onChange={(e) => setSelectionMode(e.target.value as SelectionMode)}
              className="h-8 rounded-md border border-gray-300 px-2.5 text-xs bg-white"
            >
              <option value="single">Single</option>
              <option value="multiple">Multiple</option>
            </select>
            <span className="text-xs text-gray-500">
              {selectedPaths.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={copySelected}
              disabled={!selectedPaths.length}
              className="h-8 px-3 rounded-md border border-gray-300 bg-white text-xs disabled:opacity-50"
            >
              Copy Selected
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedPaths([])}
              disabled={!selectedPaths.length}
              className="h-8 px-3 rounded-md border border-gray-300 bg-white text-xs disabled:opacity-50"
            >
              Clear
            </Button>
          </div>
        </div>

      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ImageIcon className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-600">No images found for current filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <div
                key={item.path}
                onClick={() => toggleSelect(item.path)}
                className={`relative text-left rounded-xl border overflow-hidden shadow-sm transition-all cursor-pointer ${
                  isSelected(item.path)
                    ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/40"
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                }`}
                title={selectionMode === "single" ? "Select image" : "Select or unselect image"}
              >
                <div className="absolute top-2 right-2 z-10">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-bold ${
                      isSelected(item.path)
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white/90 border-gray-300 text-gray-500"
                    }`}
                  >
                    {isSelected(item.path) ? <Check size={12} /> : ""}
                  </span>
                </div>

                <div className="aspect-square bg-gray-50">
                  <img
                    src={item.url || toImageUrl(item.path)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = toImageUrl(item.path);
                    }}
                  />
                </div>
                <div className="p-2.5 space-y-1.5">
                  <p className="text-xs font-medium text-gray-800 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
                    <p className="truncate">{item.folder}</p>
                    <p>{formatBytes(item.sizeBytes)}</p>
                  </div>
                  <p className="text-[11px] text-gray-400">{formatDate(item.lastModified)}</p>
                  {isSelected(item.path) && (
                    <p className="text-[11px] font-semibold text-indigo-600">Selected</p>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.path);
                      }}
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                        isSelected(item.path)
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {isSelected(item.path) ? "Unselect" : "Select"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copySinglePath(item.path);
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Copy size={11} /> Copy Path
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={() => canPrev && loadMedia(page - 1)}
              disabled={!canPrev || loading}
              className="h-9 px-3 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
            >
              Prev
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              onClick={() => canNext && loadMedia(page + 1)}
              disabled={!canNext || loading}
              className="h-9 px-3 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
