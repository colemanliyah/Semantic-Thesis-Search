import fs from 'fs';

// For years the projects API returns nothing for (e.g. 2025):
// convert a phpMyAdmin JSON export of the WordPress posts into the thesis-data format.
// Usage: node convert-wp-export.js 214   (reads thesis-data/thesis-214-wp-export.json)
const id = process.argv[2];
if (!id) throw new Error('Usage: node convert-wp-export.js <venue id>');

const inFile = `thesis-data/thesis-${id}-wp-export.json`;
const outFile = `thesis-data/thesis-${id}.json`;

// phpMyAdmin wraps rows in header/database/table objects; rows are in the "table" one
const rows = JSON.parse(fs.readFileSync(inFile, 'utf-8')).find((x) => x.type === 'table').data;

const decode = (s = '') =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
const stripHtml = (h = '') => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const projects = rows.map((r) => {
  const body = r.description ?? '';
  // Keep only the "Project Description" section (other years' descriptions don't include tech details)
  const section = body.match(/<h2>\s*Project Description\s*<\/h2>([\s\S]*?)(?=<h2>|$)/i);
  return {
    project_id: r.project_id,
    project_name: decode(r.project_name ?? ''),
    users: [{ user_name: r.creators ?? '' }],
    description: stripHtml(section ? section[1] : body),
  };
});

fs.writeFileSync(outFile, JSON.stringify({ projects }));
console.log(`${projects.length} projects saved to ${outFile}`);
