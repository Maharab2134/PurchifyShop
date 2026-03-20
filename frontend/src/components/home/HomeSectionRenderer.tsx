import ProductSection from "@/components/product/ProductSection";
import PromotionalCards from "./PromotionalCards";
import PromotionalBanner from "./PromotionalBanner";
import CountdownTimerSection from "./CountdownTimerSection";
import CountdownGridSection from "./CountdownGridSection";
import ProductCarousel from "./ProductCarousel";
import CategoryShowcase from "./CategoryShowcase";
import SplitLayout from "./SplitLayout";
import ImageBanner from "./ImageBanner";
import FeaturesGridSection from "./FeaturesGridSection";
import type { HomeSection } from "@/api/homeSections";

interface HomeSectionRendererProps {
  section: HomeSection;
}

export default function HomeSectionRenderer({
  section,
}: HomeSectionRendererProps) {
  const themeType = section.themeType || "PRODUCT_GRID";

  switch (themeType) {
    case "PROMOTIONAL_CARDS":
      return <PromotionalCards section={section} />;

    case "PROMOTIONAL_BANNER":
      return <PromotionalBanner section={section} />;

    case "COUNTDOWN_TIMER":
      return <CountdownTimerSection section={section} />;

    case "COUNTDOWN_GRID":
      return <CountdownGridSection section={section} />;

    case "PRODUCT_CAROUSEL":
      return <ProductCarousel section={section} />;

    case "CATEGORY_SHOWCASE":
      return <CategoryShowcase section={section} />;

    case "SPLIT_LAYOUT":
      return <SplitLayout section={section} />;

    case "IMAGE_BANNER":
      return <ImageBanner section={section} />;

    case "FEATURES_GRID":
      return <FeaturesGridSection section={section} />;

    case "PRODUCT_GRID":
    default:
      return (
        <ProductSection
          title={section.title || section.name}
          products={section.products || []}
          loading={false}
          error={null}
          showTitle={true}
          singleLineTitle={true}
          viewMoreSlug={section.slug || undefined}
          countdownEnd={section.countdownEnd || undefined}
          icon={section.icon || undefined}
          image={section.image || undefined}
        />
      );
  }
}
