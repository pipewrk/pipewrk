import { fetch } from "bun";

export interface Post {
  title: string;
  slug: string;
  url: string;
  coverImage: { url: string };
  description: string;
  publishedAt: string;
}

interface SitemapItem {
  url: string;
  lastmod: string;
}

// Helper to extract meta content
function getMeta(html: string, property: string): string {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']?${property}["']?[^>]+content=["']?([^"'>]+)["']?`, 'i');
  const match = html.match(regex);
  if (!match) {
    const altRegex = new RegExp(`<meta[^>]+content=["']?([^"'>]+)["']?[^>]+(?:property|name)=["']?${property}["']?`, 'i');
    const altMatch = html.match(altRegex);
    return altMatch ? altMatch[1] : "";
  }
  return match ? match[1] : "";
}

async function fetchSitemapUrls(sitemapUrl: string): Promise<SitemapItem[]> {
  console.log(`Getting sitemap from ${sitemapUrl}`);
  try {
    const res = await fetch(sitemapUrl);
    if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
    const xml = await res.text();

    const items: SitemapItem[] = [];
    const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];

    for (const block of urlBlocks) {
      const locMatch = block.match(/<loc>(.*?)<\/loc>/);
      const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/);

      if (locMatch) {
        let url = locMatch[1].trim();
        if (url.startsWith("/")) url = `https://geekist.co${url}`;
        items.push({
          url,
          lastmod: lastmodMatch ? lastmodMatch[1] : ""
        });
      }
    }
    // Sort descending
    return items.sort((a, b) => {
      if (!a.lastmod) return 1;
      if (!b.lastmod) return -1;
      return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
    });
  } catch (err) {
    console.error("Error fetching sitemap:", err);
    return [];
  }
}

export async function getPostDetails(
  // sitemap URL generally implies all posts, but we can respect maxItems limit
  sitemapUrl = "https://geekist.co/post-sitemap.xml",
  maxItems = 5
): Promise<Post[]> {
  const sitemapItems = await fetchSitemapUrls(sitemapUrl);
  const posts: Post[] = [];
  const SCAN_LIMIT = 20; // How many pages to scrape to find matching items

  for (const item of sitemapItems) {
    if (posts.length >= maxItems) break;
    if (posts.length + sitemapItems.indexOf(item) > SCAN_LIMIT) break;

    const url = item.url;
    const slug = url.replace(/^https?:\/\/[^/]+\/|\/$/g, "");

    try {
      console.log(`🌐 Fetching metadata for: ${url}`);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (res.ok) {
        const html = await res.text();

        // Extract metadata
        let title = getMeta(html, "og:title") ||
          getMeta(html, "twitter:title") ||
          (html.match(/<title>([^<]+)<\/title>/i)?.[1] || slug.replace(/-/g, " "));

        let description = getMeta(html, "og:description") ||
          getMeta(html, "twitter:description") ||
          getMeta(html, "description");

        let imageUrl = getMeta(html, "og:image") ||
          getMeta(html, "twitter:image");

        // Use laststep from sitemap or article meta
        let publishedAt = item.lastmod;
        const pubTime = getMeta(html, "article:published_time");
        if (pubTime) publishedAt = pubTime;

        // Fix Image URL
        if (imageUrl) {
          if (imageUrl.startsWith("/")) {
            imageUrl = `https://img.geekist.co${imageUrl}`;
          } else {
            imageUrl = imageUrl.replace(/^https:\/\/(local\.)?geekist\.co/i, "https://img.geekist.co");
          }
        }

        // We are keeping AVIF, so no conversion logic here.
        // But we DO verify it exists (optional but good practice as requested originally)
        if (imageUrl) {
          try {
            const check = await fetch(imageUrl, { method: "HEAD" });
            if (!check.ok) {
              console.warn(`⚠️ Image 404: ${imageUrl}`);
              // We can choose to skip post or clear image. clearing image for safety.
              imageUrl = "";
            }
          } catch (e) {
            console.warn(`⚠️ Image check error: ${imageUrl}`);
            imageUrl = "";
          }
        }

        if (imageUrl) {
          posts.push({
            title,
            slug,
            url,
            coverImage: { url: imageUrl },
            description,
            publishedAt: new Date(publishedAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
            })
          });
          console.log(`✅ Valid Post: ${title}`);
        } else {
          console.log(`❌ Skipped (no image): ${title}`);
        }

      } else {
        console.warn(`⚠️ Failed to fetch page: ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error scraping page: ${url}`, err);
    }
  }

  console.log(`\n✅ Returning ${posts.length} posts.`);
  return posts;
}
