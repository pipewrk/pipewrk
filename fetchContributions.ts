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

export interface Contribution {
  title: string;
  url: string;
  repository: Repository;
}

interface PullRequestNode {
  pullRequest: Contribution;
}

interface IssueNode {
  issue: Contribution;
}

interface PullRequestContributions {
  totalCount: number;
  nodes: PullRequestNode[];
}

interface IssueContributions {
  totalCount: number;
  nodes: IssueNode[];
}

interface ContributionsCollection {
  pullRequestContributions: PullRequestContributions;
  issueContributions: IssueContributions;
}

interface User {
  contributionsCollection: ContributionsCollection;
}

const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          pullRequestContributions(first: 100) {
            totalCount
            nodes {
              pullRequest {
                title
                url
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
                title
                url
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

export async function fetchContributions(username: string, token: string): Promise<Contribution[]> {
  
  const octokitGraphQL = graphql.defaults({
    headers: {
      authorization: `bearer ${token}`,
    },
    request: {
      fetch
    }
  });

  try {
    const response: GraphQlQueryResponseData = await octokitGraphQL(query, { username });
    if (!response || !response.user || !response.user.contributionsCollection) {
      throw new Error('Invalid response structure received from GitHub API.');
    }

    const contributions: Contribution[] = [];

    // Process pull request contributions
    for (const node of response.user.contributionsCollection.pullRequestContributions.nodes) {
      const contribution: Contribution = node.pullRequest;
      contributions.push(contribution);
    }

    // Process issue contributions
    for (const node of response.user.contributionsCollection.issueContributions.nodes) {
      const contribution: Contribution = node.issue;
      contributions.push(contribution);
    }

    return contributions;
  } catch (error: any) {
    console.error(`Failed to fetch contributions for user ${username}: ${error.message}`);
    throw error;
  }
}