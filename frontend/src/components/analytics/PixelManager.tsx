import { useEffect } from "react";
import { configApi } from "@/api/config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _purchifyPixelsLoaded?: boolean;
  }
}

function appendScript(id: string, src?: string, inlineCode?: string): void {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  if (src) {
    script.src = src;
  }
  if (inlineCode) {
    script.text = inlineCode;
  }
  document.head.appendChild(script);
}

export default function PixelManager() {
  useEffect(() => {
    if (window._purchifyPixelsLoaded) return;

    configApi
      .getConfig()
      .then((config) => {
        const pixel = config.pixelSettings;
        if (!pixel?.isActive) return;

        const metaPixelId = (pixel.metaPixelId || "").trim();
        const gtmId = (pixel.googleTagManagerId || "").trim();
        const gaId = (pixel.googleAnalyticsId || "").trim();

        if (gtmId) {
          appendScript(
            "gtm-script-loader",
            `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`,
          );
          appendScript(
            "gtm-script-inline",
            undefined,
            `window.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });`,
          );
        }

        if (gaId) {
          appendScript(
            "ga-script-loader",
            `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`,
          );
          appendScript(
            "ga-script-inline",
            undefined,
            `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${gaId}');`,
          );
        }

        if (metaPixelId) {
          appendScript(
            "meta-pixel-inline",
            undefined,
            `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\n n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\n t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',\n 'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '${metaPixelId}');\nfbq('track', 'PageView');`,
          );
        }

        window._purchifyPixelsLoaded = true;
      })
      .catch(() => {
        // Ignore config failures silently to avoid blocking storefront rendering.
      });
  }, []);

  return null;
}
