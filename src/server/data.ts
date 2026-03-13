import type { Issue, User, IssueStatus, IssueUpdate, BlockchainTransaction, IssueCategory, ResolutionEvidence } from '@/lib/types';
import type { LocalityScoreResult } from '@/lib/types';
import connectToDatabase, { DatabaseConnectionError } from '@/lib/db';
import UserModel from '@/db/models/User';
import { Issue as IssueModel, IssueUpdate as IssueUpdateModel, IssueUpvote as IssueUpvoteModel } from '@/db/models/Issue';
import { BlockchainTransaction as BlockchainTransactionModel, ResolutionEvidence as ResolutionEvidenceModel } from '@/db/models/Transaction';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { buildLocalityScore, extractPincode } from '@/lib/locality-score';

async function withDatabaseReadFallback<T>(operation: string, fallback: T, action: () => Promise<T>): Promise<T> {
  try {
    await connectToDatabase();
    return await action();
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      console.warn(`[DB] ${operation} unavailable: ${error.message}`);
      return fallback;
    }

    throw error;
  }
}

async function ensureDatabaseWriteAccess(operation: string) {
  try {
    await connectToDatabase();
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      throw new Error(`Database unavailable for ${operation}. ${error.message}`);
    }

    throw error;
  }
}

// Helper to map Mongoose doc to User type
function mapUser(doc: any): User {
  if (!doc) return undefined as any;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id, // Use string _id
    name: obj.name,
    avatarUrl: obj.avatar_url || '',
    imageHint: obj.image_hint || '',
    role: obj.role,
  };
}

// Helper to map Mongoose doc to Issue type
async function mapIssue(doc: any): Promise<Issue> {
  if (!doc) return undefined as any;
  const obj = doc.toObject ? doc.toObject() : doc;

  // Fetch updates
  const updatesDocs = await IssueUpdateModel.find({ issue_id: obj._id }).sort({ timestamp: -1 }).lean();
  const updates = updatesDocs.map((u: any) => ({
    timestamp: new Date(u.timestamp),
    status: u.status as IssueStatus,
    updatedBy: u.updated_by,
    notes: u.notes
  }));

  // Fetch blockchain transaction
  const txDoc = await BlockchainTransactionModel.findOne({ issue_id: obj._id }).sort({ timestamp: -1 }).lean();
  let blockchainTransaction: BlockchainTransaction | undefined;
  if (txDoc) {
    blockchainTransaction = {
      txHash: txDoc.tx_hash,
      blockNumber: 0,
      timestamp: new Date(txDoc.timestamp),
      adminId: txDoc.admin_id,
      status: txDoc.status as IssueStatus,
      explorerUrl: txDoc.explorer_url || `https://www.oklink.com/amoy/tx/${txDoc.tx_hash}`
    };
  }

  // Fetch resolution evidence
  const resEvDoc = await ResolutionEvidenceModel.findOne({ issue_id: obj._id }).lean();
  let resolutionEvidence: ResolutionEvidence | undefined;
  if (resEvDoc) {
    resolutionEvidence = {
      id: (resEvDoc as any)._id.toString(), // Mongoose ObjectId to string
      issueId: resEvDoc.issue_id,
      adminId: resEvDoc.admin_id,
      imageUrl: resEvDoc.image_url,
      notes: resEvDoc.notes,
      timestamp: new Date(resEvDoc.timestamp)
    };
  }

  return {
    id: obj._id,
    title: obj.title,
    description: obj.description,
    category: obj.category as IssueCategory,
    status: obj.status as IssueStatus,
    location: {
      lat: obj.location_lat,
      lng: obj.location_lng,
      address: obj.location_address
    },
    pincode: obj.postal_code || extractPincode(obj.location_address),
    imageUrl: obj.image_url,
    imageHint: obj.image_hint,
    submittedBy: obj.submitted_by,
    submittedAt: new Date(obj.submitted_at),
    upvotes: obj.upvotes,
    updates,
    isUrgent: Boolean(obj.is_urgent),
    licensePlate: obj.license_plate,
    violationType: obj.violation_type,
    blockchainTransaction,
    resolutionEvidence
  };
}

// --- READ operations ---

export async function getIssues(): Promise<Issue[]> {
  return withDatabaseReadFallback('getIssues', [], async () => {
    const docs = await IssueModel.find({}).sort({ submitted_at: -1 });
    return Promise.all(docs.map(doc => mapIssue(doc)));
  });
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  return withDatabaseReadFallback('getIssueById', undefined, async () => {
    const doc = await IssueModel.findOne({ _id: id });
    return doc ? mapIssue(doc) : undefined;
  });
}

export async function getIssuesByUserId(userId: string): Promise<Issue[]> {
  return withDatabaseReadFallback('getIssuesByUserId', [], async () => {
    const docs = await IssueModel.find({ submitted_by: userId }).sort({ submitted_at: -1 });
    return Promise.all(docs.map(doc => mapIssue(doc)));
  });
}

export async function getUserById(id: string): Promise<User | undefined> {
  return withDatabaseReadFallback('getUserById', undefined, async () => {
    const doc = await UserModel.findOne({ _id: id });
    return doc ? mapUser(doc) : undefined;
  });
}

export async function getUserByEmail(email: string): Promise<any | undefined> {
  return withDatabaseReadFallback('getUserByEmail', undefined, async () => {
    const doc = await UserModel.findOne({ email });
    if (doc) {
      const obj = doc.toObject();
      obj.id = obj._id;
      return obj;
    }
    return undefined;
  });
}

export async function ensureAdminUser(walletAddress: string, name: string): Promise<User> {
  await ensureDatabaseWriteAccess('ensureAdminUser');
  // Normalize address
  const id = walletAddress.toLowerCase();

  let user = await UserModel.findOne({ _id: id });

  if (!user) {
    console.log(`[AUTH] Creating new admin user for wallet: ${id}`);
    user = await UserModel.create({
      _id: id,
      email: `admin.${id.substring(0, 8)}@civic.local`, // Mock email
      password: 'wallet-authenticated', // Placeholder
      name: name || `Admin ${id.substring(0, 6)}`,
      role: 'admin',
      created_at: new Date()
    });
  } else {
    // Ensure role is admin
    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    // Update name if provided and significantly different? 
    // For now, let's stick to the existing record unless name is empty
    if (name && (!user.name || user.name.startsWith('Admin 0x'))) {
      user.name = name;
      await user.save();
    }
  }

  return mapUser(user);
}

// --- WRITE operations ---

export async function addIssue(
  data: { title: string; description: string; category: IssueCategory, otherCategory?: string, location: string, pincode: string, isUrgent?: boolean, imageUrl?: string, lat?: string, lng?: string, licensePlate?: string, violationType?: string },
  userId: string
): Promise<Issue> {
  await ensureDatabaseWriteAccess('addIssue');
  const finalCategory = data.category === 'Other' ? data.otherCategory! : data.category;
  const newId = `ISSUE-${Math.floor(Math.random() * 90000) + 10000}`;

  // Parse passed coords
  let lat = data.lat ? parseFloat(data.lat) : NaN;
  let lng = data.lng ? parseFloat(data.lng) : NaN;

  // Geocoding logic
  if (isNaN(lat) || isNaN(lng)) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
      if (apiKey && data.location && data.location.length > 3) {
        const encodedLoc = encodeURIComponent(data.location);
        const url = `https://api.maptiler.com/geocoding/${encodedLoc}.json?key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const geoData = await res.json();
          if (geoData.features && geoData.features.length > 0) {
            const [gLng, gLat] = geoData.features[0].center;
            lat = gLat;
            lng = gLng;
          }
        }
      }
    } catch (e) {
      console.error("Server-side geocoding failed:", e);
    }
  }

  const newIssue = new IssueModel({
    _id: newId,
    title: data.title,
    description: data.description,
    category: finalCategory,
    status: 'Pending',
    location_address: data.location || "Location not provided",
    postal_code: data.pincode || extractPincode(data.location),
    location_lat: isNaN(lat) ? null : lat,
    location_lng: isNaN(lng) ? null : lng,
    image_url: data.imageUrl || null,
    submitted_by: userId,
    submitted_at: new Date(),
    upvotes: 0,
    is_urgent: data.isUrgent ? 1 : 0,
    license_plate: data.licensePlate || null,
    violation_type: data.violationType || null
  });

  await newIssue.save();

  // Add initial history
  await IssueUpdateModel.create({
    issue_id: newId,
    status: 'Pending',
    updated_by: userId,
    notes: 'Issue submitted.'
  });

  return (await getIssueById(newId))!;
}

export async function addBlockchainTransaction(
  issueId: string,
  txHash: string,
  adminId: string,
  status: IssueStatus
) {
  await ensureDatabaseWriteAccess('addBlockchainTransaction');
  const explorerUrl = `https://www.oklink.com/amoy/tx/${txHash}`;

  await BlockchainTransactionModel.create({
    issue_id: issueId,
    tx_hash: txHash,
    admin_id: adminId,
    status: status,
    explorer_url: explorerUrl
  });
}

export async function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  notes?: string,
  txHash?: string,
  adminId?: string,
  resolutionImageUrl?: string
): Promise<Issue | undefined> {
  await ensureDatabaseWriteAccess('updateIssueStatus');
  const issue = await IssueModel.findOne({ _id: issueId });
  if (!issue) return undefined;

  const actualAdminId = adminId || 'admin-1';

  // Update issue status
  issue.status = newStatus;
  await issue.save();

  // Add update history
  await IssueUpdateModel.create({
    issue_id: issueId,
    status: newStatus,
    updated_by: actualAdminId,
    notes: notes || null
  });

  if (txHash) {
    await addBlockchainTransaction(issueId, txHash, actualAdminId, newStatus);
  }

  if (resolutionImageUrl && newStatus === 'Resolved') {
    await addResolutionEvidence(issueId, actualAdminId, resolutionImageUrl, notes);
  }

  return await getIssueById(issueId);
}

export async function incrementUpvote(issueId: string, userId: string): Promise<Issue | undefined> {
  await ensureDatabaseWriteAccess('incrementUpvote');

  // Check if already upvoted
  const existing = await IssueUpvoteModel.findOne({ issue_id: issueId, user_id: userId });
  if (existing) {
    throw new Error('You have already upvoted this issue.');
  }

  try {
    // Try to create upvote record
    await IssueUpvoteModel.create({ issue_id: issueId, user_id: userId });

    // Increment count on issue
    await IssueModel.updateOne({ _id: issueId }, { $inc: { upvotes: 1 } });

    return await getIssueById(issueId);
  } catch (e: any) {
    // Handle duplicate key error if race condition or index violation
    if (e.code === 11000) {
      throw new Error('You have already upvoted this issue.');
    }
    throw e;
  }
}

export async function deleteIssue(issueId: string): Promise<void> {
  await ensureDatabaseWriteAccess('deleteIssue');
  await IssueUpdateModel.deleteMany({ issue_id: issueId });
  await IssueModel.deleteOne({ _id: issueId });
}

export async function getUserNotifications(userId: string): Promise<{ issueId: string; title: string; status: IssueStatus; timestamp: Date }[]> {
  return withDatabaseReadFallback('getUserNotifications', [], async () => {
    const issues = await getIssuesByUserId(userId);

    const notifications: { issueId: string; title: string; status: IssueStatus; timestamp: Date }[] = [];

    for (const issue of issues) {
      const latestUpdate = issue.updates[0];

      if (latestUpdate && issue.status !== 'Pending') {
        notifications.push({
          issueId: issue.id,
          title: issue.title,
          status: issue.status,
          timestamp: latestUpdate.timestamp
        });
      }
    }

    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });
}

export async function getLeaderboard(): Promise<{ user: User; points: number; issuesCount: number }[]> {
  return withDatabaseReadFallback('getLeaderboard', [], async () => {
    const result = await UserModel.aggregate([
      {
        $match: { role: { $ne: 'admin' } }
      },
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'submitted_by',
          as: 'issues'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar_url: 1,
          role: 1,
          issues_count: { $size: '$issues' },
          total_upvotes: { $sum: '$issues.upvotes' }
        }
      },
      { $sort: { total_upvotes: -1, issues_count: -1 } },
      { $limit: 5 }
    ]);

    return result.map((row: any) => ({
      user: {
        id: row._id,
        name: row.name,
        avatarUrl: row.avatar_url || '',
        imageHint: '',
        role: row.role
      },
      points: (row.issues_count * 10) + row.total_upvotes,
      issuesCount: row.issues_count
    }));
  });
}

type LocalityLookupIssue = {
  _id?: string;
  category?: string | null;
  status?: string | null;
  is_urgent?: number | boolean | null;
  location_address?: string | null;
  postal_code?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
};

async function reverseGeocodePincode(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return undefined;
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  try {
    const response = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`, {
      cache: 'no-store',
    });

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
        feature?.context?.map((item: any) => item?.text).join(', '),
      ];

      for (const candidate of candidates) {
        const pincode = extractPincode(candidate);
        if (pincode) {
          return pincode;
        }
      }
    }
  } catch (error) {
    console.error('Reverse geocoding for pincode failed:', error);
  }

  return undefined;
}

async function resolveIssuePincode(issue: LocalityLookupIssue) {
  const directPincode = issue.postal_code || extractPincode(issue.location_address);
  if (directPincode) {
    return directPincode;
  }

  const inferredPincode = await reverseGeocodePincode(issue.location_lat, issue.location_lng);

  if (inferredPincode && issue._id) {
    await IssueModel.updateOne({ _id: issue._id }, { $set: { postal_code: inferredPincode } });
  }

  return inferredPincode;
}

export async function getLocalityScoreByPincode(rawPincode: string): Promise<LocalityScoreResult> {
  const pincode = extractPincode(rawPincode);

  if (!pincode) {
    throw new Error('Please enter a valid 6-digit pincode.');
  }

  await ensureDatabaseWriteAccess('getLocalityScoreByPincode');

  const issues = await IssueModel.find({})
    .select('_id category status is_urgent location_address postal_code location_lat location_lng')
    .lean();

  const normalizedIssues: LocalityLookupIssue[] = [];

  for (const issue of issues as LocalityLookupIssue[]) {
    const issuePincode = await resolveIssuePincode(issue);
    if (issuePincode === pincode) {
      normalizedIssues.push(issue);
    }
  }

  return buildLocalityScore(pincode, normalizedIssues);
}

export async function addResolutionEvidence(issueId: string, adminId: string, imageUrl: string, notes?: string) {
  await ensureDatabaseWriteAccess('addResolutionEvidence');
  await ResolutionEvidenceModel.create({
    issue_id: issueId,
    admin_id: adminId,
    image_url: imageUrl,
    notes: notes || null
  });
}
