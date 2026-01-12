import Parser from "rss-parser";
import { fetch } from "bun";

export interface Post {
  title: string;
  slug: string;
  url: string;
  coverImage: { url: string };
  description: string;
  publishedAt: string;
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

export async function getPostDetails(
  feedUrl = "https://geekist.co/rss.xml",
  maxItems = 5
): Promise<Post[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);

  console.log(`📰 Parsed feed: ${feed.title}`);

  const SCAN_LIMIT = 20;
  // Process items in parallel
  const promises = (feed.items || [])
    .slice(0, SCAN_LIMIT)
    .map(async (item) => {
      // 1. Fix Link Domain
      let url = item.link || "";
      // Replace local.geekist.co -> geekist.co
      url = url.replace("local.geekist.co", "geekist.co");

      // Slug from URL
      const slug = url.replace(/^https?:\/\/[^/]+\/|\/$/g, "");

      let title = item.title || "";
      let description = "";
      let imageUrl = "";
      let publishedAt = item.pubDate || new Date().toISOString();

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
          const metaTitle = getMeta(html, "og:title") || getMeta(html, "twitter:title");
          if (metaTitle) title = metaTitle;

          description = getMeta(html, "og:description") ||
            getMeta(html, "twitter:description") ||
            getMeta(html, "description") ||
            item.contentSnippet || "";

          imageUrl = getMeta(html, "og:image") ||
            getMeta(html, "twitter:image");

          // Use article published time if available, else rss pubDate
          const pubTime = getMeta(html, "article:published_time");
          if (pubTime) publishedAt = pubTime;

          // Fix Image URL
          if (imageUrl) {
            if (imageUrl.startsWith("/")) {
              imageUrl = `https://img.geekist.co${imageUrl}`;
            } else {
              imageUrl = imageUrl.replace(/^https:\/\/(local\.)?geekist\.co/i, "https://img.geekist.co");
            }

            // Verify existence
            try {
              const check = await fetch(imageUrl, { method: "HEAD" });
              if (!check.ok) {
                console.warn(`⚠️ Image 404: ${imageUrl}`);
                imageUrl = "";
              }
            } catch (e) {
              console.warn(`⚠️ Image check error: ${imageUrl}`);
              imageUrl = "";
            }
          }

          if (imageUrl) {
            console.log(`✅ Valid Post: ${title}`);
            return {
              title,
              slug,
              url,
              coverImage: { url: imageUrl },
              description,
              publishedAt: new Date(publishedAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
              })
            };
          } else {
            console.log(`❌ Skipped (no image): ${title}`);
            return null;
          }

        } else {
          console.warn(`⚠️ Failed to fetch page: ${res.status}`);
          return null;
        }
      } catch (err) {
        console.warn(`⚠️ Error scraping page: ${url}`, err);
        return null;
      }
    });

  const results = await Promise.all(promises);
  const validPosts = results.filter((p): p is Post => p !== null);

  console.log(`\n✅ Returning ${Math.min(validPosts.length, maxItems)} posts.`);
  return validPosts.slice(0, maxItems);
}
