import * as fs from 'fs';
import { pipeline } from '@xenova/transformers';

// Load the embeddings model
const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');

// Venues to process. "name" is the label shown in search results (year).
// Each id needs a thesis-data/thesis-<id>.json from the fetch script.
let venues = [
  { name: '2024', id: 202 },
  { name: 'Lowres 2023', id: 193 },
  { name: 'Spring 2023', id: 188 },
];

// Turn &amp; &#039; &quot; back into normal characters
const decode = (s = '') =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

for (let venue of venues) {
  const inFile = `thesis-data/thesis-${venue.id}.json`;
  // Skip venues you haven't fetched yet
  if (!fs.existsSync(inFile)) {
    console.log(`Skipping ${venue.name}: ${inFile} not found`);
    continue;
  }
  const outputJSON = { embeddings: [] };
  console.log(`Processing venue: ${venue.name}...`);
  const { projects } = JSON.parse(fs.readFileSync(inFile, 'utf-8'));
  for (let project of projects) {
    let title = decode(project.project_name);
    let student = project.users?.[0]?.user_name ?? '';
    let description = decode(project.description);
    let text = title + '\n' + description; // only title + description are embedded (not the name)
    let output;
    try {
      output = await extractor(text, { pooling: 'mean', normalize: true });
    } catch (e) {
      console.log(e);
      continue; // skip this project instead of crashing
    }
    const embedding = output.tolist()[0];
    // Saved: title, student, year, description (stored, not displayed), embedding
    outputJSON.embeddings.push({ title, student, year: venue.name, description, embedding });
  }
  const fileOut = `embeddings/thesis-embeddings-${venue.id}.json`;
  fs.writeFileSync(fileOut, JSON.stringify(outputJSON));
  console.log(`Embeddings saved to ${fileOut}`);
}