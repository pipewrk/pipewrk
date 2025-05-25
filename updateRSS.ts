import Handlebars from 'handlebars';
import { getPostDetails, type Post } from './fetchRSS';
import { updateReadmeSection } from './utils';

async function updateReadme(): Promise<void> {
  const posts: Post[] = await getPostDetails('https://geekist.co/rss.xml', 5);
  if (posts.length === 0) {
    console.error('No posts found in RSS feed.');
    process.exit(1);
  }

  const templateSource = await Bun.file('./article.hbs').text();
  const html           = Handlebars.compile(templateSource)({ posts });

  try {
    updateReadmeSection('<!-- ARTICLES:START -->', '<!-- ARTICLES:END -->', html);
    console.log('README updated successfully.');
  } catch (err) {
    console.error('Error updating README:', err);
    process.exit(1);
  }
}

updateReadme();
