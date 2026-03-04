import { useEffect, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { storeInfoApi, type StoreInfo } from "@/api/storeInfo";

type Props = { embedded?: boolean };

export default function FloatingContactWidget({ embedded }: Props) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    storeInfoApi
      .get()
      .then(setStoreInfo)
      .catch(() => {});
  }, []);

  if (!storeInfo) return null;

  const hasWhatsApp =
    storeInfo.whatsappLink && storeInfo.whatsappLink.trim() !== "";
  const hasMessenger =
    storeInfo.messengerLink && storeInfo.messengerLink.trim() !== "";
  const hasPhone = storeInfo.phone && storeInfo.phone.trim() !== "";

  // Don't show widget if no contact options are available
  if (!hasWhatsApp && !hasMessenger && !hasPhone) return null;

  const handlePhoneClick = () => {
    if (hasPhone) {
      window.location.href = `tel:${storeInfo.phone}`;
    }
  };

  const inner = (
    <div
        className="flex flex-col items-end gap-3 relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Chat with us button - shown when open, positioned to the left of main button */}
        {isOpen && (
          <div className="absolute right-16 bottom-0 animate-in fade-in slide-in-from-right-2 duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-xs sm:text-sm rounded-lg shadow-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-all duration-300 whitespace-nowrap"
            >
              chat with us
            </button>
          </div>
        )}

        {/* Contact Options - Shown when open, ordered from top to bottom: Messenger, Phone, WhatsApp */}
        {isOpen && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Messenger - Top */}
            {hasMessenger && (
              <a
                href={storeInfo.messengerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                aria-label="Facebook Messenger"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.006 0 11.177c0 3.549 1.832 6.705 4.633 8.548v5.59l4.24-2.327c1.13.314 2.33.485 3.587.485 6.627 0 12-5.006 12-11.177C24.24 5.006 18.867 0 12 0zm0 19.75c-1.064 0-2.098-.15-3.073-.43l-.348-.096-2.4 1.316v-2.9l-.348-.217C3.36 16.157 1.5 13.72 1.5 11.177 1.5 6.13 6.21 2.25 12 2.25S22.5 6.13 22.5 11.177c0 4.947-4.71 8.827-10.5 8.827z" />
                </svg>
              </a>
            )}

            {/* Phone - Middle */}
            {hasPhone && (
              <button
                onClick={handlePhoneClick}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                aria-label="Call us"
              >
                <Phone
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            )}

            {/* WhatsApp - Bottom */}
            {hasWhatsApp && (
              <a
                href={storeInfo.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                aria-label="WhatsApp"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.262-.735 1.439-1.44.173-.703.173-1.307.12-1.44-.053-.133-.198-.223-.446-.372z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.5 16.5c-.198.297-.99.594-1.364.644-.297.05-.673.074-1.04-.074-.198-.074-.446-.223-.767-.446-.297-.198-1.04-.743-1.44-.99-.198-.124-.347-.198-.495-.223-.149-.025-.297-.025-.446.05-.149.074-.644.297-.99.446-.347.149-.644.223-.99.15-.347-.074-1.255-.52-2.14-1.48C6.5 13.5 5.5 11.5 5.5 9.5c0-2 .5-3 .744-3.5.149-.297.446-.446.744-.595.297-.149.495-.149.743-.074.248.074.495.198.644.297.149.099.297.223.446.372.149.15.223.297.297.446.074.149.05.297.05.446-.025.149-.074.297-.149.446-.074.149-.198.297-.297.446-.099.149-.223.248-.297.347-.074.099-.149.198-.074.347.074.149.297.644.644 1.04.347.396.644.644.842.743.198.099.347.124.495.05.149-.074.297-.223.446-.372.149-.149.297-.297.446-.446.149-.149.248-.198.347-.149.099.05.198.149.297.248.099.099.198.198.297.297.099.099.149.198.248.248.099.05.198.05.297.025.099-.025.198-.074.297-.149.099-.074.198-.149.297-.223.099-.074.198-.149.297-.149.099 0 .198.074.297.149.099.074.198.198.297.347.099.149.149.297.198.446.05.149.05.297.025.446-.025.149-.074.297-.149.446z" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Main Chat Button - Bottom (purple with notification dot) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative"
          aria-label="Contact us"
        >
          <MessageCircle
            size={24}
            className="group-hover:scale-110 transition-transform"
          />
          {/* Notification dot */}
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
  );

  if (embedded) return inner;
  return (
    <div className="fixed right-4 bottom-4 z-[60] floating-contact-above-nav">
      {inner}
    </div>
  );
}
