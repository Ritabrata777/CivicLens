import type { Issue, User, IssueStatus, IssueUpdate, BlockchainTransaction, IssueCategory } from '@/lib/types';
import db from '@/db';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Helper to map DB user row to User type
function mapUser(row: any): User {
  if (!row) return undefined as any;
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url || '',
    imageHint: row.image_hint || '', // DB might not have this, default empty
    role: row.role,
    // We don't expose password or email in the User public interface mostly
  };
}

// Helper to map DB issue row to Issue type
function mapIssue(row: any): Issue {
  if (!row) return undefined as any;

  // Fetch updates for this issue
  const updatesFn = db.prepare('SELECT * FROM issue_updates WHERE issue_id = ? ORDER BY timestamp DESC');
  const updatesRows = updatesFn.all(row.id) as any[];

  const updates: IssueUpdate[] = updatesRows.map(u => ({
    timestamp: new Date(u.timestamp), // Stored as Ms or Seconds? Let's use Ms in DB for simplicity
    status: u.status as IssueStatus,
    updatedBy: u.updated_by,
    notes: u.notes
  }));

  // Parse location
  const location = {
    lat: row.location_lat,
    lng: row.location_lng,
    address: row.location_address
  };

  // Fetch blockchain transaction
  const txFn = db.prepare('SELECT * FROM blockchain_transactions WHERE issue_id = ?');
  const txRow = txFn.get(row.id) as any;

  let blockchainTransaction: BlockchainTransaction | undefined;
  if (txRow) {
    blockchainTransaction = {
      txHash: txRow.tx_hash,
      blockNumber: 0, // Not stored in simplifed DB
      timestamp: new Date(txRow.timestamp),
      adminId: txRow.admin_id,
      status: txRow.status as IssueStatus,
      explorerUrl: txRow.explorer_url || `https://sepolia.etherscan.io/tx/${txRow.tx_hash}` // Default valid URL or from DB
    };
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as IssueCategory,
    status: row.status as IssueStatus,
    location,
    imageUrl: row.image_url,
    imageHint: row.image_hint,
    submittedBy: row.submitted_by,
    submittedAt: new Date(row.submitted_at),
    upvotes: row.upvotes,
    updates,
    isUrgent: Boolean(row.is_urgent),
    licensePlate: row.license_plate,
    violationType: row.violation_type,
    blockchainTransaction,
  };
}

// --- READ operations ---

export async function getIssues(): Promise<Issue[]> {
  const stmt = db.prepare('SELECT * FROM issues ORDER BY submitted_at DESC');
  const rows = stmt.all();
  return rows.map(mapIssue);
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  const stmt = db.prepare('SELECT * FROM issues WHERE id = ?');
  const row = stmt.get(id);
  return row ? mapIssue(row) : undefined;
}

export async function getIssuesByUserId(userId: string): Promise<Issue[]> {
  const stmt = db.prepare('SELECT * FROM issues WHERE submitted_by = ? ORDER BY submitted_at DESC');
  const rows = stmt.all(userId);
  return rows.map(mapIssue);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id);
  return row ? mapUser(row) : undefined;
}

export async function getUserByEmail(email: string): Promise<any | undefined> {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const row = stmt.get(email);
  return row;
}

// --- WRITE operations ---

export async function addIssue(
  data: { title: string; description: string; category: IssueCategory, otherCategory?: string, location: string, isUrgent?: boolean, imageUrl?: string, lat?: string, lng?: string, licensePlate?: string, violationType?: string },
  userId: string
): Promise<Issue> {
  const finalCategory = data.category === 'Other' ? data.otherCategory! : data.category;
  const newId = `ISSUE-${Math.floor(Math.random() * 90000) + 10000}`;
  const now = Date.now(); // Store as Ms

  // Parse passed coords
  let lat = data.lat ? parseFloat(data.lat) : NaN;
  let lng = data.lng ? parseFloat(data.lng) : NaN;

  // If coords are missing or invalid, try to geocode the text location
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
            // MapTiler/GeoJSON returns [lng, lat]
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

  // No fallback to New York. If geocoding fails, we store null/invalid.
  // This prevents misleading map markers.
  /*
  if (isNaN(lat) || isNaN(lng)) {
    lat = 40.7128;
    lng = -74.0060;
  }
  */

  // Pick specific placeholder ONLY if we want a default (User requested NO generic photos)
  // const ph = PlaceHolderImages.find(img => img.id === 'generic-issue-1');
  const finalImageUrl = data.imageUrl || null; // No fallback image

  const stmt = db.prepare(`
      INSERT INTO issues (
        id, title, description, category, status, 
        location_address, location_lat, location_lng, 
        image_url, image_hint, submitted_by, submitted_at, 
        upvotes, is_urgent, license_plate, violation_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

  stmt.run(
    newId, data.title, data.description, finalCategory, 'Pending',
    data.location || "Location not provided", lat, lng,
    finalImageUrl, null, userId, now,
    0, data.isUrgent ? 1 : 0,
    data.licensePlate || null, data.violationType || null
  );

  // Add initial history
  const updateStmt = db.prepare(`
        INSERT INTO issue_updates (issue_id, status, timestamp, updated_by, notes)
        VALUES (?, ?, ?, ?, ?)
    `);
  updateStmt.run(newId, 'Pending', now, userId, 'Issue submitted.');

  return (await getIssueById(newId))!;
}

export async function addBlockchainTransaction(
  issueId: string,
  txHash: string,
  adminId: string,
  status: IssueStatus
) {
  const stmt = db.prepare(`
        INSERT INTO blockchain_transactions (issue_id, tx_hash, admin_id, status, timestamp, explorer_url)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

  // Default explorer URL assuming Sepolia or similar, can be customized or passed in
  const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;

  stmt.run(issueId, txHash, adminId, status, Date.now(), explorerUrl);
}

export async function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  notes?: string,
  txHash?: string,
  adminId?: string
): Promise<Issue | undefined> {
  const issue = await getIssueById(issueId);
  if (!issue) return undefined;

  const actualAdminId = adminId || 'admin-1';

  const stmt = db.prepare('UPDATE issues SET status = ? WHERE id = ?');
  stmt.run(newStatus, issueId);

  const updateStmt = db.prepare(`
        INSERT INTO issue_updates (issue_id, status, timestamp, updated_by, notes)
        VALUES (?, ?, ?, ?, ?)
    `);
  updateStmt.run(issueId, newStatus, Date.now(), actualAdminId, notes || null);

  if (txHash) {
    await addBlockchainTransaction(issueId, txHash, actualAdminId, newStatus);
  }

  return await getIssueById(issueId);
}

export async function incrementUpvote(issueId: string, userId: string): Promise<Issue | undefined> {
  // Check if already upvoted
  const checkStmt = db.prepare('SELECT 1 FROM issue_upvotes WHERE issue_id = ? AND user_id = ?');
  const manualCheck = checkStmt.get(issueId, userId);

  if (manualCheck) {
    throw new Error('You have already upvoted this issue.');
  }

  // Use transaction to ensure consistency
  const transaction = db.transaction(() => {
    // Record the upvote
    const insertStmt = db.prepare('INSERT INTO issue_upvotes (issue_id, user_id) VALUES (?, ?)');
    insertStmt.run(issueId, userId);

    // Increment count
    const updateStmt = db.prepare('UPDATE issues SET upvotes = upvotes + 1 WHERE id = ?');
    return updateStmt.run(issueId);
  });

  const info = transaction();

  if (info.changes === 0) return undefined;
  return await getIssueById(issueId);
}

export async function deleteIssue(issueId: string): Promise<void> {
  const deleteUpdates = db.prepare('DELETE FROM issue_updates WHERE issue_id = ?');
  deleteUpdates.run(issueId);

  const deleteIssueStmt = db.prepare('DELETE FROM issues WHERE id = ?');
  deleteIssueStmt.run(issueId);
}

export async function getUserNotifications(userId: string): Promise<{ issueId: string; title: string; status: IssueStatus; timestamp: Date }[]> {
  // Get all issues submitted by the user
  const issues = await getIssuesByUserId(userId);

  // For each issue, find updates that are NOT by the user (assuming 'user' check logic or just showing all status changes)
  // Ideally we filter out the initial "Pending" state if likely created by them, but let's just show recent activity.
  // A robust system would track "last_seen" or "read" status. For now, simplistically return the latest status update if it wasn't done by the user themselves
  // OR just return the latest update for all their issues.

  const notifications: { issueId: string; title: string; status: IssueStatus; timestamp: Date }[] = [];

  for (const issue of issues) {
    // We look at the latest update (index 0 because we sorted DESC in mapIssue -> Actually mapIssue sorts? 
    // Wait, mapIssue sorts `issue_updates` by timestamp DESC? 
    // Let's check mapIssue implementation locally in thi file.
    // Yes: `ORDER BY timestamp DESC` in mapIssue (line 22).
    const latestUpdate = issue.updates[0];

    // If there is an update and it wasn't done by the user (or we just show it to be safe)
    // For this MVP, let's show it if status is NOT 'Pending' (which is the initial state).
    if (latestUpdate && issue.status !== 'Pending') {
      notifications.push({
        issueId: issue.id,
        title: issue.title,
        status: issue.status,
        timestamp: latestUpdate.timestamp
      });
    }
  }

  // Sort by timestamp desc
  return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function getLeaderboard(): Promise<{ user: User; points: number; issuesCount: number }[]> {
  const stmt = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar_url, u.role,
      COUNT(i.id) as issues_count,
      COALESCE(SUM(i.upvotes), 0) as total_upvotes
    FROM users u
    LEFT JOIN issues i ON u.id = i.submitted_by
    GROUP BY u.id
    ORDER BY total_upvotes DESC, issues_count DESC
    LIMIT 5
  `);

  const rows = stmt.all() as any[];

  return rows.map(row => ({
    user: {
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url || '',
      imageHint: '',
      role: row.role
    },
    // Simple point system: 10 points per issue + 1 point per upvote
    points: (row.issues_count * 10) + row.total_upvotes,
    issuesCount: row.issues_count
  }));
}
