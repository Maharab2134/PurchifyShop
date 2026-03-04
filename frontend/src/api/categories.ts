import axiosInstance from "@/utils/axiosInstance";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription?: string | null;
  images: string[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoriesRes {
  message: string;
  data: Category[];
}

interface CategoryRes {
  message: string;
  data: Category;
}

export const categoriesApi = {
  getAll: () => axiosInstance.get<CategoriesRes>("/categories"),
  getById: (id: string) => axiosInstance.get<CategoryRes>(`/categories/${id}`),
};
