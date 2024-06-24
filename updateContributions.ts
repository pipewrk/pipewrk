import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchContributions, type Repository } from './fetchContributions';

async function updateReadme(username: string, token: string): Promise<void> {
  try {
    const contributions = await fetchContributions(username, token);
    const contributionsSection = contributions.map((repository: Repository) => {
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
    const readmePath = join(dirname(fileURLToPath(import.meta.url)), 'README.md');
    let readmeContent = readFileSync(readmePath, 'utf8');
  
    const startMarker = '<!-- CONTRIBUTIONS:START -->';
    const endMarker = '<!-- CONTRIBUTIONS:END -->';
    const startIndex = readmeContent.indexOf(startMarker) + startMarker.length;
    const endIndex = readmeContent.indexOf(endMarker);
  
    readmeContent =
      readmeContent.substring(0, startIndex) +
      `\n${contributionsSection}\n` +
      readmeContent.substring(endIndex);
  
    writeFileSync(readmePath, readmeContent);
    console.log(contributionsSection);
  } catch (error) {
    console.error('Failed to update README:', error);
  }
}

updateReadme('jasonnathan', Bun.env.GITHUB_TOKEN);
