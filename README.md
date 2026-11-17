# ITP Thesis Semantic Search

Semantic + keyword search for the ITP thesis archive (WordPress). Each project's title + description is turned into an embedding (a list of numbers that captures meaning) with the [bge-small](https://huggingface.co/BAAI/bge-small-en-v1.5) model and [transformers.js](https://www.npmjs.com/package/@xenova/transformers). A WordPress plugin compares your search against those embeddings and shows the closest projects.

## What's where

| Path | What it is |
| --- | --- |
| `venues.json` | Thesis years and their venue ids in the ITP projects database (e.g. 2026 = 224) |
| `fetch-projects.js` | Downloads each year's projects from the ITP projects API into `thesis-data/` |
| `convert-wp-export.js` | For years the API returns nothing: converts a WordPress database export into `thesis-data/` |
| `make-embeddings.js` | Turns `thesis-data/thesis-<id>.json` into `embeddings/thesis-embeddings-<id>.json` |
| `thesis-data/` | Raw project data (not in git; re-create with the scripts) |
| `embeddings/` | Embeddings the plugin searches (in git) |
| `wordpress-plugin/` | The Semantic Search plugin (`semantic-search.js` + `semantic-search.php`) |
| `deploy.sh` | Copies the plugin + embeddings into the local MAMP site |
| `prototypes/` | Earlier experiments ([see its README](prototypes/README.md)) |

## How the data was fetched

| Year | Venue id | Source |
| --- | --- | --- |
| 2023 | 188, 193 (Low Res) | ITP projects API |
| 2024 | 202 | ITP projects API |
| 2025 | 214 | WordPress export (the API returns no projects for 214) |
| 2026 | 224 | ITP projects API |

The API (`itp.nyu.edu/projects/public/projectsJSON_ALL.php`) redirects to `internal.itp.nyu.edu`, whose certificate Node rejects. To fetch anyway, turn off certificate checking for that one run:

```sh
NODE_TLS_REJECT_UNAUTHORIZED=0 node fetch-projects.js 224
```

## Adding a new thesis year

1. Add the year to `venues.json` (`{ "id": <venue id>, "name": "Thesis Spring 20XX" }`).
2. Fetch its projects: `NODE_TLS_REJECT_UNAUTHORIZED=0 node fetch-projects.js <id>`
   - If `thesis-data/thesis-<id>.json` comes back as `{"projects":[]}`, export from WordPress instead: run the SQL below in phpMyAdmin (swap `wp_4_` for that year's table prefix), **Export → JSON**, save as `thesis-data/thesis-<id>-wp-export.json`, then run `node convert-wp-export.js <id>`.
3. Make embeddings: `node make-embeddings.js <id>`
4. Add `'thesis-embeddings-<id>.json'` to `EMBEDDINGS_FILES` at the top of `wordpress-plugin/semantic-search.js`.
5. Deploy: `./deploy.sh`, and make sure the plugin is active on that year's site (each year is its own site in the multisite).

```sql
SELECT pid.meta_value AS project_id, p.post_title AS project_name,
       cr.meta_value AS creators, p.post_content AS description
FROM wp_4_posts p
JOIN wp_4_postmeta pid ON pid.post_id = p.ID AND pid.meta_key = 'project_id'
LEFT JOIN wp_4_postmeta cr ON cr.post_id = p.ID AND cr.meta_key = 'creators'
WHERE p.post_status = 'publish';
```

## How search works

1. **Browser (`semantic-search.js`)**: when you press Enter in the search box, scores every project: 70% meaning (title + description) + 30% keyword (title + student name). A full keyword match (e.g. a whole name) jumps to the top. Keeps up to 10 results that score ≥ 0.4 or match a keyword.
2. **WordPress (`semantic-search.php`)**: shows only those projects, overriding the theme's and WP Extended Search's keyword search.
3. **Results page**: the plugin re-sorts the theme's (randomly shuffled) results into ranked order and prints a score table in the console. `shown: false` means that year's site has no post for that project.

Each year is a separate WordPress site, so a search only shows projects from the year you're on.

## Setup

```sh
npm install
```

`npm run fetch`, `npm run embeddings`, `npm run convert-wp`, `npm run deploy` and `npm run prototypes` run the same scripts (add venue ids after `--`, e.g. `npm run embeddings -- 224`).
