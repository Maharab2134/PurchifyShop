import { storeInfoApi } from "@/api/storeInfo";
import { toImageUrl } from "@/utils/imageUrl";
import { sanitizePlainText } from "@/utils/sanitizeText";

export const updateFavicon = async () => {
  try {
    const storeInfo = await storeInfoApi.get();

    if (storeInfo.logo && storeInfo.logo.trim() !== "") {
      const faviconUrl = toImageUrl(storeInfo.logo);

      // Update favicon
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;

      // Also update apple-touch-icon if needed
      let appleTouchIcon: HTMLLinkElement | null = document.querySelector(
        "link[rel='apple-touch-icon']",
      );
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement("link");
        appleTouchIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleTouchIcon);
      }
      appleTouchIcon.href = faviconUrl;
    }

    // Update page title
    if (storeInfo.storeName && storeInfo.storeName.trim() !== "") {
      const cleanStoreName = sanitizePlainText(storeInfo.storeName);
      document.title = `${cleanStoreName} - Online Shopping Store`;
    }
  } catch (error) {
    console.error("Failed to update favicon:", error);
  }
};
