import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';

env.allowLocalModels = false;

// One file per year (venue id from venues.json); add more here
const EMBEDDINGS_FILES = [
  'thesis-embeddings-188.json', // 2023
  'thesis-embeddings-193.json', // 2023 Low Res
  'thesis-embeddings-202.json', // 2024
  'thesis-embeddings-224.json', // 2026
  'thesis-embeddings-214.json', // 2025 (data exported from WordPress; API returns none)
];
const THRESHOLD = 0.4;       // min semantic score (unless a keyword matches)
const MAX_RESULTS = 10;
const SEMANTIC_WEIGHT = 0.7; // blend weights (add up to 1)
const KEYWORD_WEIGHT = 0.3;

// On the results page: print the score table and put projects in ranked order
// (the theme shuffles them randomly). Runs before the model loads.
showRankedResults();

function showRankedResults() {
  let last;
  try { last = JSON.parse(sessionStorage.getItem('semanticResults')); } catch (e) {}
  const s = new URLSearchParams(location.search).get('s');
  if (!last || s === null || last.q !== s.trim()) return;

  // Gallery items have ids like "project-10964"; append in rank order
  const list = document.querySelector('.gallery-list');
  const rows = last.rows.map((row) => {
    const li = document.getElementById(`project-${row.id}`);
    if (list && li && li.parentElement === list) list.appendChild(li);
    // shown = false means WordPress has no post with this project_id
    return { ...row, shown: !!li };
  });
  console.table(rows);
}

const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');

// Load every year's embeddings from the plugin's embeddings/ folder; skip any that fail
let embeddings = [];
for (const file of EMBEDDINGS_FILES) {
  try {
    const res = await fetch(new URL(`embeddings/${file}`, import.meta.url));
    embeddings = embeddings.concat((await res.json()).embeddings);
  } catch (e) {
    console.log('Could not load', file);
  }
}

// Modules run after the page is parsed, so the search box already exists
const input = document.querySelector('input[name="s"], input[type="search"]');
console.log('Semantic search ready.');

if (input) {
  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); // stop WordPress search reload so we can see our results

    const query = input.value.trim();
    if (!query) return;

    try {
      const scored = await rankProjects(query);
      const ids = scored.map(({ item }) => item.id).filter(Boolean);
      // Save scores so the results page can print the table and order the projects
      const rows = scored.map((r) => ({ id: r.item.id, title: r.item.title, sem: +r.sem.toFixed(2), kw: +r.kw.toFixed(2), blend: +r.blend.toFixed(2) }));
      try { sessionStorage.setItem('semanticResults', JSON.stringify({ q: query, rows })); } catch (e) {}
      // Pass IDs in a short-lived cookie (tied to this query) so the URL stays clean
      document.cookie = `semantic=${encodeURIComponent(JSON.stringify({ q: query, ids }))}; path=/; max-age=300`;
    } catch (err) {
      // Semantic search broke: clear old results so WordPress runs its normal keyword search
      console.warn('Semantic search failed, using keyword search instead:', err);
      document.cookie = 'semantic=; path=/; max-age=0';
      try { sessionStorage.removeItem('semanticResults'); } catch (e) {}
    }
    window.location.href = `${window.semanticSearch.home}?s=${encodeURIComponent(query)}`;
  });
}

// Score every project: meaning (title + description) blended with keyword (title + student name)
async function rankProjects(query) {
  const output = await extractor(query, { pooling: 'mean', normalize: true });
  const queryEmbedding = output.data;
  return embeddings
    .map((item) => {
      const sem = cosineSimilarity(item.embedding, queryEmbedding);
      const kw = keywordScore(query, `${item.title} ${item.student}`);
      // A full keyword match (e.g. someone's whole name) jumps to the top
      const blend = SEMANTIC_WEIGHT * sem + KEYWORD_WEIGHT * kw + (kw === 1 ? 1 : 0);
      return { item, sem, kw, blend };
    })
    .filter((r) => r.sem >= THRESHOLD || r.kw > 0)
    .sort((a, b) => b.blend - a.blend)
    .slice(0, MAX_RESULTS);
}

// Share (0 to 1) of query words that start a word in the title or name
function keywordScore(query, text) {
  const words = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (words.length === 0) return 0;
  const textWords = text.toLowerCase().split(/\W+/);
  // 1-letter words (e.g. the name "B") must match a whole word; longer words match the start
  const hits = words.filter((w) => textWords.some((t) => (w.length === 1 ? t === w : t.startsWith(w)))).length;
  return hits / words.length;
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