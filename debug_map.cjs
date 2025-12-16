const db = require('better-sqlite3')('civic-lens.db');
require('dotenv').config({ path: '.env.local' }); // Try .env.local or .env

const issueId = 'ISSUE-49976';
const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);

if (row) {
    console.log(`Issue: ${row.id}`);
    console.log(`Address: ${row.location_address}`);
    console.log(`Coords: ${row.location_lat}, ${row.location_lng}`);

    // Check if it matches NYC
    if (Math.abs(row.location_lat - 40.7128) < 0.0001 && Math.abs(row.location_lng + 74.0060) < 0.0001) {
        console.log("MATCH: Coordinates are exactly New York default.");
    } else {
        console.log("Coordinates are NOT New York default.");
    }
} else {
    console.log("Issue not found!");
}

// Test Geocoding
async function testGeocode(address) {
    const apiKey = "oAPxqvpoopxW2UuSaxWU"; // From previous turns or env
    console.log(`\nTesting Geocode for: ${address}`);
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${apiKey}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                console.log("Geocode SUCCESS:", data.features[0].center);
                console.log("Place Name:", data.features[0].place_name);
            } else {
                console.log("Geocode FAILED: No features found.");
            }
        } else {
            console.log("Geocode HTTP Error:", res.status, res.statusText);
        }
    } catch (e) {
        console.log("Geocode EXCEPTION:", e.message);
    }
}

if (row) {
    testGeocode(row.location_address);
}
