# Prototypes

Early browser experiments that came before the WordPress plugin. Each folder is a standalone page with its own copy of the data it needs.

| Folder | What it does |
| --- | --- |
| `semantic-search/` | Plain semantic search box over the 2024 embeddings (the plugin grew out of this) |
| `markov-chain/` | Suggests ways to finish what you type using a RiTa Markov chain trained on 2024 thesis text, then searches the embeddings |
| `explore-prototype/` | A variation of `markov-chain/` using an older 2024 data file |

Run them from the repo root:

```sh
node prototypes/server.js
```

Then open http://localhost:3000/semantic-search/ (or `/explore-prototype/`, `/markov-chain/`).
