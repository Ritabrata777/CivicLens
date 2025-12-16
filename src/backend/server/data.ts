
import type { Issue, User, IssueStatus, IssueUpdate, BlockchainTransaction, IssueCategory } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- MOCK USERS ---
const users: User[] = [
  { id: 'user-1', name: 'Alice Johnson', avatarUrl: PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl!, imageHint: 'person portrait' },
  { id: 'user-2', name: 'Bob Williams', avatarUrl: PlaceHolderImages.find(img => img.id === 'user-avatar-2')?.imageUrl!, imageHint: 'person face' },
  { id: 'admin-1', name: 'Admin Clara', avatarUrl: 'https://i.pravatar.cc/40?u=admin-1', imageHint: 'person glasses' },
];

// --- MOCK ISSUES (DATABASE) ---
let issues: Issue[] = [
  {
    id: 'ISSUE-101',
    title: 'Massive pothole on Main St',
    description: 'There is a huge pothole near the intersection of Main St and 2nd Ave. It\'s a danger to cyclists and could damage cars. It has been there for over a week.',
    category: 'Pothole',
    status: 'Accepted',
    location: { lat: 40.7128, lng: -74.0060, address: 'Main St & 2nd Ave, New York, NY' },
    imageUrl: PlaceHolderImages.find(img => img.id === 'pothole-1')?.imageUrl!,
    imageHint: PlaceHolderImages.find(img => img.id === 'pothole-1')?.imageHint!,
    submittedBy: 'user-1',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    upvotes: 15,
    updates: [
        { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'Pending', updatedBy: 'user-1', notes: 'Issue submitted.' },
        { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'Seen', updatedBy: 'admin-1' },
        { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'Accepted', updatedBy: 'admin-1', notes: 'Repair crew has been scheduled.' },
    ],
    blockchainTransaction: {
        txHash: '0x123...abc',
        blockNumber: 123456,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        adminId: 'admin-1',
        status: 'Accepted',
        explorerUrl: 'https://polygonscan.com/tx/0x123...abc'
    },
    isUrgent: true,
  },
  {
    id: 'ISSUE-102',
    title: 'Streetlight out on Park Ave',
    description: 'The streetlight at the corner of Park Ave and 5th has been out for three nights. It\'s very dark and feels unsafe.',
    category: 'Streetlight Failure',
    status: 'In Progress',
    location: { lat: 40.7159, lng: -74.0021, address: 'Park Ave & 5th, New York, NY' },
    imageUrl: PlaceHolderImages.find(img => img.id === 'streetlight-1')?.imageUrl!,
    imageHint: PlaceHolderImages.find(img => img.id === 'streetlight-1')?.imageHint!,
    submittedBy: 'user-2',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    upvotes: 8,
    updates: [
        { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'Pending', updatedBy: 'user-2', notes: 'Issue submitted.' },
        { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'Accepted', updatedBy: 'admin-1', notes: 'Acknowledged. Team will investigate.' },
        { timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), status: 'In Progress', updatedBy: 'admin-1', notes: 'Parts have been ordered for the repair.' },
    ],
    blockchainTransaction: {
        txHash: '0x456...def',
        blockNumber: 123499,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        adminId: 'admin-1',
        status: 'Accepted',
        explorerUrl: 'https://polygonscan.com/tx/0x456...def'
    }
  },
  {
    id: 'ISSUE-103',
    title: 'Garbage overflow at City Park',
    description: 'The bins at City Park are completely full and trash is spilling out onto the grass. It\'s attracting pests.',
    category: 'Garbage Dumping',
    status: 'Resolved',
    location: { lat: 40.7145, lng: -74.0081, address: 'City Park, New York, NY' },
    imageUrl: PlaceHolderImages.find(img => img.id === 'garbage-1')?.imageUrl!,
    imageHint: PlaceHolderImages.find(img => img.id === 'garbage-1')?.imageHint!,
    submittedBy: 'user-1',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    upvotes: 22,
    updates: [
        { timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: 'Pending', updatedBy: 'user-1' },
        { timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), status: 'Accepted', updatedBy: 'admin-1' },
        { timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), status: 'Resolved', updatedBy: 'admin-1', notes: 'Sanitation crew cleared the area.' },
    ],
    blockchainTransaction: {
        txHash: '0x789...ghi',
        blockNumber: 123300,
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        adminId: 'admin-1',
        status: 'Accepted',
        explorerUrl: 'https://polygonscan.com/tx/0x789...ghi'
    }
  },
  {
    id: 'ISSUE-104',
    title: 'Blocked drain on Water St',
    description: 'After the rain, a large pool of water has formed on Water St because the drain is blocked by leaves and debris.',
    category: 'Drainage Issue',
    status: 'Seen',
    location: { lat: 40.7095, lng: -74.0041, address: 'Water St, New York, NY' },
    imageUrl: PlaceHolderImages.find(img => img.id === 'drainage-1')?.imageUrl!,
    imageHint: PlaceHolderImages.find(img => img.id === 'drainage-1')?.imageHint!,
    submittedBy: 'user-2',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    upvotes: 3,
    updates: [
        { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'Pending', updatedBy: 'user-2' },
        { timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), status: 'Seen', updatedBy: 'admin-1' },
    ],
  },
];

// --- MOCK API/DB FUNCTIONS ---

// READ operations
export async function getIssues(): Promise<Issue[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return issues.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return issues.find(issue => issue.id === id);
}

export async function getIssuesByUserId(userId: string): Promise<Issue[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return issues.filter(issue => issue.submittedBy === userId).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export async function getUserById(id: string): Promise<User | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return users.find(user => user.id === id);
}

// WRITE operations (These would be server actions in a real app)
export async function addIssue(
    data: { title: string; description: string; category: IssueCategory, otherCategory?:string, location: string, isUrgent?: boolean }
): Promise<Issue> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const finalCategory = data.category === 'Other' ? data.otherCategory! : data.category;

    const newIssue: Issue = {
        id: `ISSUE-${Math.floor(Math.random() * 900) + 100}`,
        title: data.title,
        description: data.description,
        category: finalCategory,
        status: 'Pending',
        location: { lat: 40.7128, lng: -74.0060, address: data.location || "Location not provided" },
        imageUrl: PlaceHolderImages.find(img => img.id === 'generic-issue-1')?.imageUrl!,
        imageHint: PlaceHolderImages.find(img => img.id === 'generic-issue-1')?.imageHint!,
        submittedBy: 'user-1', // Mocked current user
        submittedAt: new Date(),
        upvotes: 1,
        updates: [{ timestamp: new Date(), status: 'Pending', updatedBy: 'user-1', notes: 'Issue submitted.' }],
        isUrgent: data.isUrgent || false,
    };
    issues.unshift(newIssue);
    return newIssue;
}

export async function updateIssueStatus(
    issueId: string,
    newStatus: IssueStatus,
    notes?: string
): Promise<Issue | undefined> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const issueIndex = issues.findIndex(issue => issue.id === issueId);
    if (issueIndex === -1) return undefined;

    const issue = issues[issueIndex];
    issue.status = newStatus;
    const update: IssueUpdate = {
        timestamp: new Date(),
        status: newStatus,
        updatedBy: 'admin-1', // Mocked admin
    };
    if (notes) {
        update.notes = notes;
    }
    issue.updates.push(update);

    // Simulate blockchain transaction on "Accepted"
    if (newStatus === 'Accepted' && !issue.blockchainTransaction) {
        const transaction: BlockchainTransaction = {
            txHash: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            blockNumber: Math.floor(Math.random() * 100000) + 100000,
            timestamp: new Date(),
            adminId: 'admin-1',
            status: 'Accepted',
            explorerUrl: `https://polygonscan.com/tx/0x...`
        };
        issue.blockchainTransaction = transaction;
        console.log(`[BLOCKCHAIN] Transaction simulated for ${issueId}:`, transaction);
    }
    
    issues[issueIndex] = issue;
    return issue;
}

export async function incrementUpvote(issueId: string): Promise<Issue | undefined> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const issueIndex = issues.findIndex(issue => issue.id === issueId);
    if (issueIndex === -1) return undefined;

    issues[issueIndex].upvotes++;
    return issues[issueIndex];
}
