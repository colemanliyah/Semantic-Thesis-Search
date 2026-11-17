import fs from 'fs';

// Usage: node fetch-projects.js 214 188   (venue ids from venues.json; none = all)
const allVenues = JSON.parse(fs.readFileSync('venues.json', 'utf-8')).venues;
const ids = process.argv.slice(2).map(Number);
const venues = ids.length ? allVenues.filter((v) => ids.includes(v.id)) : allVenues;

for (let i = 0; i < venues.length; i++) {
  let venue = venues[i];
  console.log(venue);
  let url = `https://itp.nyu.edu/projects/public/projectsJSON_ALL.php?venue_id=${venue.id}`;

  console.log(`Fetching data from ${url}...`);
  let response = await fetch(url);
  let json = await response.json();
  let output = {
    projects: json,
  };
  fs.writeFileSync(`thesis-data/thesis-${venue.id}.json`, JSON.stringify(output));
}
