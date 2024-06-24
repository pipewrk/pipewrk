import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchContributions, type Repository } from './fetchContributions';

async function updateReadme(username: string, token: string): Promise<void> {
  try {
    const contributions = await fetchContributions(username, token);
    const contributionsSections = contributions.map((repository: Repository) => {
      // Safely access nested properties
      const ownerLogin = repository?.owner?.login;
      const repoName = repository?.name;
      const repoUrl = repository?.url;
      
      // Check if essential data is missing and log if so
      if (!ownerLogin || !repoName || !repoUrl) {
        console.error('Incomplete repository data:', JSON.stringify(repository, null, 2));
        return false;  // Return false for this entry
      }

      return `- [${ownerLogin}/${repoName}](${repoUrl}) ![Contributors](https://img.shields.io/github/contributors/${ownerLogin}/${repoName}) ![Pull Requests](https://img.shields.io/github/issues-pr-closed-raw/${ownerLogin}/${repoName})`;
    }).filter(Boolean).join('\n');  // Filter out false values to clean up the output

    // Continue with the rest of your logic...
    console.log(contributionsSections);
  } catch (error) {
    console.error('Failed to update README:', error);
  }
}

updateReadme('jasonnathan', Bun.env.GITHUB_TOKEN);
