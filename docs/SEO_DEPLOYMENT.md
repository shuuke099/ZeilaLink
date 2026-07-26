# ZeilaLink SEO deployment and indexing

This guide covers the production steps that cannot be completed by application
code alone. The canonical production origin is `https://zeilalink.com`.

## P0: make the real application publicly reachable

On July 26, 2026, the apex domain resolved to `192.34.60.238`, but ports 80 and
443 did not accept a public connection during verification. Search results still
showed a previously crawled “Launching Soon” parking page. Until the domain
serves the Next.js application over HTTPS, Google and Bing cannot crawl the SEO
work in this repository.

Complete these checks before submitting the site to a search engine:

1. Point the apex `A` record for `zeilalink.com` at the production server.
2. Point `www.zeilalink.com` at the apex with a `CNAME`.
3. Allow inbound TCP 80 and 443 in the server and provider firewalls.
4. Install a valid TLS certificate covering both hostnames.
5. Proxy the apex hostname to Next.js on `127.0.0.1:3000`.
6. Redirect every HTTP request and every `www` request to the canonical HTTPS
   apex URL, preserving the path and query string.
7. Remove or disconnect the registrar/hosting-provider parking page.

A minimal Nginx shape is shown below. Certificate paths depend on the TLS setup
and must be replaced with the real paths:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name zeilalink.com www.zeilalink.com;
    return 301 https://zeilalink.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.zeilalink.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    return 301 https://zeilalink.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name zeilalink.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Keep the Express API private on `127.0.0.1:7000`; Next.js already proxies
same-origin `/api` requests to it.

## Production environment

The public values below must be present during `next build`. They are embedded
in public metadata and are not secrets.

| Variable | Required | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://zeilalink.com` |
| `INTERNAL_API_ORIGIN` | Recommended; same-server default is built in | `http://127.0.0.1:7000` |
| `NEXT_PUBLIC_API_URL` | Yes | `/api` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | After Search Console setup | Verification token only |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | After Bing setup | Verification token only |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | `G-ABC1234567` |

The GitHub deployment reads the public SEO values from repository-level Actions
variables. Add them under **Settings → Secrets and variables → Actions →
Variables**, then redeploy. PM2 also preserves them in the frontend process.

## Crawl endpoints

After deployment, all of these requests must return `200` from the canonical
host:

```bash
curl -I https://zeilalink.com/
curl -I https://zeilalink.com/robots.txt
curl -I https://zeilalink.com/sitemap.xml
curl -I https://zeilalink.com/manifest.webmanifest
curl -I https://zeilalink.com/opengraph-image
```

Also verify canonical redirects:

```bash
curl -I http://zeilalink.com/
curl -I https://www.zeilalink.com/
```

Both should return a permanent redirect whose `Location` is
`https://zeilalink.com/`.

The sitemap always includes the public hubs and static information pages. It
loads published jobs, training programs, services, opted-in workers, and
verified businesses from the internal API, using `slug` when available and
otherwise the existing `id`. The public directory endpoints are:

- `/api/public/workers`
- `/api/public/businesses`

If an API is unavailable, that collection is omitted while the rest of the
sitemap and every public hub remain available. Worker profiles are included only
when the verified worker explicitly opts into public discovery. The public
directory responses exclude private email, phone, resume, application,
certificate-file, salary-preference, and account data.

## Google Search Console

1. Create a **Domain property** for `zeilalink.com`.
2. Add the DNS TXT verification record supplied by Google.
3. Optionally add its HTML verification token to
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy.
4. Submit `https://zeilalink.com/sitemap.xml`.
5. Use URL Inspection and **Test live URL** for:
   - the home page;
   - `/jobs`, `/training`, `/services`, `/workers`, and `/businesses`;
   - several real detail pages from each public collection.
6. Request indexing for the home page and the highest-value real pages.
7. Inspect Page Indexing, HTTPS, Core Web Vitals, and Rich Results reports.
8. After the live test shows ZeilaLink rather than the parking page, request
   re-indexing of the home page so the old “Launching Soon” result can be
   replaced.

Search visibility is not immediate. Crawling and brand-query changes commonly
take days or weeks, and ranking is never guaranteed by metadata alone.

## Bing Webmaster Tools

1. Add `https://zeilalink.com` or import the verified Search Console property.
2. Complete DNS or meta-tag verification.
3. Set `NEXT_PUBLIC_BING_SITE_VERIFICATION` to the token if using the meta tag.
4. Submit `https://zeilalink.com/sitemap.xml`.
5. Run URL Inspection on the home page and representative detail pages.

## Google Analytics 4

1. Create a GA4 web data stream for `https://zeilalink.com`.
2. Put its `G-...` measurement ID in `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
3. Redeploy; analytics is omitted completely when the value is blank or invalid.
4. Open the site and confirm a page view in the GA Realtime report.
5. Confirm the browser console has no Content Security Policy errors.
6. Apply the consent and privacy controls required in every jurisdiction where
   ZeilaLink operates. The privacy and cookie pages describe the optional
   analytics category, but legal review remains an operational responsibility.

## Structured data and page checks

Test representative URLs with Google Rich Results Test and Schema.org Validator.
The root layout publishes `WebSite` and `Organization` data. Detail pages should
publish the matching real-world type:

- `JobPosting` for a published, active job;
- `Course` for a public training program;
- `Service` for a public service;
- `LocalBusiness` or `Organization` for an actual business;
- `BreadcrumbList` for hubs and detail pages.

Do not publish structured ratings, reviews, locations, salaries, or availability
that are demo content or are not visible and true on the page.

Each public page should have one permanent canonical URL, a unique title and
description, one clear `h1`, useful English and Somali copy, descriptive image
alternative text, and links to related public pages. Use one immutable unique
slug per public record and keep old ID URLs as permanent redirects when slugs are
introduced.

## Brand consistency

Use the exact spelling **ZeilaLink** on the website, structured data, email
sender, social profiles, business listings, and reputable external references.
Those consistent citations and links help search engines associate the brand
query “ZeilaLink” with this domain.
