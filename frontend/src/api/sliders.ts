import axiosInstance from "@/utils/axiosInstance";

export interface Slider {
  id: number;
  title: string | null;
  image: string;
  link: string | null;
  buttonTitle: string | null;
  buttonLink: string | null;
  description: string | null;
}

interface SlidersRes {
  message: string;
  data: Slider[];
}

export const slidersApi = {
  getAll: () =>
    axiosInstance.get<SlidersRes>("/sliders").then((r) => r.data.data ?? []),
};
