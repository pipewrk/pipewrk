import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { validateSignature, type ValidateSignatureResult } from './validateSignature';
import { getPostDetails } from './queryHashnode';

interface Payload {
  data: {
    post: {
      id: string;
    };
  };
}

async function updateReadme(): Promise<void> {
  if (!process.env.PAYLOAD || !process.env.SIGNATURE_HEADER || !process.env.HASHNODE_SECRET) {
    console.error("Environment variables are not set properly.");
    process.exit(1);
  }

  const payload: Payload = JSON.parse(process.env.PAYLOAD);
  const signatureHeader: string = process.env.SIGNATURE_HEADER;
  const secret: string = process.env.HASHNODE_SECRET;
  
  const result: ValidateSignatureResult = validateSignature({
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

    const readmePath = join(dirname(fileURLToPath(import.meta.url)), 'README.md');
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
    console.error('Error fetching post details:', error);
    process.exit(1);
  }
}

updateReadme();
