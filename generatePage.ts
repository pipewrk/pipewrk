import { marked } from "marked";
import fs from "node:fs";

// Enable GitHub-Flavored Markdown (GFM)
marked.setOptions({
  gfm:   true,
  breaks:true,
});

const readmePath = "./README.md";
const outputPath = "index.html";

// 1️⃣ Read the raw README…
let readmeContent = fs.readFileSync(readmePath, "utf8");

// 2️⃣ Remove the GH-PAGES-NOTICE block entirely
readmeContent = readmeContent.replace(
  /<!--\s*GH-PAGES-NOTICE:START\s*-->[\s\S]*?<!--\s*GH-PAGES-NOTICE:END\s*-->/g,
  ""
).trim();

// 3️⃣ Convert the cleaned Markdown to HTML
const bodyContent = marked.parse(readmeContent);

// 4️⃣ Wrap in your full site template
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jason Nathan</title>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,100..900;1,100..900&family=Ysabeau+Office:ital,wght@0,100..900;1,100..900&display=swap');
    
    body {
      font-family: 'Ysabeau Office', sans-serif;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.75;
      max-width: 850px;
      margin: 40px auto;
      padding: 20px;
      background-color: #121212;
      color: #cccccc;
      word-wrap: break-word;
    }
    
    a {
      color: #478be6;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Lora', serif;
      font-weight: 400;
      color: #cccccc;
      margin-top: 2rem;
    }
    
    h1 { font-size: 2.25em; }
    h2 { font-size: 1.75em; }
    h3 { font-size: 1.25em; }
    h4, h5, h6 {
      font-size: 1em;
      color: #999999;
      font-style: italic;
    }
    
    pre, code {
      font-family: 'Fira Code', monospace;
      background: #222;
      color: #eee;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      display: block;
      font-size: 13px;
      white-space: pre-wrap;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 10px;
      border: 1px solid #333;
      color: #cccccc;
    }
    
    blockquote {
      border-left: 4px solid #00bcd4;
      padding: 10px 15px;
      margin: 20px 0;
      font-style: italic;
      background: rgba(0, 188, 212, 0.1);
      color: #999999;
    }
    
    small, sub {
      font-size: 0.95em;
      color: #999999;
    }
  </style>

  <!-- JSON-LD Schemas -->
  <script type="application/ld+json" src="/nginx-by-example.schema.json"></script>
  <script type="application/ld+json" src="/jason-profile.schema.json"></script>
</head>
<body>
  <main>
    ${bodyContent}
  </main>
</body>
</html>`;

// 5️⃣ Write it out
fs.writeFileSync(outputPath, htmlTemplate, "utf8");
console.log("✅ index.html generated successfully.");
