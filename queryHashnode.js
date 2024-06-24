import fetch from 'node-fetch';

export async function getPostDetails(postId) {
  const query = `
    query GetPostDetails($postId: String!) {
      post(id: $postId) {
        title
        brief
        slug
        author {
          username
        }
      }
    }
  `;

  const variables = { postId };

  const response = await fetch('https://api.hashnode.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  return result.data.post;
}
