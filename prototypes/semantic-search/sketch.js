import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';

// Prevent Transformers.js from trying to fetch from the local server first
env.allowLocalModels = false;

// Hide results scoring below this (0 shows everything)
const THRESHOLD = 0.4;

const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
async function getEmbeddings(sentences) {
  let embeddings = [];
  for (let sentence of sentences) {
    let output = await extractor(sentence, { pooling: 'mean', normalize: true });
    embeddings.push(output.data);
  }
  return embeddings;
}

const raw = await fetch('thesis-embeddings-202.json');
const { embeddings } = await raw.json();

const searchInput = document.getElementById('searchInput');
const results = document.getElementById('searchResults');

console.log('ready (ignore errors!)');

searchInput.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter') return;

  const query = event.target.value;
  if (!query.trim()) return;

  const queryEmbedding = await getEmbeddings([query]);

  const similarities = embeddings.map((embedding) => 
    cosineSimilarity(embedding.embedding, queryEmbedding[0])
  );
  
  const sortedIndices = similarities
    .map((_, i) => i)
    .sort((a, b) => similarities[b] - similarities[a]);
    
  const topIndices = sortedIndices
    .slice(0, 5)
    .filter((i) => similarities[i] >= THRESHOLD);

  results.innerHTML = '';
  for (let i of topIndices) {
    const li = document.createElement('li');
    li.textContent = `${similarities[i].toFixed(3)} | ${embeddings[i].text}`;
    results.appendChild(li);
  }
});

function dotProduct(vecA, vecB) {
  return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
}

function magnitude(vec) {
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(vecA, vecB) {
  const numerator = dotProduct(vecA, vecB);
  const denominator = magnitude(vecA) * magnitude(vecB);
  return numerator / denominator;
}