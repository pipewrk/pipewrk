import { fetchContributions, type Contribution } from './fetchGH';
import { updateReadmeSection } from './utils';

interface GroupedContributions {
  [key: string]: Contribution[];
}

async function updateReadme(username: string, token: string): Promise<void> {
  try {
    const contributions = await fetchContributions(username, token);

    // Group contributions by repository
    const groupedContributions: GroupedContributions = contributions.reduce((acc, contribution) => {
      const repoKey = `${contribution.repository.owner.login}/${contribution.repository.name}`;
      if (!acc[repoKey]) {
        acc[repoKey] = [];
      }
      acc[repoKey].push(contribution);
      return acc;
    }, {} as GroupedContributions);

    // Format the contributions section
    const contributionsSection = Object.entries(groupedContributions).map(([repoKey, repoContributions]) => {
      const repoUrl = repoContributions[0].repository.url;
      const significantMarker = repoContributions.some(contribution =>
        (contribution.repository.pullRequests?.totalCount ?? 0) > 5 ||
        (contribution.repository.issues?.totalCount ?? 0) > 10
      ) ? ' 🌟' : '';
      const contributionsList = repoContributions.map(contribution => {
        return `- [${contribution.title}](${contribution.url})`;
      }).join('\n');

      return `### [${repoKey}](${repoUrl})${significantMarker}\n${contributionsList}`;
    }).join('\n');

    if (!contributionsSection) {
      console.log("No contributions found.");
      return;
    }
    updateReadmeSection(
      "<!-- CONTRIBUTIONS:START -->",
      "<!-- CONTRIBUTIONS:END -->",
      contributionsSection
    );    
  } catch (error) {
    console.error('Failed to update README:', error);
  }
}

updateReadme('jasonnathan', Bun.env.GITHUB_TOKEN); // Ensure your environment variable is correctly configured
