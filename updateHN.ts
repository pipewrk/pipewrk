import Handlebars from "handlebars";
import { getPostDetails } from "./fetchHN";
import { updateReadmeSection } from "./utils";

async function updateReadme(): Promise<void> {
  const posts = await getPostDetails("geekist.co");
  const templateSource = await Bun.file("./article.hbs").text();
  const template = Handlebars.compile(templateSource);

  if (!posts || posts.length === 0) {
    process.exit(1);
  }

  const html = template({ posts });
  try {
    updateReadmeSection(
      "<!-- ARTICLES:START -->",
      "<!-- ARTICLES:END -->",
      html
    );
  } catch (error) {
    console.error("Error fetching post details:", error);
    process.exit(1);
  }
}

updateReadme();
