import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import useFormatPrice from '@/hooks/useFormatPrice'
import { generateProductPlaceholder } from '@/utils/placeholderImage'
import { mapImageUrls, getProductImage, toImageUrl } from '@/utils/imageUrl'

export default function OrderItems({ order }: { order: any }) {
  const formatPrice = useFormatPrice()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <ShoppingCart size={20} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Order Items</h2>
      </div>

      <div className="space-y-4">
        {order.orderItems?.map((item: any) => {
          const productSlug = item.variant?.product?.slug || item.variant?.product?.id
          const productName = item.variant?.product?.name || 'Product'
          
          // Get all images from variant and product (exact same logic as ProductDetail page)
          const variantImages = Array.isArray(item.variant?.images) ? item.variant.images : []
          const productImages = Array.isArray(item.variant?.product?.images) ? item.variant.product.images : []
          
          // Use the same image logic as ProductDetail page
          const selectedImage = item?.selectedImage
            ? item.selectedImage.startsWith('http') || item.selectedImage.startsWith('data:')
              ? item.selectedImage
              : toImageUrl(item.selectedImage)
            : null
          const itemImage = selectedImage || getProductImage(
            variantImages,
            productImages,
            productName,
            120
          )
          
          // Get image URLs for fallback
          const allImages = [
            ...(productImages || []),
            ...variantImages,
          ].filter((img, index, arr) => arr.indexOf(img) === index && img && img.trim() !== '')
          const imageUrls = mapImageUrls(allImages)

          return (
            <Link
              key={item.id}
              to={`/product/${productSlug}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all group bg-gray-50 dark:bg-gray-900/50"
            >
              {/* Product Image */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
                <img
                  src={itemImage}
                  alt={productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget
                    const currentSrc = target.src
                    
                    // Try next image in the array if available (same as ProductDetail fallback logic)
                    if (imageUrls.length > 1) {
                      const currentIndex = imageUrls.findIndex(url => url === currentSrc || currentSrc.includes(url.split('/').pop() || ''))
                      if (currentIndex >= 0 && currentIndex < imageUrls.length - 1) {
                        target.src = imageUrls[currentIndex + 1]
                        return
                      }
                    }
                    
                    // Fallback to placeholder if no more images
                    const placeholder = generateProductPlaceholder(productName, 120)
                    if (target.src !== placeholder) {
                      target.src = placeholder
                    }
                  }}
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {productName}
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Description</p>
                {(() => {
                  const raw = item.variant?.product?.shortDescription || item.variant?.product?.description || ''
                  const stripped = raw.replace(/<[^>]*>/g, '').trim()
                  const display = stripped.slice(0, 150)
                  return display ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 line-clamp-2">
                      {display}{stripped.length > 150 ? '…' : ''}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-1.5 italic">—</p>
                  )
                })()}
                {item.variant?.product?.brand && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Brand: {item.variant.product.brand.name}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {item.variant?.sku && (
                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      SKU: {item.variant.sku}
                    </span>
                  )}
                  {item.size && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-medium">
                      Size: {item.size.name}
                    </span>
                  )}
                  {/* Display Color attribute (the one selected on product page) */}
                  {(() => {
                    const variantAttributes = Array.isArray(item.variant?.attributes) ? item.variant.attributes : []
                    const colorAttribute = variantAttributes.find((attr: any) => 
                      attr?.attribute?.name?.toLowerCase() === 'color'
                    )
                    
                    if (colorAttribute) {
                      const attrValue = colorAttribute?.value?.value || ''
                      if (attrValue) {
                        return (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium border border-gray-300 dark:border-gray-600">
                            Color: {attrValue}
                          </span>
                        )
                      }
                    }
                    return null
                  })()}
                  <span className="text-gray-500 dark:text-gray-400">
                    Qty: <span className="font-semibold">{item.quantity}</span>
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}
