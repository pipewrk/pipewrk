import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchContributions, type Repository } from './fetchContributions';

async function updateReadme(username: string, token: string): Promise<void> {
  try {
    const contributions = await fetchContributions(username, token);
    // Only process and display repositories that have non-zero pull requests or issues
    const contributionsSection = contributions
      .filter(repo => repo.pullRequests.totalCount > 0 || repo.issues.totalCount > 0)
      .map((repository: Repository) => {
        const ownerLogin = repository.owner.login;
        const repoName = repository.name;
        const repoUrl = repository.url;

        return `- [${ownerLogin}/${repoName}](${repoUrl}) ![Contributors](https://img.shields.io/github/contributors/${ownerLogin}/${repoName}) ![Pull Requests](https://img.shields.io/github/issues-pr-closed-raw/${ownerLogin}/${repoName})`;
      }).join('\n');

    if (!contributionsSection) {
      console.log("No significant contributions found.");
      return;
    }

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
    console.log('README updated successfully.');
  } catch (error) {
    console.error('Failed to update README:', error);
  }
}

updateReadme('jasonnathan', process.env.GITHUB_TOKEN);  // Changed Bun.env to process.env for general usage
