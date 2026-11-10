import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';

env.allowLocalModels = false;
const THRESHOLD = 0.4;

console.log('Semantic search: loading model + embeddings...');

const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');

// Load embeddings from the plugin folder (not the page's URL)
const raw = await fetch(new URL('thesis-embeddings-202.json', import.meta.url));
const { embeddings } = await raw.json();

// Modules run after the page is parsed, so the search box already exists
const input = document.querySelector('input[name="s"], input[type="search"]');
console.log('Semantic search ready. Search box:', input);

if (input) {
  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); // stop WordPress search reload so we can see our results

    const query = input.value.trim();
    if (!query) return;

    const output = await extractor(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = output.data;

    const scored = embeddings
      .map((item) => ({ item, score: cosineSimilarity(item.embedding, queryEmbedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .filter((r) => r.score >= THRESHOLD);

      const ids = scored.map(({ item }) => item.id).filter(Boolean);
      console.log('Semantic IDs:', ids);
      window.location.href =
      `${window.semanticSearch.home}?s=${encodeURIComponent(query)}&semantic=${ids.join(',') || 0}`;

  });
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// console.log('Hello from my semantic search plugin!');

// document.addEventListener('DOMContentLoaded', () => {
//   const input = document.querySelector('input[name="s"], input[type="search"]');
//   console.log('Search box found:', input);
//   if (input) {
//     input.addEventListener('keydown', (e) => {
//       if (e.key === 'Enter') {
//         // e.preventDefault();
//         console.log('You searched:', input.value);
//       }
//     });
//   }
// });