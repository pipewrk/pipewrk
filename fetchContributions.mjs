import { graphql } from '@octokit/graphql';
import fetch from 'node-fetch';

export async function fetchContributions(username, token) {
  const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          commitContributionsByRepository(maxRepositories: 5) {
            repository {
              name
              owner {
                login
              }
              url
              pullRequests(states: MERGED) {
                totalCount
              }
              issues(states: CLOSED) {
                totalCount
              }
            }
          }
        }
      }
    }
  `;

  try {
    const octokitGraphQL = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
      request: {
        fetch
      }
    });

    const response = await octokitGraphQL(query, {
      username
    });

    // Check if the response includes the expected data
    if (!response || !response.user || !response.user.contributionsCollection) {
      throw new Error('Invalid response structure received from GitHub API.');
    }

    return response.user.contributionsCollection.commitContributionsByRepository;
  } catch (error) {
    console.error(`Failed to fetch contributions for user ${username}: ${error.message}`);
    // Re-throw the error to be caught by the workflow or further error handling logic
    throw error;
  }
}
