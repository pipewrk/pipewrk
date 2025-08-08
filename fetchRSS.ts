import Parser from "rss-parser";
import sharp from "sharp";
import { Buffer } from "buffer";

export interface Post {
  title:       string;
  slug:        string;
  url:         string;
  coverImage:  { url: string };
  description: string;
  publishedAt: string;
}

export async function getPostDetails(
  feedUrl  = "https://geekist.co/rss.xml",
  maxItems = 5
): Promise<Post[]> {
  const parser = new Parser(),
        feed   = await parser.parseURL(feedUrl);

  console.log(`📰 Parsed feed: ${feed.title}`);
  console.log(`📦 Items found: ${feed.items.length}`);

  const posts = await Promise.all(
    (feed.items || [])
      .slice(0, maxItems)
      .map(async item => {
        const url      = item.link ?? "",
              slug     = url.replace(/^https?:\/\/[^/]+\/|\/$/g, ""),
              html     = item.content ?? "",
              match    = html.match(/<img[^>]+src="([^">]+)"/i),
              imageUrl = (match?.[1] || "").replace(
                /^https:\/\/geekist\.co/i,
                "https://img.geekist.co"
              );

        console.log(`\n📝 Post: "${item.title}"`);
        console.log(`🔗 Slug: ${slug}`);
        console.log(`🖼️  Image URL: ${imageUrl}`);

        let finalUrl = imageUrl;

        // only do heavy lifting if it's AVIF
        if (imageUrl.toLowerCase().endsWith(".avif")) {
          console.log("⚙️ AVIF detected, attempting conversion...");

          try {
            const res = await fetch(imageUrl);
            if (!res.ok) {
              console.error(`❌ Fetch failed: ${res.status} ${res.statusText}`);
              throw new Error(`Failed to fetch AVIF image: ${imageUrl}`);
            }

            const arrBuf   = await res.arrayBuffer();
            const inputBuf = Buffer.from(arrBuf);
            const pngBuf   = await sharp(inputBuf).png().toBuffer();

            finalUrl = `data:image/png;base64,${pngBuf.toString("base64")}`;
            console.log("✅ Conversion successful (base64 PNG, size:", pngBuf.length, "bytes)");
          } catch (err) {
            console.warn(`⚠️  Failed to convert AVIF for: ${imageUrl}`);
            console.warn(err);
          }
        } else {
          console.log("✅ Image is not AVIF — no conversion needed.");
        }

        const cleanedHtml = html
          .replace(/<img[^>]+>/i, "")
          .replace(/<p>\s*<a[^>]+>Source<\/a>\s*<\/p>/i, "")
          .trim();

        const snippet = (item.contentSnippet || "")
          .replace(/\s*Source$/i, "")
          .trim();

        console.log("📤 Final image URL used:", finalUrl.slice(0, 80) + "...");

        return {
          title:       item.title        || "",
          slug,
          url,
          coverImage:  { url: finalUrl },
          description: cleanedHtml || snippet,
          publishedAt: new Date(item.pubDate || "")
            .toLocaleDateString("en-GB", {
              day:       "numeric",
              month:     "short",
              year:      "numeric",
              timeZone:  "UTC",
            }),
        };
      })
  );

  console.log(`\n✅ ${posts.length} post(s) processed with cover images.`);

  return posts.filter(p => !!p.coverImage.url);
}
