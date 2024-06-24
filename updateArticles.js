import { readFileSync, writeFileSync } from 'fs';
import { validateSignature } from './validateSignature.js';
import { getPostDetails } from './queryHashnode.js';

async function updateReadme() {
  const payload = JSON.parse(process.env.PAYLOAD);
  const signatureHeader = process.env.SIGNATURE_HEADER;
  const secret = process.env.HASHNODE_SECRET;
  
  const result = validateSignature({
    incomingSignatureHeader: signatureHeader,
    payload,
    secret,
    validForSeconds: 30,
  });

  if (!result.isValid) {
    console.error(result.reason);
    process.exit(1);
  }

  const postId = payload.data.post.id;
  try {
    const post = await getPostDetails(postId);
    const postUrl = `https://${post.author.username}.hashnode.dev/${post.slug}`;
    const newArticle = `- 📘 [${post.title}](${postUrl})`;

    const readmePath = './README.md';
    let readmeContent = readFileSync(readmePath, 'utf8');

    const articlesStartMarker = '<!-- ARTICLES:START -->';
    const articlesEndMarker = '<!-- ARTICLES:END -->';

    const startIndex = readmeContent.indexOf(articlesStartMarker) + articlesStartMarker.length;
    const endIndex = readmeContent.indexOf(articlesEndMarker);

    const beforeArticles = readmeContent.substring(0, startIndex);
    const afterArticles = readmeContent.substring(endIndex);

    const updatedContent = beforeArticles + `\n${newArticle}\n` + afterArticles;

    writeFileSync(readmePath, updatedContent);
  } catch (error) {
    console.error('Error fetching post details:', error.message);
    process.exit(1);
  }
}

updateReadme();
