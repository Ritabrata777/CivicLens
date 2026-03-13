const db = require('better-sqlite3')('civic-lens.db');
const issueId = 'ISSUE-49976';
const row = db.prepare('SELECT image_url FROM issues WHERE id = ?').get(issueId);

if (row) {
    const url = row.image_url;
    if (!url) {
        console.log("Image URL is NULL or Empty.");
    } else {
        console.log(`Image URL Length: ${url.length}`);
        console.log(`Start: ${url.substring(0, 100)}`);
    }
} else {
    console.log("Issue not found.");
}
