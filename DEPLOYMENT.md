# Website Refresh করলে 404 কেন হয় — এবং সমাধান

## কেন Refresh করলে 404 হয়?

এটি একটি **Single Page Application (SPA)**। একবার পেজ লোড হলে লিংক ক্লিক করলে সার্ভারে নতুন রিকোয়েস্ট যায় না — ব্রাউজারে React Router URL পরিবর্তন করে।

কিন্তু **Refresh** করলে বা **direct link** (যেমন `/track-order`, `/shop`, `/purchify/login`) ওপেন করলে ব্রাউজার সেই path টা নিয়ে সরাসরি সার্ভারে রিকোয়েস্ট করে। সার্ভার যদি শুধু **আসল ফাইল** (যেমন `index.html`, `style.css`) দেয় এবং অন্য path গুলোতে কিছু না থাকে, তাহলে সার্ভার **৪০৪ Not Found** দেয়।

**সমাধান:** সার্ভার কনফিগ করে এমন করতে হবে যেন **যেকোনো path** এ (যেখানে আলাদা ফাইল নেই) **সবসময় `index.html`** সার্ভ করা হয়। তাহলে React অ্যাপ লোড হবে এবং Router সঠিক পেজ দেখাবে। একে বলে **SPA fallback**।

---

## কি করতে হবে

### cPanel use করলে (প্রধান ধাপ)

cPanel এ সাধারণত **Apache** চলে এবং **`.htaccess`** দিয়ে SPA fallback দিতে হয়। নিচের যেটা আপনার সেটআপের সাথে মিলে সেটা follow করুন।

#### সেটআপ ১: Frontend + Backend একসাথে (Laravel, এক ডোমেইন)

যদি সাইটের **Document Root** টা Laravel এর **`public`** ফোল্ডার (যেমন `public_html` না, বরং `public_html/your-site/public` বা subdomain এর root = `public`):

1. **Frontend build:** লোকালে `frontend` ফোল্ডারে `npm run build` চালান।
2. **cPanel File Manager** এ যান। যে ফোল্ডার **Document Root** (যেখানে `index.php` এবং Laravel এর `.htaccess` আছে) সেখানে যান।
3. **`frontend/dist/`** এর ভেতরের সব জিনিস (`index.html`, `assets/` ফোল্ডার ইত্যাদি) **কপি/আপলোড** করুন এই Document Root এ।
4. **মুছবেন না / ওভাররাইট করবেন না:** `index.php` এবং `.htaccess`। শুধু নতুন `index.html` ও `assets/` যোগ করুন।
5. কোডে ইতিমধ্যে **Laravel SPA fallback** আছে — যেকোনো path এ `index.html` সার্ভ করবে। তাই রিফ্রেশ করলে আর ৪০৪ হবে না।

#### সেটআপ ২: শুধু Frontend (static) cPanel এ

যদি শুধু frontend টা cPanel এ আপলোড করেন (যেমন `public_html` বা subdomain এর root = frontend):

1. **Build:** লোকালে `frontend` এ `npm run build` চালান।
2. **`frontend/dist/`** এর **সব কিছু** (ভেতরের `index.html`, `assets/`, `.htaccess` ইত্যাদি) **cPanel File Manager** দিয়ে আপনার সাইটের **Document Root** এ আপলোড করুন (যেমন `public_html` বা subdomain এর root)।
3. **`.htaccess` থাকা জরুরি:** Build করলে `frontend/public/.htaccess` টা `dist/` এর ভেতরে কপি হয়। আপলোডের পর **File Manager** এ চেক করুন Document Root এ **`.htaccess`** ফাইল আছে কিনা। নেই থাকলে নিচের কন্টেন্ট দিয়ে একটা বানান এবং সেই ফোল্ডারে সেভ করুন।

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

4. **যদি তারপরও রিফ্রেশে ৪০৪ হয়:**  
   - cPanel এ **MultiPHP INI Editor** বা **Select PHP Version** এ গিয়ে দেখুন **mod_rewrite** / Apache rewrite চালু আছে কিনা (অধিকাংশ cPanel এ ডিফল্টই চালু থাকে)।  
   - **File Manager** এ `.htaccess` এর নাম সঠিক আছে কিনা (শুধু `.htaccess`, অন্য কিছু না) এবং ফাইলটা যেন Document Root এই থাকে (যেখানে `index.html` আছে)।  
   - কোনো **Cloudflare / proxy** থাকলে Cache একবার **Purge** করে আবার টেস্ট করুন।

এই সেটআপে যেকোনো পেজে রিফ্রেশ করলে ৪০৪ হওয়া উচিত না।

---

### যদি Apache ব্যবহার করেন (সাধারণ)

Frontend এর `npm run build` করলে `frontend/dist/` এ যে ফাইলগুলো আসে সেগুলো সাইটের **Document Root** এ আপলোড করুন। `frontend/public/.htaccess` ফাইলটি build এর সময় `dist/` এর ভেতরে কপি হয়। নিশ্চিত করুন:

1. **mod_rewrite** চালু আছে।
2. **AllowOverride All** (বা অন্তত FileInfo) সেই ফোল্ডারের জন্য সেট করা আছে যেখানে সাইট আপলোড করেছেন।

`.htaccess` এ এই রুলস থাকা দরকার (ইতিমধ্যে `frontend/public/.htaccess` এ আছে):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

এরপর সাইট রিলোড/রিস্টার্ট দিন। তারপর যেকোনো পেজে গিয়ে Refresh করলে আর ৪০৪ হওয়া উচিত না।

---

### যদি Nginx ব্যবহার করেন

`.htaccess` Nginx এ কাজ করে না। Nginx কনফিগ ফাইলে (যেখানে `server { ... }` ব্লক আছে) **location /** এর জন্য এই ব্লক যোগ বা আপডেট করুন:

```nginx
server {
    # ... আপনার অন্যান্য সেটিং (root, index, ইত্যাদি) ...

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`root` যেন সেই ডাইরেক্টরি হয় যেখানে build এর `index.html` এবং `assets/` ফোল্ডার আছে।  
কনফিগ সেভ করার পর Nginx রিলোড করুন:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

এরপর যেকোনো পেজে Refresh করলে ৪০৪ হওয়া উচিত না।

---

### Option: Frontend + Backend একই সার্ভারে (Laravel public)

যদি frontend build টা **Laravel এর `backend/public/`** এ কপি করেন (একই ডোমেইন, API ও সাইট একসাথে):

1. `frontend` এ `npm run build` চালান।
2. `frontend/dist/` এর **শুধু ভেতরের জিনিস** কপি করুন `backend/public/` এ।  
   **খেয়াল রাখুন:** `backend/public/index.php` এবং `backend/public/.htaccess` **মুছবেন না বা ওভাররাইট করবেন না**। শুধু `index.html` এবং `assets/` ফোল্ডার ইত্যাদি যোগ/আপডেট করুন।
3. কোডবেসে ইতিমধ্যে **Laravel fallback** যোগ করা আছে (`backend/routes/web.php`): যেকোনো path (যা API না) এ `index.html` সার্ভ করবে। তাই রিফ্রেশ করলে আর ৪০৪ হবে না।

এই সেটআপে আলাদা Apache/Nginx SPA রুল লাগে না — Laravel নিজেই SPA fallback দিচ্ছে।

---

### Vercel / Netlify

- **Vercel:** প্রজেক্টে `frontend/vercel.json` আছে — ডিপ্লয় করলেই রিফ্রেশ ঠিক থাকবে।
- **Netlify:** প্রজেক্টে `frontend/netlify.toml` আছে — ডিপ্লয় করলেই রিফ্রেশ ঠিক থাকবে।

---

### Nginx (standalone frontend)

`frontend/nginx.conf.example` ফাইলটি দেখুন। আপনার সাইটের `server { }` ব্লকে `location / { try_files $uri $uri/ /index.html; }` যোগ করে Nginx রিলোড করুন।

---

## সংক্ষেপে

| সমস্যা | কারণ | সমাধান |
|--------|------|--------|
| Refresh / direct link এ ৪০৪ | সার্ভার সেই path এ কোন ফাইল পাচ্ছে না | সব অজানা path এ `index.html` সার্ভ করতে হবে (SPA fallback) |
| **cPanel** (Laravel এক ডোমেইন) | — | Frontend build কপি করুন Document Root (Laravel `public`) এ। `index.php` ও `.htaccess` রাখুন। Laravel fallback ইতিমধ্যে আছে। |
| **cPanel** (শুধু frontend) | `.htaccess` লাগে | `dist/` এর সব (`.htaccess` সহ) Document Root এ আপলোড করুন। উপরে cPanel ধাপ দেখুন। |
| Apache (standalone frontend) | `.htaccess` রুল + AllowOverride + mod_rewrite | `frontend/public/.htaccess` বিল্ডে কপি হয় — চেক করুন |
| Nginx (standalone frontend) | `.htaccess` কাজ করে না | `location / { try_files $uri $uri/ /index.html; }` বা `frontend/nginx.conf.example` দেখুন |
| Frontend Laravel public এ | একই সার্ভার, এক ডোমেইন | Frontend build কপি করুন `backend/public/` এ (index.php ও .htaccess রাখুন)। Laravel fallback ইতিমধ্যে আছে। |
| Vercel / Netlify | — | `vercel.json` / `netlify.toml` ইতিমধ্যে আছে। |

---

## Sitemap (SEO) – ডায়নামিক

**Laravel দিয়ে ডিপ্লয় করলে:** সাইটম্যাপ **ডায়নামিক** জেনারেট হয়। **`APP_URL`** (`.env` এ) যেই ডোমেইন সেট করা থাকবে, সাইটম্যাপে সেই ডোমেইনই ব্যবহার হবে – আলাদা কিছু রিপ্লেস করতে হবে না।

- **রাউট:** `GET /sitemap.xml` → `SitemapController` (ব্যাকএন্ড)
- **বেস URL:** `config('app.url')` = `.env` এর `APP_URL`
- **ডায়নামিক URL:** প্রোডাক্ট (`/product/{slug}`), পেজ (`/page/{slug}`), সেকশন (`/section/{slug}`) ডাটাবেস থেকে নিয়ে যোগ হয়

**কি করতে হবে:** `.env` এ **`APP_URL=https://your-real-domain.com`** সেট করুন (ট্রেইলিং স্ল্যাশ ছাড়া)। তারপর `https://your-real-domain.com/sitemap.xml` ওপেন করলে অরিজিনাল ডোমেইন ও সব প্রোডাক্ট/পেজ/সেকশন ইউআরএল দেখাবে।

**শুধু ফ্রন্টএন্ড (static) ডিপ্লয় করলে:** বিল্ডের আগে `frontend/.env` এ **`VITE_APP_URL=https://your-real-domain.com`** সেট করুন (ট্রেইলিং স্ল্যাশ ছাড়া)। `npm run build` চালালে সাইটম্যাপ অটো জেনারেট হবে সেই ডোমেইন দিয়ে – ডেমো (yoursite.com) আর দেখাবে না।

**Google Search Console:** Sitemaps → Add new sitemap → `sitemap.xml` সাবমিট করুন।

---

## Google এ "purchifyshop" সার্চে সাইট দেখানোর জন্য

গুগলে **"purchifyshop"** লিখে সাইট না এলে সাধারণত সাইটটা **ইনডেক্স হয়নি**। নিচের স্টেপগুলো করুন:

### ১. Google Search Console এ সাইট যোগ করুন

1. **[Google Search Console](https://search.google.com/search-console)** ওপেন করুন। Google অ্যাকাউন্ট দিয়ে লগইন করুন।
2. **"Add property"** বা **"Property যোগ করুন"** ক্লিক করুন।
3. **URL prefix** সিলেক্ট করে ঠিকানা দিন: **`https://purchifyshop.com`**
4. ভেরিফিকেশন: **HTML file upload** বা **HTML tag** (মেটা ট্যাগ) দিয়ে ভেরিফাই করুন। সাইটে সেই ফাইল/ট্যাগ যোগ করে **Verify** ক্লিক করুন।

### ২. Sitemap সাবমিট করুন

1. Search Console এ আপনার প্রপার্টি সিলেক্ট করুন।
2. বাম পাশে **Sitemaps** এ ক্লিক করুন।
3. **"Add a new sitemap"** এ লিখুন: **`sitemap.xml`** → **Submit**।
4. কয়েক ঘণ্টা/দিনের মধ্যে গুগল সাইটম্যাপ ক্রল করবে।

### ৩. হোমপেজের জন্য Indexing রিকয়েস্ট (ঐচ্ছিক)

1. Search Console এ উপরে **URL Inspection** (অথবা "URL পরিদর্শন") ওপেন করুন।
2. লিখুন: **`https://purchifyshop.com`** → Enter।
3. **"Request indexing"** / **"ইনডেক্সিং অনুরোধ করুন"** ক্লিক করুন।

### ৪. কত দিন লাগে?

- সাধারণত **কয়েক দিন থেকে ১–২ সপ্তাহ** সময় লাগে।
- নতুন সাইট হলে গুগল একবার ক্রল করার পরই "purchifyshop" বা সাইটের নাম দিয়ে সার্চে ধীরে ধীরে আসতে পারে।

প্রজেক্টে **robots.txt** (Allow + Sitemap লিংক) এবং **index.html** এ **keywords** ও **canonical** যোগ করা আছে; রিডিপ্লয় করুন যাতে লাইভ সাইটে এগুলো চলে যায়।
