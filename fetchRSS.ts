// fetchRSS.ts
import Parser from 'rss-parser';

export interface Post {
  title:       string;
  slug:        string;
  url:         string;
  coverImage:  { url: string };
  description: string;
  publishedAt: string;
}

export async function getPostDetails(
  feedUrl    = 'https://geekist.co/rss.xml',
  maxItems   = 5
): Promise<Post[]> {
  const parser = new Parser();
  const feed   = await parser.parseURL(feedUrl);

  return (feed.items || [])
    .slice(0, maxItems)
    .map(item => {
      const url  = item.link ?? '';
      const slug = url.replace(/^https?:\/\/[^/]+\/|\/$/g, '');

      // 1) Grab the raw HTML from <description> (rss-parser puts it in .content)
      const html  = item.content ?? '';

      // 2) Extract the first <img src="…">
      const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
      const imageUrl = imgMatch?.[1];

      // 3) Remove that <img> tag and the trailing <p><a…Source</a></p>
      const cleanedHtml = html
        .replace(/<img[^>]+>/i, '')
        .replace(/<p>\s*<a[^>]+>Source<\/a>\s*<\/p>/i, '');

      // 4) Use contentSnippet for plain text fallback, stripped of “Source”
      const snippet = (item.contentSnippet || '')
        .replace(/\s*Source$/i, '')
        .trim();

      return {
        title:       item.title        || '',
        slug,
        url,
        coverImage:  { url: imageUrl! },   // we'll drop any without a URL below
        description: cleanedHtml
          ? cleanedHtml.trim()
          : snippet,
        publishedAt: new Date(item.pubDate || '')
          .toLocaleDateString('en-GB', {
            day:   'numeric',
            month: 'short',
            year:  'numeric',
            timeZone: 'UTC',
          }),
      };
    })
    // 5) Only keep those where we found a featured image
    .filter(post => !!post.coverImage.url);
}
