import { graphql, type GraphQlQueryResponseData } from '@octokit/graphql';
import fetch from 'node-fetch';

export interface Repository {
  name: string;
  owner: {
    login: string;
  };
  url: string;
  pullRequests: {
    totalCount: number;
  };
  issues: {
    totalCount: number;
  };
}

interface User {
  contributionsCollection: {
    commitContributionsByRepository: Repository[];
  };
}

export async function fetchContributions(username: string, token: string): Promise<Repository[]> {
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

    const response: GraphQlQueryResponseData = await octokitGraphQL(query, { username });

    if (!response || !response.user || !response.user.contributionsCollection) {
      throw new Error('Invalid response structure received from GitHub API.');
    }

    return response.user.contributionsCollection.commitContributionsByRepository;
  } catch (error: any) {
    console.error(`Failed to fetch contributions for user ${username}: ${error.message}`);
    throw error;
  }
}
