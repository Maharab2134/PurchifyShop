/**
 * Build-time: Generate sitemap.xml with your website URL from .env.
 * Uses FRONTEND_URL (or VITE_APP_URL) as the site base URL.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');
const templatePath = join(root, 'public', 'sitemap.template.xml');
const sitemapPath = join(root, 'public', 'sitemap.xml');

const FALLBACK = 'https://purchifyshop.com';

let base = FALLBACK;
try {
  const env = readFileSync(envPath, 'utf8');
  const m1 = env.match(/FRONTEND_URL\s*=\s*["']?([^"'\s#]+)/);
  const m2 = env.match(/VITE_APP_URL\s*=\s*["']?([^"'\s#]+)/);
  if (m1 && m1[1]) base = m1[1].trim().replace(/\/+$/, '');
  else if (m2 && m2[1]) base = m2[1].trim().replace(/\/+$/, '');
} catch (_) {}

const template = readFileSync(templatePath, 'utf8');
const xml = template.replace(/__SITE_URL__/g, base);
writeFileSync(sitemapPath, xml, 'utf8');
console.log('[sitemap] Base URL:', base);
