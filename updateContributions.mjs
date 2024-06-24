import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fetchContributions } from './fetchContributions.mjs';

async function updateReadme(username, token) {
  const contributions = await fetchContributions(username, token);
  const contributionsSection = contributions
    .map(({ repository }) => {
      return `- [${repository.owner.login}/${repository.name}](${repository.url}) ![Contributors](https://img.shields.io/github/contributors/${repository.owner.login}/${repository.name}) ![Pull Requests](https://img.shields.io/github/issues-pr-closed-raw/${repository.owner.login}/${repository.name})`;
    })
    .join('\n');

  const readmePath = join(__dirname, 'README.md');
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

updateReadme('jasonnathan', process.env.GITHUB_TOKEN);
