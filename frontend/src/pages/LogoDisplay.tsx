import { useNavigate } from 'react-router-dom'
import { storeInfoApi, type StoreInfo } from '@/api/storeInfo'
import { toImageUrl } from '@/utils/imageUrl'
import { useEffect, useState } from 'react'

export default function LogoDisplay() {
  const navigate = useNavigate()
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)

  useEffect(() => {
    // Fetch store info
    storeInfoApi.get().then((data) => {
      setStoreInfo(data)
    }).catch(() => {
      // If fetch fails, use cached data
      try {
        const cachedStoreInfo = localStorage.getItem('storeInfo')
        if (cachedStoreInfo) {
          setStoreInfo(JSON.parse(cachedStoreInfo))
        }
      } catch (e) {
        // Ignore
      }
    })
  }, [])

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <div
      className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 cursor-pointer"
      onClick={handleLogoClick}
    >
      <div className="text-center">
        {storeInfo?.logo && storeInfo.logo.trim() !== '' ? (
          <div
            className="flex justify-center mb-8 transform transition-transform duration-300 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation()
              handleLogoClick()
            }}
          >
            <img
              src={toImageUrl(storeInfo.logo)}
              alt={storeInfo.storeName || 'Store Logo'}
              className="h-48 sm:h-64 lg:h-80 w-auto object-contain max-w-sm transition-all duration-300"
              loading="eager"
              decoding="async"
              onClick={handleLogoClick}
            />
          </div>
        ) : storeInfo?.storeName ? (
          <div className="flex justify-center mb-8">
            <div className="h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-3xl shadow-2xl transform transition-transform duration-300 hover:scale-110">
              <span className="text-white font-bold text-8xl sm:text-9xl">
                {storeInfo.storeName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {storeInfo?.storeName || 'Store Logo'}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6">
            Click anywhere to return to home
          </p>
        </div>
      </div>
    </div>
  )
}
