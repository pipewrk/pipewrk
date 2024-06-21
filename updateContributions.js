const fs = require('fs');
const path = require('path');
const { fetchContributions } = require('./fetchContributions');

async function updateReadme(username, token) {
  const contributions = await fetchContributions(username, token);
  const contributionsSection = contributions
    .map(({ repository }) => {
      return `- [${repository.owner.login}/${repository.name}](${repository.url}) ![Contributors](https://img.shields.io/github/contributors/${repository.owner.login}/${repository.name}) ![Pull Requests](https://img.shields.io/github/issues-pr-closed-raw/${repository.owner.login}/${repository.name})`;
    })
    .join('\n');

  const readmePath = path.join(__dirname, 'README.md');
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  const startMarker = '<!-- CONTRIBUTIONS:START -->';
  const endMarker = '<!-- CONTRIBUTIONS:END -->';
  const startIndex = readmeContent.indexOf(startMarker) + startMarker.length;
  const endIndex = readmeContent.indexOf(endMarker);

  readmeContent =
    readmeContent.substring(0, startIndex) +
    `\n${contributionsSection}\n` +
    readmeContent.substring(endIndex);

  fs.writeFileSync(readmePath, readmeContent);
}

const username = 'your-github-username';
const token = process.env.GITHUB_TOKEN;
updateReadme(username, token);
