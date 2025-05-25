// fetchRSS.ts
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

  const posts = await Promise.all(
    (feed.items || [])
      .slice(0, maxItems)
      .map(async item => {
        const url      = item.link ?? "",
              slug     = url.replace(/^https?:\/\/[^/]+\/|\/$/g, ""),
              html     = item.content ?? "",
              match    = html.match(/<img[^>]+src="([^">]+)"/i),
              imageUrl = match?.[1] || "";

        let finalUrl = imageUrl;

        // only do heavy lifting if it's AVIF
        if (imageUrl.toLowerCase().endsWith(".avif")) {
          try {
            const res       = await fetch(imageUrl),
                  arrBuf    = await res.arrayBuffer(),
                  inputBuf  = Buffer.from(arrBuf),
                  pngBuf    = await sharp(inputBuf).png().toBuffer();
            finalUrl        = `data:image/png;base64,${pngBuf.toString("base64")}`;
          } catch {
            // fallback stays as AVIF URL (Camo will choke, but at least your code stays sane)
          }
        }

        const cleanedHtml = html
          .replace(/<img[^>]+>/i, "")
          .replace(/<p>\s*<a[^>]+>Source<\/a>\s*<\/p>/i, "")
          .trim();

        const snippet = (item.contentSnippet || "")
          .replace(/\s*Source$/i, "")
          .trim();

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

  return posts.filter(p => !!p.coverImage.url);
}
