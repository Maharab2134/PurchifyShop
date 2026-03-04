import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Controller, type Control } from 'react-hook-form'
import { adminApi } from '@/api/admin'
import { API_BASE_URL } from '@/lib/config'

export type UploadFolder = 'logo' | 'categories' | 'products' | 'brands' | 'utility'

interface ImageUploadProps {
  value?: string[] | null
  onChange?: (paths: string[]) => void
  name?: string
  control?: Control<any>
  multiple?: boolean
  label?: string
  maxFiles?: number
  /** Storage folder: logo | categories | products | brands | utility. Default: products */
  folder?: UploadFolder
  deleteConfig?: {
    ownerType:
      | 'product'
      | 'category'
      | 'subcategory'
      | 'brand'
      | 'homeSection'
      | 'slider'
      | 'section'
      | 'settings'
      | 'variant'
    ownerId?: string | number
    field?: string
  }
}

function assetUrl(path: string): string {
  if (path.startsWith('http')) return path
  const base = API_BASE_URL.replace(/\/api\/v1$/, '') || 'http://localhost:8000'
  return `${base}/storage/${path.replace(/^\//, '')}`
}

function ImageUploadInner({ value, onChange, multiple = true, label = 'Images', maxFiles = 10, folder = 'products', deleteConfig }: {
  value?: string[] | null
  onChange: (paths: string[]) => void
  multiple?: boolean
  label?: string
  maxFiles?: number
  folder?: UploadFolder
  deleteConfig?: ImageUploadProps['deleteConfig']
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Ensure value is always an array
  const images = Array.isArray(value) ? value : []

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setError(null)
    const list = Array.from(files)
    if (images.length + list.length > maxFiles) {
      setError(`Max ${maxFiles} images.`)
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      list.forEach((f) => formData.append('images[]', f))
      const res = await adminApi.uploads(formData, { folder })
      const paths = (res.data.data ?? []).map((x) => x.path)
      onChange([...images, ...paths])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed'
      setError(msg)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async (i: number) => {
    const path = images[i]
    if (!path) return
    setError(null)

    if (deleteConfig && (deleteConfig.ownerId || deleteConfig.ownerType === 'settings')) {
      const confirmDelete = window.confirm('Delete this image? This will remove it from storage.')
      if (!confirmDelete) return
      setDeletingIndex(i)
      try {
        await adminApi.images.delete({
          path,
          ownerType: deleteConfig.ownerType,
          ownerId: deleteConfig.ownerId,
          field: deleteConfig.field,
        })
        onChange(images.filter((_, j) => j !== i))
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Delete failed'
        setError(msg)
      } finally {
        setDeletingIndex(null)
      }
      return
    }

    onChange(images.filter((_, j) => j !== i))
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {images.map((path, i) => (
          <div key={i} className="relative group">
            <img
              src={assetUrl(path)}
              alt=""
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23ddd"><rect width="64" height="64"/></svg>' }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={deletingIndex === i}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 transition disabled:opacity-60"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length < maxFiles && (
          <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              className="sr-only"
              onChange={handleFile}
              disabled={uploading}
            />
            {uploading ? <span className="text-xs text-gray-500">…</span> : <Upload size={20} className="text-gray-400" />}
          </label>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

export default function ImageUpload(props: ImageUploadProps) {
  // If using react-hook-form Controller pattern
  if (props.name && props.control) {
    return (
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <ImageUploadInner
            value={field.value}
            onChange={field.onChange}
            multiple={props.multiple}
            label={props.label}
            maxFiles={props.maxFiles}
            folder={props.folder}
            deleteConfig={props.deleteConfig}
          />
        )}
      />
    )
  }
  
  // Direct value/onChange pattern
  if (props.onChange) {
    return (
      <ImageUploadInner
        value={props.value}
        onChange={props.onChange}
        multiple={props.multiple}
        label={props.label}
        maxFiles={props.maxFiles}
        folder={props.folder}
        deleteConfig={props.deleteConfig}
      />
    )
  }
  
  // Fallback: render without value/onChange (shouldn't happen, but prevents crash)
  return (
    <div>
      {props.label && <label className="block text-sm font-medium text-gray-700 mb-2">{props.label}</label>}
      <p className="text-sm text-red-500">ImageUpload: Missing value/onChange or name/control props</p>
    </div>
  )
}
