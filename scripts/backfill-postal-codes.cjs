require('dotenv').config();
const mongoose = require('mongoose');

const PINCODE_REGEX = /(?<!\d)(\d{3})[\s-]?(\d{3})(?!\d)/;

function extractPincode(value) {
  if (!value) {
    return undefined;
  }

  const match = String(value).trim().match(PINCODE_REGEX);
  return match ? `${match[1]}${match[2]}` : undefined;
}

async function reverseGeocodePincode(lat, lng) {
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return undefined;
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const response = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`);
  if (!response.ok) {
    return undefined;
  }

  const data = await response.json();
  const features = Array.isArray(data.features) ? data.features : [];

  for (const feature of features) {
    const candidates = [
      feature?.place_name,
      feature?.text,
      feature?.properties?.postcode,
      Array.isArray(feature?.context) ? feature.context.map((item) => item?.text).join(', ') : undefined,
    ];

    for (const candidate of candidates) {
      const pincode = extractPincode(candidate);
      if (pincode) {
        return pincode;
      }
    }
  }

  return undefined;
}

async function main() {
  const uri = (process.env.MONGODB_DIRECT_URI || process.env.MONGODB_URI || '').trim();
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    throw new Error('Missing MongoDB configuration in .env');
  }

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });

  const issues = mongoose.connection.db.collection('issues');
  const cursor = issues.find(
    {
      $or: [
        { postal_code: { $exists: false } },
        { postal_code: null },
        { postal_code: '' },
      ],
    },
    {
      projection: {
        _id: 1,
        location_address: 1,
        location_lat: 1,
        location_lng: 1,
      },
    }
  );

  let scanned = 0;
  let updated = 0;

  while (await cursor.hasNext()) {
    const issue = await cursor.next();
    scanned += 1;

    const pincode = extractPincode(issue.location_address)
      || await reverseGeocodePincode(issue.location_lat, issue.location_lng);
    if (!pincode) {
      continue;
    }

    await issues.updateOne(
      { _id: issue._id },
      { $set: { postal_code: pincode } }
    );

    updated += 1;
    console.log(`Updated ${issue._id} -> ${pincode}`);
  }

  console.log(`Scanned ${scanned} issues, updated ${updated}.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
