import type { Issue, User, IssueStatus, IssueUpdate, BlockchainTransaction, IssueCategory, ResolutionEvidence, AppNotification as AppNotificationType, SOSAlert as SOSAlertType } from '@/lib/types';
import type { LocalityScoreResult } from '@/lib/types';
import connectToDatabase, { DatabaseConnectionError } from '@/lib/db';
import UserModel from '@/db/models/User';
import { Issue as IssueModel, IssueUpdate as IssueUpdateModel, IssueUpvote as IssueUpvoteModel } from '@/db/models/Issue';
import { BlockchainTransaction as BlockchainTransactionModel, ResolutionEvidence as ResolutionEvidenceModel } from '@/db/models/Transaction';
import { AppNotification as AppNotificationModel, SOSAlert as SOSAlertModel } from '@/db/models/SOS';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { buildLocalityScore, extractPincode } from '@/lib/locality-score';

const SOS_RADIUS_KM = 3;
const SOS_COOLDOWN_MS = 2 * 60 * 1000;
const SOS_HELP_REWARD_POINTS = 50;

function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof DatabaseConnectionError) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes('mongoserverselectionerror') ||
    normalized.includes('mongonetworktimeouterror') ||
    normalized.includes('mongonetworkerror') ||
    normalized.includes('etimedout') ||
    normalized.includes('timed out') ||
    normalized.includes('topology is closed') ||
    normalized.includes('database unavailable')
  );
}

async function withDatabaseReadFallback<T>(operation: string, fallback: T, action: () => Promise<T>): Promise<T> {
  try {
    await connectToDatabase();
    return await action();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[DB] ${operation} unavailable: ${message}`);
      return fallback;
    }

    throw error;
  }
}

async function ensureDatabaseWriteAccess(operation: string) {
  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Database unavailable for ${operation}. ${message}`);
    }

    throw error;
  }
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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
    rewardPoints: obj.reward_points || 0,
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

export async function getAppNotifications(userId: string): Promise<AppNotificationType[]> {
  return withDatabaseReadFallback('getAppNotifications', [], async () => {
    const [issueNotifications, appNotifications] = await Promise.all([
      getUserNotifications(userId),
      AppNotificationModel.find({ user_id: userId }).sort({ created_at: -1 }).limit(10).lean(),
    ]);

    const mappedIssueNotifications: AppNotificationType[] = issueNotifications.map((notification) => ({
      id: `issue-${notification.issueId}-${notification.timestamp.toISOString()}`,
      title: notification.title,
      message: `Status update: ${notification.status}`,
      href: `/issues/${notification.issueId}`,
      kind: 'issue_update',
      timestamp: notification.timestamp,
      status: notification.status,
    }));

    const mappedAppNotifications: AppNotificationType[] = appNotifications.map((notification: any) => ({
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      href: notification.href,
      kind: notification.kind,
      timestamp: new Date(notification.created_at),
      relatedSosId: notification.related_sos_id || undefined,
    }));

    return [...mappedAppNotifications, ...mappedIssueNotifications]
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
      .slice(0, 12);
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
          reward_points: { $ifNull: ['$reward_points', 0] },
          role: 1,
          issues_count: { $size: '$issues' },
          total_upvotes: { $sum: '$issues.upvotes' }
        }
      },
      { $sort: { reward_points: -1, total_upvotes: -1, issues_count: -1 } },
      { $limit: 5 }
    ]);

    return result.map((row: any) => ({
      user: {
        id: row._id,
        name: row.name,
        avatarUrl: row.avatar_url || '',
        imageHint: '',
        rewardPoints: row.reward_points || 0,
        role: row.role
      },
      points: (row.issues_count * 10) + row.total_upvotes + (row.reward_points || 0),
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
  submitted_by?: string | null;
  upvotes?: number | null;
};

export async function findNearbyLocalHeroesByPincode(options: {
  pincode: string;
  lat?: number;
  lng?: number;
  excludeUserId?: string;
}) {
  return withDatabaseReadFallback('findNearbyLocalHeroesByPincode', [], async () => {
    const issues = await IssueModel.find({})
      .select('_id submitted_by upvotes postal_code location_address location_lat location_lng')
      .lean();

    const heroMap = new Map<string, { issues_count: number; total_upvotes: number; minDistanceKm?: number }>();

    for (const issue of issues as LocalityLookupIssue[]) {
      const issuePincode = await resolveIssuePincode(issue);
      const submittedBy = issue.submitted_by;
      const issueLat = typeof issue.location_lat === 'number' ? issue.location_lat : undefined;
      const issueLng = typeof issue.location_lng === 'number' ? issue.location_lng : undefined;
      const hasCoordinates = typeof options.lat === 'number' && typeof options.lng === 'number' && typeof issueLat === 'number' && typeof issueLng === 'number';
      const distanceKm = hasCoordinates ? haversineDistanceKm(options.lat!, options.lng!, issueLat!, issueLng!) : undefined;
      const withinRadius = hasCoordinates && typeof distanceKm === 'number' ? distanceKm <= SOS_RADIUS_KM : false;
      const samePincode = issuePincode === options.pincode;

      if (!submittedBy || submittedBy === options.excludeUserId) {
        continue;
      }

      if (!withinRadius && !samePincode) {
        continue;
      }

      const current = heroMap.get(submittedBy) ?? { issues_count: 0, total_upvotes: 0, minDistanceKm: distanceKm };
      current.issues_count += 1;
      current.total_upvotes += issue.upvotes ?? 0;
      if (typeof distanceKm === 'number') {
        current.minDistanceKm = typeof current.minDistanceKm === 'number'
          ? Math.min(current.minDistanceKm, distanceKm)
          : distanceKm;
      }
      heroMap.set(submittedBy, current);
    }

    const rankedHeroes = [...heroMap.entries()]
      .map(([userId, stats]) => ({
        _id: userId,
        issues_count: stats.issues_count,
        total_upvotes: stats.total_upvotes,
        minDistanceKm: stats.minDistanceKm,
      }))
      .sort((left, right) => {
        const distanceDelta = (left.minDistanceKm ?? Number.MAX_SAFE_INTEGER) - (right.minDistanceKm ?? Number.MAX_SAFE_INTEGER);
        if (distanceDelta !== 0) {
          return distanceDelta;
        }

        return right.total_upvotes - left.total_upvotes || right.issues_count - left.issues_count;
      })
      .slice(0, 5);

    if (rankedHeroes.length === 0) {
      return [];
    }

    const users = await UserModel.find({
      _id: { $in: rankedHeroes.map((row: any) => row._id) },
      role: { $ne: 'admin' }
    }).lean();

    const userMap = new Map(users.map((user: any) => [user._id, user]));

    const nearbyHeroes: { user: User; points: number; issuesCount: number; distanceKm?: number }[] = [];

    for (const row of rankedHeroes as any[]) {
      const user = userMap.get(row._id);
      if (!user) {
        continue;
      }

      nearbyHeroes.push({
        user: mapUser(user),
        points: (row.issues_count * 10) + row.total_upvotes + ((user as any).reward_points || 0),
        issuesCount: row.issues_count,
        distanceKm: typeof row.minDistanceKm === 'number' ? row.minDistanceKm : undefined,
      });
    }

    return nearbyHeroes;
  });
}

async function findFallbackSOSHeroes(excludeUserId?: string) {
  return withDatabaseReadFallback('findFallbackSOSHeroes', [], async () => {
    const result = await UserModel.aggregate([
      {
        $match: {
          role: { $ne: 'admin' },
          ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
        }
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
          reward_points: { $ifNull: ['$reward_points', 0] },
          issues_count: { $size: '$issues' },
          total_upvotes: { $sum: '$issues.upvotes' }
        }
      },
      {
        $match: {
          $or: [
            { issues_count: { $gt: 0 } },
            { reward_points: { $gt: 0 } },
          ]
        }
      },
      { $sort: { reward_points: -1, total_upvotes: -1, issues_count: -1 } },
      { $limit: 5 }
    ]);

    return result.map((row: any) => ({
      user: {
        id: row._id,
        name: row.name,
        avatarUrl: row.avatar_url || '',
        imageHint: '',
        rewardPoints: row.reward_points || 0,
        role: row.role
      },
      points: (row.issues_count * 10) + row.total_upvotes + (row.reward_points || 0),
      issuesCount: row.issues_count,
      distanceKm: undefined,
    }));
  });
}

export async function createSOSAlert(data: {
  emergencyType: string;
  details?: string;
  locationAddress: string;
  pincode: string;
  lat?: number;
  lng?: number;
}, userId: string): Promise<{ alert: SOSAlertType; notifiedHeroes: { user: User; points: number; issuesCount: number; distanceKm?: number }[] }> {
  await ensureDatabaseWriteAccess('createSOSAlert');

  const pincode = extractPincode(data.pincode || data.locationAddress);
  if (!pincode) {
    throw new Error('A valid pincode is required for SOS alerts.');
  }

  const mostRecentAlert = await SOSAlertModel.findOne({ sender_id: userId }).sort({ created_at: -1 }).lean();
  if (mostRecentAlert && Date.now() - new Date(mostRecentAlert.created_at).getTime() < SOS_COOLDOWN_MS) {
    throw new Error('Please wait a moment before sending another SOS alert.');
  }

  let nearbyHeroes = await findNearbyLocalHeroesByPincode({
    pincode,
    lat: data.lat,
    lng: data.lng,
    excludeUserId: userId,
  });

  if (nearbyHeroes.length === 0) {
    nearbyHeroes = await findFallbackSOSHeroes(userId);
  }
  const alertId = `SOS-${Math.floor(Math.random() * 90000) + 10000}`;

  const alertDoc = await SOSAlertModel.create({
    _id: alertId,
    sender_id: userId,
    emergency_type: data.emergencyType,
    details: data.details || null,
    location_address: data.locationAddress,
    postal_code: pincode,
    location_lat: data.lat ?? null,
    location_lng: data.lng ?? null,
    status: 'Active',
    notified_hero_ids: nearbyHeroes.map((entry) => entry.user.id),
    accepted_by_id: null,
    accepted_at: null,
  });

  const sender = await getUserById(userId);
  const senderName = sender?.name || 'A resident';
  const notifications = nearbyHeroes.map((entry) => ({
    user_id: entry.user.id,
    title: `SOS nearby: ${data.emergencyType}`,
    message: `${senderName} needs help near ${data.locationAddress}.${typeof entry.distanceKm === 'number' ? ` About ${entry.distanceKm.toFixed(1)} km away.` : ''}`,
    href: '/profile?sos=helpers',
    kind: 'sos_alert',
    related_sos_id: alertId,
  }));

  notifications.push({
    user_id: userId,
    title: 'SOS sent successfully',
    message: nearbyHeroes.length > 0
      ? `${nearbyHeroes.length} nearby local hero${nearbyHeroes.length === 1 ? '' : 'es'} have been alerted.`
      : 'Your SOS has been saved, but no nearby local heroes were found yet.',
    href: '/profile?sos=mine',
    kind: 'sos_sent',
    related_sos_id: alertId,
  });

  if (notifications.length > 0) {
    await AppNotificationModel.insertMany(notifications);
  }

  return {
    alert: {
      id: alertDoc._id,
      senderId: alertDoc.sender_id,
      emergencyType: alertDoc.emergency_type,
      details: alertDoc.details || undefined,
      locationAddress: alertDoc.location_address,
      pincode: alertDoc.postal_code,
      locationLat: alertDoc.location_lat || undefined,
      locationLng: alertDoc.location_lng || undefined,
      status: alertDoc.status as SOSAlertType['status'],
      createdAt: new Date(alertDoc.created_at),
      notifiedHeroIds: alertDoc.notified_hero_ids || [],
      acceptedById: alertDoc.accepted_by_id || undefined,
      acceptedAt: alertDoc.accepted_at ? new Date(alertDoc.accepted_at) : undefined,
    },
    notifiedHeroes: nearbyHeroes,
  };
}

async function mapSOSAlertWithUsers(alert: any, userMap: Map<string, any>): Promise<SOSAlertType> {
  return {
    id: alert._id,
    senderId: alert.sender_id,
    senderName: userMap.get(alert.sender_id)?.name,
    emergencyType: alert.emergency_type,
    details: alert.details || undefined,
    locationAddress: alert.location_address,
    pincode: alert.postal_code,
    locationLat: alert.location_lat || undefined,
    locationLng: alert.location_lng || undefined,
    status: alert.status as SOSAlertType['status'],
    createdAt: new Date(alert.created_at),
    notifiedHeroIds: alert.notified_hero_ids || [],
    acceptedById: alert.accepted_by_id || undefined,
    acceptedByName: alert.accepted_by_id ? userMap.get(alert.accepted_by_id)?.name : undefined,
    acceptedAt: alert.accepted_at ? new Date(alert.accepted_at) : undefined,
    acceptedHelperLocationAddress: alert.accepted_helper_location_address || undefined,
    acceptedHelperLocationLat: alert.accepted_helper_location_lat || undefined,
    acceptedHelperLocationLng: alert.accepted_helper_location_lng || undefined,
  };
}

export async function getSOSAlertsForHero(userId: string): Promise<SOSAlertType[]> {
  return withDatabaseReadFallback('getSOSAlertsForHero', [], async () => {
    const alerts = await SOSAlertModel.find({
      notified_hero_ids: userId,
      status: { $in: ['Active', 'Accepted'] },
    }).sort({ created_at: -1 }).lean();

    if (alerts.length === 0) {
      return [];
    }

    const userIds = new Set<string>();
    alerts.forEach((alert: any) => {
      userIds.add(alert.sender_id);
      if (alert.accepted_by_id) {
        userIds.add(alert.accepted_by_id);
      }
    });

    const users = await UserModel.find({ _id: { $in: [...userIds] } }).lean();
    const userMap = new Map(users.map((user: any) => [user._id, user]));

    return Promise.all(alerts.map((alert: any) => mapSOSAlertWithUsers(alert, userMap)));
  });
}

export async function getSOSAlertsBySender(userId: string): Promise<SOSAlertType[]> {
  return withDatabaseReadFallback('getSOSAlertsBySender', [], async () => {
    const alerts = await SOSAlertModel.find({ sender_id: userId }).sort({ created_at: -1 }).limit(10).lean();

    if (alerts.length === 0) {
      return [];
    }

    const acceptedIds = alerts
      .map((alert: any) => alert.accepted_by_id)
      .filter(Boolean);

    const users = acceptedIds.length > 0
      ? await UserModel.find({ _id: { $in: acceptedIds } }).lean()
      : [];
    const userMap = new Map(users.map((user: any) => [user._id, user]));

    return Promise.all(alerts.map((alert: any) => mapSOSAlertWithUsers(alert, userMap)));
  });
}

export async function acceptSOSAlert(
  alertId: string,
  userId: string,
  helperLocation?: { address?: string; lat?: number; lng?: number }
): Promise<SOSAlertType> {
  await ensureDatabaseWriteAccess('acceptSOSAlert');

  const alert = await SOSAlertModel.findOne({
    _id: alertId,
    notified_hero_ids: userId,
  });

  if (!alert) {
    throw new Error('SOS alert not found for this helper.');
  }

  if (alert.status === 'Resolved') {
    throw new Error('This SOS alert is already resolved.');
  }

  if (alert.status === 'Accepted' && alert.accepted_by_id === userId) {
    throw new Error('You already accepted this SOS alert.');
  }

  if (alert.status === 'Accepted' && alert.accepted_by_id && alert.accepted_by_id !== userId) {
    throw new Error('Another local hero has already accepted this SOS alert.');
  }

  alert.status = 'Accepted';
  alert.accepted_by_id = userId;
  alert.accepted_at = new Date();
  if (helperLocation?.address) {
    alert.accepted_helper_location_address = helperLocation.address;
  }
  if (typeof helperLocation?.lat === 'number') {
    alert.accepted_helper_location_lat = helperLocation.lat;
  }
  if (typeof helperLocation?.lng === 'number') {
    alert.accepted_helper_location_lng = helperLocation.lng;
  }
  await Promise.all([
    alert.save(),
    UserModel.updateOne({ _id: userId }, { $inc: { reward_points: SOS_HELP_REWARD_POINTS } }),
  ]);

  const helper = await getUserById(userId);
  await AppNotificationModel.create({
    user_id: alert.sender_id,
    title: 'A Local Hero is on the way',
    message: `${helper?.name || 'A nearby local hero'} accepted your SOS request.`,
    href: '/profile?sos=mine',
    kind: 'sos_sent',
    related_sos_id: alertId,
  });

  await AppNotificationModel.create({
    user_id: userId,
    title: 'SOS reward earned',
    message: `You earned ${SOS_HELP_REWARD_POINTS} points for responding to an SOS alert.`,
    href: '/profile?sos=helpers',
    kind: 'sos_alert',
    related_sos_id: alertId,
  });

  return {
    id: alert._id,
    senderId: alert.sender_id,
    emergencyType: alert.emergency_type,
    details: alert.details || undefined,
    locationAddress: alert.location_address,
    pincode: alert.postal_code,
    locationLat: alert.location_lat || undefined,
    locationLng: alert.location_lng || undefined,
    status: alert.status as SOSAlertType['status'],
    createdAt: new Date(alert.created_at),
    notifiedHeroIds: alert.notified_hero_ids || [],
    acceptedById: alert.accepted_by_id || undefined,
    acceptedByName: helper?.name,
    acceptedAt: alert.accepted_at ? new Date(alert.accepted_at) : undefined,
    acceptedHelperLocationAddress: alert.accepted_helper_location_address || undefined,
    acceptedHelperLocationLat: alert.accepted_helper_location_lat || undefined,
    acceptedHelperLocationLng: alert.accepted_helper_location_lng || undefined,
  };
}

export async function getSOSAlertsForAdmin(): Promise<SOSAlertType[]> {
  return withDatabaseReadFallback('getSOSAlertsForAdmin', [], async () => {
    const alerts = await SOSAlertModel.find({})
      .sort({ created_at: -1 })
      .limit(40)
      .lean();

    if (alerts.length === 0) {
      return [];
    }

    const userIds = new Set<string>();
    alerts.forEach((alert: any) => {
      userIds.add(alert.sender_id);
      if (alert.accepted_by_id) {
        userIds.add(alert.accepted_by_id);
      }
    });

    const users = await UserModel.find({ _id: { $in: [...userIds] } }).lean();
    const userMap = new Map(users.map((user: any) => [user._id, user]));

    return Promise.all(alerts.map((alert: any) => mapSOSAlertWithUsers(alert, userMap)));
  });
}

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
