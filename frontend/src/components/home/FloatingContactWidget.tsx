import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { storeInfoApi, type StoreInfo } from "@/api/storeInfo";

type Props = { embedded?: boolean };

export default function FloatingContactWidget({ embedded }: Props) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  useEffect(() => {
    storeInfoApi
      .get()
      .then((data) => {
        console.log("Store Info:", data); // এখানে দাও
        setStoreInfo(data);
      })
      .catch((err) => {
        console.log("Error:", err);
      });
  }, []);

  if (!storeInfo) return null;

  const hasWhatsApp =
    storeInfo.whatsappLink && storeInfo.whatsappLink.trim() !== "";
  const hasMessenger =
    storeInfo.messengerLink && storeInfo.messengerLink.trim() !== "";
  // Don't show widget if no contact options are available
  if (!hasWhatsApp && !hasMessenger) return null;

  const ContactOption = ({
    icon,
    label,
    href,
    id,
    bgColor,
    hoverBgColor,
    delay = 0,
  }: {
    icon: React.ReactNode;
    label: string;
    href?: string;
    id: string;
    bgColor: string;
    hoverBgColor: string;
    delay?: number;
  }) => {
    const isHovered = hoveredOption === id;

    return (
      <div
        className="flex items-center gap-2.5 animate-in fade-in slide-in-from-right-3 duration-300"
        style={{ animationDelay: `${delay}ms` }}
        onMouseEnter={() => setHoveredOption(id)}
        onMouseLeave={() => setHoveredOption(null)}
      >
        {/* Label with smooth transition */}
        <div
          className={`backdrop-blur-md bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg px-3 py-2 text-xs font-semibold whitespace-nowrap border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 ${
            isHovered ? "scale-105 shadow-xl" : "scale-100"
          }`}
        >
          <span className="bg-linear-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            {label}
          </span>
        </div>

        {/* Icon Button with enhanced effects */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative w-12 h-12 rounded-xl ${bgColor} ${hoverBgColor} text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group shrink-0 transform hover:scale-105 cursor-pointer`}
          aria-label={label}
        >
          {/* Glowing background effect */}
          <div
            className={`absolute inset-0 rounded-xl ${bgColor} opacity-40 blur-lg group-hover:opacity-60 transition-all duration-300`}
          ></div>

          {/* Shine effect on hover */}
          <div className="absolute inset-0 rounded-xl bg-linear-to-tr from-white/0 via-white/20 to-white/0 group-hover:via-white/30 transition-all duration-300"></div>

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </a>
      </div>
    );
  };

  const inner = (
    <div className="flex flex-col items-end gap-4 relative z-30">
      {/* Background Overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 pointer-events-none"
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* "Get in Touch" Header with glassmorphism */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-xl p-3.5 border border-white/20 dark:border-gray-700/50 max-w-70">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <h3 className="text-xs font-bold bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              We're Here to Help!
            </h3>
          </div>
          <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            Have questions? Reach out via your preferred channel. We respond
            within minutes! ⚡
          </p>
        </div>
      )}
      {/* Contact Options - Stack vertically */}
      {isOpen && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
          {/* WhatsApp - Top */}
          {hasWhatsApp && (
            <ContactOption
              id="whatsapp"
              delay={50}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.262-.735 1.439-1.44.173-.703.173-1.307.12-1.44-.053-.133-.198-.223-.446-.372z" />
                </svg>
              }
              label="💬 Chat on WhatsApp"
              href={storeInfo.whatsappLink}
              bgColor="bg-linear-to-br from-green-400 via-green-500 to-green-600"
              hoverBgColor="hover:from-green-500 hover:via-green-600 hover:to-green-700"
            />
          )}

          {/* Messenger - Bottom */}
          {hasMessenger && (
            <ContactOption
              id="messenger"
              delay={100}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.006 0 11.177c0 3.549 1.832 6.705 4.633 8.548v5.59l4.24-2.327c1.13.314 2.33.485 3.587.485 6.627 0 12-5.006 12-11.177C24.24 5.006 18.867 0 12 0zm0 19.75c-1.064 0-2.098-.15-3.073-.43l-.348-.096-2.4 1.316v-2.9l-.348-.217C3.36 16.157 1.5 13.72 1.5 11.177 1.5 6.13 6.21 2.25 12 2.25S22.5 6.13 22.5 11.177c0 4.947-4.71 8.827-10.5 8.827z" />
                </svg>
              }
              label="📱 Message on Facebook"
              href={storeInfo.messengerLink}
              bgColor="bg-linear-to-br from-blue-400 via-blue-500 to-blue-600"
              hoverBgColor="hover:from-blue-500 hover:via-blue-600 hover:to-blue-700"
            />
          )}
        </div>
      )}
      {/* Main Chat Button - Professional Design */}
      <div className="relative group/main">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 via-indigo-600 to-purple-700 hover:from-purple-600 hover:via-indigo-700 hover:to-purple-800 text-white shadow-xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center z-30 shrink-0 transform hover:scale-105 ${
            isOpen
              ? "ring-4 ring-purple-400/50 dark:ring-purple-500/50 scale-105"
              : ""
          }`}
          aria-label={isOpen ? "Close contact menu" : "Contact us"}
        >
          {/* Glowing animated background */}
          <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-30 blur-xl transition-all duration-300 animate-pulse"></div>

          {/* Rotating gradient ring */}
          <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-75 blur transition-all duration-300 animate-spin-slow"></div>

          {/* Button content */}
          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? (
              <X
                size={22}
                className="transition-all duration-300 transform rotate-90"
              />
            ) : (
              <>
                <MessageCircle
                  size={22}
                  className="group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
                />
              </>
            )}
          </div>

          {/* Enhanced notification badge */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-linear-to-br from-red-400 to-red-600 text-[9px] font-bold border-2 border-white dark:border-gray-900 shadow-lg">
                2
              </span>
            </span>
          )}
        </button>

        {/* Tooltip on hover */}
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/main:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap">
            <div className="backdrop-blur-md bg-linear-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-xl shadow-xl border border-white/20 font-semibold text-xs">
              Need Help? Chat with us! 💬
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5">
                <div className="w-2 h-2 bg-purple-600 rotate-45 border-r border-t border-white/20"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return inner;
  return (
    <div className="fixed right-4 bottom-24 sm:bottom-6 z-30 floating-contact-above-nav">
      {inner}
    </div>
  );
}
