import type { Issue, User, IssueStatus, IssueUpdate, BlockchainTransaction, IssueCategory, ResolutionEvidence } from '@/lib/types';
import connectToDatabase from '@/lib/db';
import UserModel from '@/db/models/User';
import { Issue as IssueModel, IssueUpdate as IssueUpdateModel, IssueUpvote as IssueUpvoteModel } from '@/db/models/Issue';
import { BlockchainTransaction as BlockchainTransactionModel, ResolutionEvidence as ResolutionEvidenceModel } from '@/db/models/Transaction';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  await connectToDatabase();
  const docs = await IssueModel.find({}).sort({ submitted_at: -1 }); // Mongoose returns Documents
  // Parallel mapping might be faster but keep it simple for now
  return Promise.all(docs.map(doc => mapIssue(doc)));
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await connectToDatabase();
  const doc = await IssueModel.findOne({ _id: id });
  return doc ? mapIssue(doc) : undefined;
}

export async function getIssuesByUserId(userId: string): Promise<Issue[]> {
  await connectToDatabase();
  const docs = await IssueModel.find({ submitted_by: userId }).sort({ submitted_at: -1 });
  return Promise.all(docs.map(doc => mapIssue(doc)));
}

export async function getUserById(id: string): Promise<User | undefined> {
  await connectToDatabase();
  const doc = await UserModel.findOne({ _id: id });
  return doc ? mapUser(doc) : undefined;
}

export async function getUserByEmail(email: string): Promise<any | undefined> {
  await connectToDatabase();
  const doc = await UserModel.findOne({ email });
  if (doc) {
    const obj = doc.toObject();
    obj.id = obj._id; // Ensure access to id
    return obj;
  }
  return undefined;
}

export async function ensureAdminUser(walletAddress: string, name: string): Promise<User> {
  await connectToDatabase();
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
  data: { title: string; description: string; category: IssueCategory, otherCategory?: string, location: string, isUrgent?: boolean, imageUrl?: string, lat?: string, lng?: string, licensePlate?: string, violationType?: string },
  userId: string
): Promise<Issue> {
  await connectToDatabase();
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
  await connectToDatabase();
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
  await connectToDatabase();
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
  await connectToDatabase();

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
  await connectToDatabase();
  await IssueUpdateModel.deleteMany({ issue_id: issueId });
  await IssueModel.deleteOne({ _id: issueId });
}

export async function getUserNotifications(userId: string): Promise<{ issueId: string; title: string; status: IssueStatus; timestamp: Date }[]> {
  await connectToDatabase();
  // Get all issues submitted by the user
  const issues = await getIssuesByUserId(userId);

  const notifications: { issueId: string; title: string; status: IssueStatus; timestamp: Date }[] = [];

  for (const issue of issues) {
    // issue.updates IS ALREADY SORTED DESC in mapIssue
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
}

export async function getLeaderboard(): Promise<{ user: User; points: number; issuesCount: number }[]> {
  await connectToDatabase();

  // This aggregation is complex to port 1:1 perfectly efficient, so we can do application-side aggregation or MongoDB Aggregation Pipeline
  // Let's use Aggregation Pipeline for efficiency

  const result = await UserModel.aggregate([
    {
      $match: { role: { $ne: 'admin' } }
    },
    {
      $lookup: {
        from: 'issues', // collection name (mongoose uses lowercased plural by default)
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
}

export async function addResolutionEvidence(issueId: string, adminId: string, imageUrl: string, notes?: string) {
  await connectToDatabase();
  await ResolutionEvidenceModel.create({
    issue_id: issueId,
    admin_id: adminId,
    image_url: imageUrl,
    notes: notes || null
  });
}
