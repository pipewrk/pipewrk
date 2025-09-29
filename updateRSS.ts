import Handlebars from 'handlebars';
import { getPostDetails, type Post } from './fetchRSS';
import { updateReadmeSection } from './utils';

async function updateReadme(): Promise<void> {
  const posts: Post[] = await getPostDetails('https://geekist.co/rss.xml', 5);

  if (posts.length === 0) {
    console.log('NOOP: No posts found in RSS feed. Leaving README unchanged.');
    return; // ✅ do not fail CI on "no posts"
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

// Optional: extra visibility if some promise rejects after main resolves
process.on('unhandledRejection', (r) => {
  console.error('UNHANDLED_REJECTION', r);
  process.exit(1);
});
process.on('uncaughtException', (e) => {
  console.error('UNCAUGHT_EXCEPTION', e);
  process.exit(1);
});
