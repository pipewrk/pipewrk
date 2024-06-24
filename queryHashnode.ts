import fetch from 'node-fetch';

interface Author {
  username: string;
}

interface Post {
  title: string;
  brief: string;
  slug: string;
  author: Author;
}

interface FetchResponse {
  data: {
    post: Post;
  };
}

export async function getPostDetails(postId: string): Promise<Post> {
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

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json() as FetchResponse;
  return result.data.post;
}
