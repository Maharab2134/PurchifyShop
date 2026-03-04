import axiosInstance from "@/utils/axiosInstance";

export interface PublicPage {
  updatedAt: string | number | Date;
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  images?: string[] | null;
  isActive: boolean;
}

interface PublicPagesRes {
  data: {
    pages: PublicPage[];
  };
}

interface PublicPageRes {
  data: {
    page: PublicPage;
  };
}

export const pagesApi = {
  list: () => axiosInstance.get<PublicPagesRes>("/pages"),
  getBySlug: (slug: string) =>
    axiosInstance.get<PublicPageRes>(`/pages/slug/${slug}`),
};
