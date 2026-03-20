import axiosInstance from "@/utils/axiosInstance";

export interface TopbarConfig {
  isActive: boolean;
  email: string;
  phone: string;
  bgColor: string;
  textColor: string;
  linkColor: string;
  wishlistLabel: string;
  wishlistPath: string;
  trackOrderLabel: string;
  trackOrderPath: string;
  showTrackOrder: boolean;
  showApplyForVendors?: boolean;
  applyForVendorsLabel?: string;
  applyForVendorsPath?: string;
}

const DEFAULT_TOPBAR: TopbarConfig = {
  isActive: true,
  email: "",
  phone: "",
  bgColor: "#ffffff",
  textColor: "#374151",
  linkColor: "#4f46e5",
  wishlistLabel: "My Wishlist",
  wishlistPath: "/wishlist",
  trackOrderLabel: "Track Order",
  trackOrderPath: "/track-order",
  showTrackOrder: true,
  showApplyForVendors: false,
  applyForVendorsLabel: "Apply for Vendors",
  applyForVendorsPath: "/apply-vendor",
};

export type SupportedLang = "en" | "bn";

export interface PixelSettings {
  isActive: boolean;
  metaPixelId: string;
  googleTagManagerId: string;
  googleAnalyticsId: string;
}

export interface LanguageSettings {
  isActive: boolean;
  defaultLang: SupportedLang;
  enabled: Record<SupportedLang, boolean>;
}

export type Translations = Record<
  string,
  Record<string, Record<string, string>>
>;

interface ConfigRes {
  message: string;
  data: {
    searchPlaceholder: string;
    topbar?: Partial<TopbarConfig>;
    languageSettings?: Partial<LanguageSettings>;
    translations?: Translations;
    pixelSettings?: Partial<PixelSettings>;
  };
}

const DEFAULT_PLACEHOLDER = "Search products, brands...";
const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  isActive: true,
  defaultLang: "en",
  enabled: { en: true, bn: true },
};

const DEFAULT_PIXEL_SETTINGS: PixelSettings = {
  isActive: false,
  metaPixelId: "",
  googleTagManagerId: "",
  googleAnalyticsId: "",
};

export const configApi = {
  get: () =>
    axiosInstance
      .get<ConfigRes>("/config")
      .then((r) => r.data.data?.searchPlaceholder ?? DEFAULT_PLACEHOLDER)
      .catch(() => DEFAULT_PLACEHOLDER),

  getConfig: () =>
    axiosInstance.get<ConfigRes>("/config").then((r) => ({
      searchPlaceholder: r.data.data?.searchPlaceholder ?? DEFAULT_PLACEHOLDER,
      topbar: {
        ...DEFAULT_TOPBAR,
        ...(r.data.data?.topbar ?? {}),
      } as TopbarConfig,
      languageSettings: {
        ...DEFAULT_LANGUAGE_SETTINGS,
        ...(r.data.data?.languageSettings ?? {}),
      } as LanguageSettings,
      translations: (r.data.data?.translations ?? {}) as Translations,
      pixelSettings: {
        ...DEFAULT_PIXEL_SETTINGS,
        ...(r.data.data?.pixelSettings ?? {}),
      } as PixelSettings,
    })),

  getTopbar: (): Promise<TopbarConfig> =>
    configApi.getConfig().then((c) => c.topbar),
};
