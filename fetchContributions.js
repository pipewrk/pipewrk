const { graphql } = require('@octokit/graphql');

async function fetchContributions(username, token) {
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

  const response = await graphql(query, {
    username,
    headers: {
      authorization: `token ${token}`,
    },
  });

  return response.user.contributionsCollection.commitContributionsByRepository;
}

module.exports = { fetchContributions };
