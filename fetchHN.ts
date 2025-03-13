interface Post {
  title: string;
  subtitle: string;
  slug: string;
  url?: string;
  coverImage: {
    url: string;
  },
  seo: {
    description: string;
  };
  publishedAt: string;
}

interface FetchResponse {
  data: {
    publication: {
      posts: {
        edges: {
          node: Post;
        }[];
      };
    };
  };
}

export async function getPostDetails(host: string, first = 5): Promise<Post[]> {
  const query = `query GetPosts($host: String!, $first: Int!) {
    publication(host: $host) {
      posts(first: $first) {
        edges {
          node {
            title
            slug
            subtitle
            publishedAt
            coverImage {
              url
            }            
            seo {
              description
            }
          }
        }
      }
    }
  }`;

  const variables = { host, first };

  const response = await fetch("https://gql.hashnode.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const {
    data: {
      publication: {
        posts: { edges },
      },
    },
  } = (await response.json()) as FetchResponse;

  return edges
    ? edges.map(({ node }) => ({
        ...node,
        url: `https://www.geekist.co/${node.slug}`,
        publishedAt: new Date(String(node.publishedAt)).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      }))
    : [];
}