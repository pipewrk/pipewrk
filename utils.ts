import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Updates a section of the README file between the specified markers.
 *
 * @param {string} markerStart - The start marker to look for in the README.
 * @param {string} markerEnd - The end marker to look for in the README.
 * @param {string} content - The content to insert between the markers.
 * @param {boolean} append - Whether to append to the existing content.
 */
export function updateReadmeSection(markerStart: string, markerEnd: string, content: string, append: boolean = false): void {
  const readmePath = join(dirname(fileURLToPath(import.meta.url)), 'README.md');
  let readmeContent = readFileSync(readmePath, 'utf8');

  const startIndex = readmeContent.indexOf(markerStart) + markerStart.length;
  const endIndex = readmeContent.indexOf(markerEnd);

  if (append) {
    const beforeContent = readmeContent.substring(0, startIndex);
    const afterContent = readmeContent.substring(endIndex);
    readmeContent = beforeContent + `\n${content}\n` + afterContent;
  } else {
    readmeContent = 
      readmeContent.substring(0, startIndex) +
      `\n${content}\n` +
      readmeContent.substring(endIndex);
  }

  writeFileSync(readmePath, readmeContent);
  console.log('README updated successfully.');
}
