import { graphql, type GraphQlQueryResponseData } from '@octokit/graphql';
import fetch from 'node-fetch';

export interface Repository {
  name: string;
  owner: {
    login: string;
  };
  url: string;
  parent?: {
    name: string;
    owner: {
      login: string;
    };
    url: string;
  };
  pullRequests: {
    totalCount: number;
  };
  issues: {
    totalCount: number;
  };
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface RepositoryEdge {
  node: {
    repository: Repository;
  };
}

interface PullRequestContributionsByRepository {
  pageInfo: PageInfo;
  edges: RepositoryEdge[];
}

interface ContributionsCollection {
  pullRequestContributionsByRepository: PullRequestContributionsByRepository;
}

interface User {
  contributionsCollection: ContributionsCollection;
}

export async function fetchContributions(username: string, token: string): Promise<Repository[]> {
  const query = `
    query ($username: String!, $cursor: String) {
      user(login: $username) {
        contributionsCollection {
          pullRequestContributionsByRepository(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                repository {
                  name
                  owner {
                    login
                  }
                  url
                  parent {
                    name
                    owner {
                      login
                    }
                    url
                  }
                  pullRequests(states: [MERGED, OPEN]) {
                    totalCount
                  }
                  issues(states: [OPEN, CLOSED]) {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    let contributions: Repository[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
  
    const octokitGraphQL = graphql.defaults({
      headers: {
        authorization: `bearer ${token}`,
      },
      request: {
        fetch
      }
    });
  
    while (hasNextPage) {
      const response: GraphQlQueryResponseData = await octokitGraphQL(query, {
        username,
        cursor
      });

      const data: ContributionsCollection = response.user.contributionsCollection;
      contributions = contributions.concat(data.pullRequestContributionsByRepository.edges.map(edge => edge.node.repository));
      hasNextPage = data.pullRequestContributionsByRepository.pageInfo.hasNextPage;
      cursor = data.pullRequestContributionsByRepository.pageInfo.endCursor;
    }
  
    return contributions;
  } catch (error: any) {
    console.error(`Failed to fetch contributions for user ${username}: ${error.message}`);
    throw error;
  }
}
