import Handlebars from 'handlebars';
import { getPostDetails, type Post } from './fetchRSS';
import { updateReadmeSection } from './utils';

async function updateReadme(): Promise<void> {
  // Use RSS feed
  const posts: Post[] = await getPostDetails('https://geekist.co/rss.xml', 5);

  if (posts.length === 0) {
    console.log('NOOP: No posts found. Leaving README unchanged.');
    return;
  }

  const templateSource = await Bun.file('./article.hbs').text();
  const html = Handlebars.compile(templateSource)({ posts });

  updateReadmeSection('<!-- ARTICLES:START -->', '<!-- ARTICLES:END -->', html);
  console.log(`README updated successfully with ${posts.length} post(s).`);
}

updateReadme()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error in updateReadme:', err);
    process.exit(1);
  });
