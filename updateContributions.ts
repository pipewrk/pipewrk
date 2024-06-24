import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchContributions, type Repository } from './fetchContributions';

async function updateReadme(username: string, token: string): Promise<void> {
  const contributions = await fetchContributions(username, token);
  const contributionsSection = contributions
    .map((repository: Repository)  => {
      return `- [${repository.owner.login}/${repository.name}](${repository.url}) ![Contributors](https://img.shields.io/github/contributors/${repository.owner.login}/${repository.name}) ![Pull Requests](https://img.shields.io/github/issues-pr-closed-raw/${repository.owner.login}/${repository.name})`;
    })
    .join('\n');

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
}

updateReadme('jasonnathan', Bun.env.GITHUB_TOKEN);
