# ITP Thesis Semantic Search

Fetches projects from the ITP Project Database, generates embeddings, and uses them for semantic + keyword search on the WordPress thesis archive.

- Run here: https://editor.p5js.org/a2zitp/sketches/6UACQFJmg

* `venues.json`: thesis years and their venue ids (e.g. 202 = 2024, 224 = 2026)
* `fetch-projects-db.js`: download project data into `thesis-data/`
* `embeddings-transformers.js`: generate embeddings into `embeddings/` (bge-small model, transformers.js)
* `wordpress-plugin/`: the Semantic Search WordPress plugin (list years in `EMBEDDINGS_FILES` in `semantic-search.js`)
* `deploy.sh`: copy the plugin + embeddings into the local MAMP site
* `prototypes/` + `index.js`: earlier browser prototypes, served at http://localhost:3000

```sh
npm install
node fetch-projects-db.js
node embeddings-transformers.js 224 202   # venue ids; none = all years
./deploy.sh
```

- [transformers.js package](https://www.npmjs.com/package/@xenova/transformers)
- [bge-small model](https://huggingface.co/ggrn/bge-small-en)
