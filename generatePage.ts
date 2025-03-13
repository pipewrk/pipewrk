import { marked } from "marked";
import fs from "node:fs";

// Enable GitHub-Flavored Markdown (GFM)
marked.setOptions({
  gfm: true,        // Enables tables, task lists, strikethroughs, etc.
  breaks: true,     // Single line breaks behave like <br> (like GitHub)
});

const readmePath = "./README.md";
const outputPath = "index.html";

const readmeContent = fs.readFileSync(readmePath, "utf8");
const bodyContent = marked.parse(readmeContent);

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jason Nathan</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Fira+Code:wght@400;500&display=swap');

body {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.75;
  max-width: 850px;
  margin: 40px auto;
  padding: 20px;
  background-color: #121212;
  color: #ddd;
  word-wrap: break-word;
}

a {
  color: #00bcd4;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
}

h1, h2, h3 {
  font-weight: 600;
  color: #ddd;
}

h1 {
  font-size: 2em;
}

h2 {
  font-size: 1.5em;
}

h3 {
  font-size: 1em;
}


pre, code {
  font-family: 'Fira Code', monospace;
  background: #222;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  display: block;
  font-size: 14px;
  white-space: pre-wrap;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

th, td {
  padding: 10px;
  border: 1px solid #ddd;
}

blockquote {
  border-left: 4px solid #00bcd4;
  padding: 10px 15px;
  margin: 20px 0;
  font-style: italic;
  background: rgba(0, 188, 212, 0.1);
}

  </style>
</head>
<body>
  <main>
    ${bodyContent}
  </main>
</body>
</html>`;

fs.writeFileSync(outputPath, htmlTemplate);
console.log("✅ index.html generated successfully.");
