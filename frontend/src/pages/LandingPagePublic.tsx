import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { toImageUrl } from "@/utils/imageUrl";

type PublicLandingPage = {
  id: string;
  title: string;
  slug: string;
  template?: string;
  templateName?: string;
  templateHtml?: string | null;
  templateCss?: string | null;
  templateJs?: string | null;
  product?: {
    id: string;
    name: string;
    slug: string;
    images?: string[];
  } | null;
  heroHeadline?: string | null;
  heroText?: string | null;
  videoUrl?: string | null;
  primaryColor?: string | null;
  thumbnail?: string | null;
};

export default function LandingPagePublic() {
  const [searchParams] = useSearchParams();
  const slug = (searchParams.get("slug") || "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<PublicLandingPage | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!slug) {
      setLoading(false);
      setError("Missing slug in URL. Use /landing.php?slug=your-slug");
      return;
    }

    setLoading(true);
    setError(null);

    axiosInstance
      .get<{ data?: { landingPage?: PublicLandingPage } }>(
        `/landing-pages/slug/${encodeURIComponent(slug)}`,
      )
      .then((res) => {
        if (!isMounted) return;

        const landingPage = res.data?.data?.landingPage ?? null;
        if (!landingPage) {
          setError("Landing page not found.");
          setPage(null);
          return;
        }

        setPage(landingPage);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Landing page not found.");
        setPage(null);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const heroImage = useMemo(() => {
    if (page?.thumbnail) return toImageUrl(page.thumbnail);
    if (page?.product?.images?.[0]) return toImageUrl(page.product.images[0]);
    return "";
  }, [page]);

  const brandColor = page?.primaryColor || "#4f46e5";

  const templateDocument = useMemo(() => {
    if (!page) return "";

    const html = page.templateHtml?.trim() || "";
    const css = page.templateCss?.trim() || "";
    const js = page.templateJs?.trim() || "";

    if (!html && !css && !js) return "";

    const landingData = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      templateName: page.templateName || page.template || "",
      heroHeadline: page.heroHeadline || "",
      heroText: page.heroText || "",
      videoUrl: page.videoUrl || "",
      primaryColor: page.primaryColor || "",
      thumbnail: page.thumbnail || "",
      product: page.product || null,
      apiBase: "/api/v1",
      baseUrl: import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:8000",
    };

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    window.LANDING_PAGE_DATA = ${JSON.stringify(landingData)};
  </script>
  <script>
    ${js}
  </script>
</body>
</html>`;
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <p className="text-slate-600">Loading landing page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            Landing Page
          </h1>
          <p className="text-slate-600 mb-5">
            {error || "Landing page is unavailable."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (templateDocument) {
    return (
      <iframe
        title={page.title}
        srcDoc={templateDocument}
        className="w-full min-h-screen border-0 bg-white"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(1000px 350px at 20% 0%, ${brandColor}, transparent 60%)`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 mb-3">
                {page.templateName || page.template || "Landing Page"}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-slate-900">
                {page.heroHeadline || page.title}
              </h1>
              <p className="text-slate-600 mt-4 text-base sm:text-lg">
                {page.heroText ||
                  "Explore this offer and complete your order in minutes."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {page.product?.slug ? (
                  <Link
                    to={`/product/${page.product.slug}`}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-semibold"
                    style={{ backgroundColor: brandColor }}
                  >
                    Buy Now
                  </Link>
                ) : (
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-semibold"
                    style={{ backgroundColor: brandColor }}
                  >
                    Explore Products
                  </Link>
                )}
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Go Home
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={page.title}
                  className="w-full aspect-[4/3] object-cover rounded-xl"
                />
              ) : (
                <div
                  className="w-full aspect-[4/3] rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor}, #0f172a)`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
