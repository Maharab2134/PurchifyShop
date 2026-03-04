import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
} from "lucide-react";
import { footerApi } from "@/api/footer";
import { storeInfoApi } from "@/api/storeInfo";
import { toImageUrl } from "@/utils/imageUrl";

interface FooterColumn {
  id: number;
  columnName: string;
  title: string | null;
  logoUrl?: string | null;
  links: Array<{ label: string; url: string }>;
  socialLinks?: Array<{ platform: string; url: string }>;
  contactInfo?: Array<{ type: string; value: string }>;
  content: string | null;
  sortOrder: number;
}

interface FooterData {
  columns: Record<string, FooterColumn[]>;
  copyright?: string | null;
  poweredBy?: string | null;
}

export default function Footer({ className = "" }: { className?: string }) {
  const [footerData, setFooterData] = useState<FooterData>({ columns: {} });
  const [storeInfo, setStoreInfo] = useState<{
    logo: string;
    storeName: string;
  }>({ logo: "", storeName: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch footer data and store info in parallel
    Promise.all([footerApi.get(), storeInfoApi.get()])
      .then(([footerData, storeInfoData]) => {
        if (
          footerData &&
          typeof footerData === "object" &&
          "columns" in footerData
        ) {
          setFooterData(footerData as FooterData);
        } else {
          setFooterData({
            columns: footerData as Record<string, FooterColumn[]>,
          });
        }
        setStoreInfo({
          logo: storeInfoData.logo || "",
          storeName: storeInfoData.storeName || "",
        });
      })
      .catch(() => {
        setFooterData({ columns: {} });
        setStoreInfo({ logo: "", storeName: "" });
      })
      .finally(() => setLoading(false));
  }, []);

  const getSocialIcon = (platform: string) => {
    const normalized = platform.toLowerCase();
    if (normalized.includes("facebook")) return Facebook;
    if (normalized.includes("instagram")) return Instagram;
    if (normalized.includes("youtube")) return Youtube;
    if (normalized.includes("whatsapp")) return MessageCircle;
    return null;
  };

  const getContactIcon = (type: string) => {
    if (type === "email") return Mail;
    if (type === "phone") return Phone;
    if (type === "address") return MapPin;
    return null;
  };

  const normalizeInternalUrl = (url: string) => {
    if (!url) return "/";
    if (url.startsWith("/")) return url;
    return `/${url}`;
  };

  if (loading) {
    return (
      <footer className={`mt-auto bg-white dark:bg-gray-900 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        </div>
      </footer>
    );
  }

  // Get column data
  const column1Items = footerData.columns["column1"] || [];
  const column2Items = footerData.columns["column2"] || [];
  const column3Items = footerData.columns["column3"] || [];
  const column4Items = footerData.columns["column4"] || [];

  // Get first item from each column for rendering
  const column1 = column1Items[0];
  const column2 = column2Items[0];
  const column3 = column3Items[0];
  const column4 = column4Items[0];
  const column1Content = column1Items.find(
    (item) => item.content && item.content.trim() !== "",
  );
  const column1Social = column1Items.find(
    (item) => (item.socialLinks?.length ?? 0) > 0,
  );

  return (
    <footer className={`mt-auto bg-white dark:bg-gray-900 ${className}`}>
      <div className="max-w-375 mx-auto px-3 sm:px-4 lg:px-12 py-8 sm:py-10 lg:py-12">
        {/* Main Footer Content - 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 lg:gap-20 mb-6 sm:mb-8">
          {/* Column 1: Logo, Description, Social Links */}
          <div className="space-y-4">
            {/* Logo and Company Name */}
            <div className="mb-4">
              {storeInfo.logo && (
                <Link
                  to="/"
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 mb-3"
                >
                  <img
                    src={toImageUrl(storeInfo.logo)}
                    alt={storeInfo.storeName || "Logo"}
                    className="h-auto max-h-16 sm:max-h-20"
                    loading="eager"
                    decoding="async"
                    style={{
                      imageRendering: "auto",
                      objectFit: "contain",
                      filter: "none",
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      WebkitFontSmoothing: "antialiased",
                      MozOsxFontSmoothing: "grayscale",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {storeInfo.storeName && storeInfo.storeName.trim() !== "" && (
                    <h2 className="company-name-gradient font-bold text-xl sm:text-2xl lg:text-3xl leading-tight tracking-tight">
                      {storeInfo.storeName}
                    </h2>
                  )}
                </Link>
              )}
              {!storeInfo.logo &&
                storeInfo.storeName &&
                storeInfo.storeName.trim() !== "" && (
                  <Link to="/">
                    <h2 className="company-name-gradient font-bold text-xl sm:text-2xl lg:text-3xl leading-tight tracking-tight mb-3">
                      {storeInfo.storeName}
                    </h2>
                  </Link>
                )}
            </div>

            {/* Description/Content */}
            {(column1Content?.content || column1?.content) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {column1Content?.content || column1?.content}
              </p>
            )}

            {/* Social Media Icons */}
            {column1Social?.socialLinks &&
              column1Social.socialLinks.length > 0 && (
                <div className="flex gap-3">
                  {column1Social.socialLinks.map((social, idx) => {
                    const Icon = getSocialIcon(social.platform);
                    if (!Icon) return null;
                    return (
                      <a
                        key={idx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                        aria-label={social.platform}
                      >
                        <Icon size={18} />
                      </a>
                    );
                  })}
                </div>
              )}
          </div>

          {/* Column 2: Contact Us */}
          {column2 && (
            <div className="space-y-4 pt-4 sm:pt-6 lg:pt-8 lg:pl-6">
              {column2.title && (
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {column2.title}
                </h3>
              )}

              {column2.contactInfo && column2.contactInfo.length > 0 && (
                <ul className="space-y-3">
                  {column2.contactInfo.map((contact, idx) => {
                    const Icon = getContactIcon(contact.type);
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        {Icon && (
                          <Icon
                            size={18}
                            className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0"
                          />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {contact.value}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Column 3: Quick Links */}
          {column3 && (
            <div className="space-y-4 pt-4 sm:pt-6 lg:pt-8 lg:pl-6">
              {column3.title && (
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {column3.title}
                </h3>
              )}

              {column3.links && column3.links.length > 0 && (
                <ul className="space-y-2">
                  {column3.links.map((link, idx) => (
                    <li key={idx}>
                      {link.url.startsWith("http") ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={normalizeInternalUrl(link.url)}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Column 4: Useful Links */}
          {column4 && (
            <div className="space-y-4 pt-4 sm:pt-6 lg:pt-8 lg:pl-6">
              {column4.title && (
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {column4.title}
                </h3>
              )}

              {column4.links && column4.links.length > 0 && (
                <ul className="space-y-2">
                  {column4.links.map((link, idx) => (
                    <li key={idx}>
                      {link.url.startsWith("http") ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={normalizeInternalUrl(link.url)}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()}
            <span className="ml-1 font-bold bg-linear-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">
              PurchifyShop
            </span>
            . All rights reserved.
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Developed by{" "}
            <a
              href="https://dev-maharab.netlify.app/"
              target="_blank"
              className="font-semibold bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80"
            >
              Md. Maharab Hosen
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
