import { useEffect, useState } from "react";
import MainLayout from "@/components/templates/MainLayout";
import CategoryBar from "@/components/home/CategoryBar";
import HomeSectionRenderer from "@/components/home/HomeSectionRenderer";
import HomeSlider from "@/components/home/Slider";
import NoticeSlider from "@/components/home/NoticeSlider";
import TopCategories from "@/components/home/TopCategories";
import FloatingRightActions from "@/components/home/FloatingRightActions";
import HomePopup from "@/components/home/HomePopup";
import TopBrands from "@/components/home/TopBrands";
import { homeSectionsApi, type HomeSection } from "@/api/homeSections";
import { slidersApi, type Slider } from "@/api/sliders";
import { noticesApi, type Notice } from "@/api/notices";

/**
 * Home page: Content from admin Home Sections only. No dummy data or static text.
 * SUPARADMIN creates sections via Dashboard → Content → Home Sections.
 * No Add/Edit section pages — use Home Sections modals.
 */
export default function Home() {
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([
      homeSectionsApi.getAll().catch(() => []),
      slidersApi.getAll().catch(() => []),
      noticesApi.getAll().catch(() => []),
    ])
      .then(([sections, sliderData, noticesData]) => {
        const sectionsArray = Array.isArray(sections) ? sections : [];
        if (import.meta.env.DEV) {
          console.log(
            "[Home] Loaded home sections:",
            sectionsArray.map((s) => ({
              id: s.id,
              name: s.name,
              icon: s.icon,
              hasIcon: !!s.icon,
            })),
          );
        }
        setHomeSections(sectionsArray);
        setSliders(Array.isArray(sliderData) ? sliderData : []);
        setNotices(Array.isArray(noticesData) ? noticesData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isCountdownExpired = (section: HomeSection): boolean => {
    if (!section.countdownEnd) return false;
    const endTime = Date.parse(section.countdownEnd);
    if (Number.isNaN(endTime)) return false;
    return endTime <= now;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg aspect-[4/5] animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Top Categories and Slider Section */}
      {sliders.length > 0 && (
        <section className="w-full bg-gray-50 dark:bg-gray-900 pt-1 pb-3 sm:py-4">
          <div className="w-full px-3 sm:px-4 lg:px-8">
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* TOP CATEGORIES - Left Side */}
                <TopCategories />
                {/* Main Slider - Right Side */}
                <div className="flex-1 min-w-0">
                  <HomeSlider sliders={sliders} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Notice Slider - appears before categories */}
      <NoticeSlider notices={notices} />
      {/* Categories slider - appears after notice slider */}
      <CategoryBar />
      {homeSections
        .filter((section) => !isCountdownExpired(section))
        .map((section) => (
          <HomeSectionRenderer key={section.id} section={section} />
        ))}
      {/* Top Brands Section */}
      <TopBrands />
      {/* Right: Chat icon (img 1) + scroll-to-top below it */}
      <FloatingRightActions />
      {/* Home Page Popup */}
      <HomePopup />
    </MainLayout>
  );
}
