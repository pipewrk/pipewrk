import { graphql, type GraphQlQueryResponseData } from "@octokit/graphql";
import fetch from "node-fetch";
export interface Owner {
  login: string;
}

export interface ParentRepository {
  name: string;
  owner: Owner;
  url: string;
}

export interface Repository {
  name: string;
  owner: Owner;
  url: string;
  parent?: ParentRepository;
  pullRequests: {
    totalCount: number;
  };
  issues: {
    totalCount: number;
  };
}

const query = `
query ($username: String!) {
  user(login: $username) {
    contributionsCollection {
      pullRequestContributions(first: 100) {
        totalCount
        nodes {
          pullRequest {
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
            }
          }
        }
      }
      issueContributions(first: 100) {
        totalCount
        nodes {
          issue {
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

export async function fetchContributions(
  username: string,
  token: string
): Promise<Repository[]> {
  const octokitGraphQL = graphql.defaults({
    headers: {
      authorization: `bearer ${token}`,
    },
    request: {
      fetch,
    },
  });

  try {
    const response: GraphQlQueryResponseData = await octokitGraphQL(query, {
      username,
    });
    if (!response || !response.user || !response.user.contributionsCollection) {
      throw new Error("Invalid response structure received from GitHub API.");
    }

    let contributions: Repository[] = [];

    // Process pull request contributions
    response.user.contributionsCollection.pullRequestContributions.nodes.forEach(
      (node: { pullRequest: { repository: Repository } }) => {
        const repository = node.pullRequest.repository;
        contributions.push({
          ...repository,
          pullRequests: { totalCount: repository.pullRequests.totalCount },
          issues: { totalCount: 0 },
        });
      }
    );

    // Process issue contributions
    response.user.contributionsCollection.issueContributions.nodes.forEach(
      (node: { issue: { repository: Repository } }) => {
        const repository = node.issue.repository;
        const existingRepo = contributions.find(
          (repo) => repo.url === repository.url
        );
        if (existingRepo) {
          existingRepo.issues.totalCount += repository.issues.totalCount;
        } else {
          contributions.push({
            ...repository,
            pullRequests: { totalCount: 0 },
            issues: { totalCount: repository.issues.totalCount },
          });
        }
      }
    );

    // Remove duplicates based on the repository URL
    const uniqueContributions = contributions.filter(
      (repo, index, self) => index === self.findIndex((t) => t.url === repo.url)
    );

    return uniqueContributions;
  } catch (error: any) {
    console.error(
      `Failed to fetch contributions for user ${username}: ${error.message}`
    );
    throw error;
  }
}
