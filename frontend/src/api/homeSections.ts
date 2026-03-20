import axiosInstance from "@/utils/axiosInstance";
import type { Product } from "@/api/products";

export type ThemeType =
  | "PRODUCT_GRID"
  | "PROMOTIONAL_CARDS"
  | "PROMOTIONAL_BANNER"
  | "COUNTDOWN_TIMER"
  | "COUNTDOWN_GRID"
  | "PRODUCT_CAROUSEL"
  | "CATEGORY_SHOWCASE"
  | "SPLIT_LAYOUT"
  | "IMAGE_BANNER"
  | "FEATURES_GRID";

export interface HomeSection {
  id: number;
  name: string;
  slug: string;
  themeType?: ThemeType;
  title?: string | null;
  description?: string | null;
  subtitle?: string | null;
  themeData?: Record<string, any>;
  backgroundColor?: string | null;
  textColor?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  sortOrder: number;
  products: Product[];
  countdownEnd?: string | null;
  icon?: string | null;
  image?: string | null;
}

interface HomeSectionsRes {
  message: string;
  data: HomeSection[];
}

export const homeSectionsApi = {
  getAll: () =>
    axiosInstance
      .get<HomeSectionsRes>("/home-sections")
      .then((r) => r.data.data ?? []),

  getBySlug: async (slug: string): Promise<HomeSection | null> => {
    const { data } = await axiosInstance.get<HomeSectionsRes>("/home-sections");
    const list = Array.isArray(data?.data) ? data.data : [];
    return (
      list.find((s) => (s.slug || "").toLowerCase() === slug.toLowerCase()) ??
      null
    );
  },
};
