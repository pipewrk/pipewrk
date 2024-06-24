import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchContributions, type Repository } from './fetchContributions';

async function updateReadme(username: string, token: string): Promise<void> {
  try {
    const contributions = await fetchContributions(username, token);
    const contributionsSection = contributions.map((repository: Repository) => {
      const ownerLogin = repository.owner.login;
      const repoName = repository.name;
      const repoUrl = repository.url;
      const pullRequestCount = repository.pullRequests.totalCount;
      const issueCount = repository.issues.totalCount;

      // Check for significant activity
      const isSignificant = pullRequestCount > 5 || issueCount > 10;
      const significantMarker = isSignificant ? '🌟' : ''; // Highlight significant contributions

      return `- [${ownerLogin}/${repoName}](${repoUrl}) ${significantMarker} Pull Requests: ${pullRequestCount}, Issues: ${issueCount}`;
    }).join('\n');

    if (!contributionsSection) {
      console.log("No contributions found.");
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
    console.log('README updated successfully with all contributions and highlighted significant activity.');
  } catch (error) {
    console.error('Failed to update README:', error);
  }
}

updateReadme('jasonnathan', process.env.GITHUB_TOKEN); // Ensure your environment variable is correctly configured
