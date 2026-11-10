import * as fs from 'fs';
import { pipeline } from '@xenova/transformers';

const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');

// CHANGED: load every venue from venues.json instead of hard-coding 3
const { venues } = JSON.parse(fs.readFileSync('venues.json', 'utf-8'));

// CHANGED: create the output folder if it's missing
fs.mkdirSync('embeddings', { recursive: true });

const decode = (s = '') =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

for (let venue of venues) {
  const inFile = `thesis-data/thesis-${venue.id}.json`;
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
    let text = title + '\n' + description;
    let output;
    try {
      output = await extractor(text, { pooling: 'mean', normalize: true });
    } catch (e) {
      console.log(e);
      continue;
    }
    const embedding = output.tolist()[0];
    // CHANGED: save the project ID so results can link to the WordPress page
    const id = project.project_id ?? project.id;
    outputJSON.embeddings.push({ id, title, student, year: venue.name, description, embedding });
  }
  const fileOut = `embeddings/thesis-embeddings-${venue.id}.json`;
  fs.writeFileSync(fileOut, JSON.stringify(outputJSON));
  console.log(`Embeddings saved to ${fileOut}`);
}