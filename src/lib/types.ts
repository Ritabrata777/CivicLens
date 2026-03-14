
export type IssueStatus = "Pending" | "Seen" | "Accepted" | "In Progress" | "Resolved" | "Rejected";

export const issueCategories = ["Pothole", "Streetlight Failure", "Drainage Issue", "Garbage Dumping", "Traffic Violation", "Domestic Utilities", "Other"] as const;
export type IssueCategory = typeof issueCategories[number] | string;

export type IssueUpdate = {
  timestamp: Date;
  status: IssueStatus;
  notes?: string;
  updatedBy: string;
};

export type BlockchainTransaction = {
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  adminId: string;
  status: IssueStatus;
  explorerUrl: string;
};

export type ResolutionEvidence = {
  id: number;
  issueId: string;
  adminId: string;
  imageUrl: string;
  notes?: string;
  timestamp: Date;
};

export type LocalityIssueCount = {
  category: string;
  count: number;
};

export type LocalityScoreResult = {
  pincode: string;
  score: number;
  grade: string;
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  urgentIssues: number;
  issuePenalty: number;
  momentum: number;
  localityName: string;
  summary: string;
  issueCounts: LocalityIssueCount[];
};

export type NotificationKind = "issue_update" | "sos_alert" | "sos_sent";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  href: string;
  kind: NotificationKind;
  timestamp: Date;
  status?: IssueStatus;
  relatedSosId?: string;
};

export type SOSAlert = {
  id: string;
  senderId: string;
  senderName?: string;
  emergencyType: string;
  details?: string;
  locationAddress: string;
  pincode: string;
  locationLat?: number;
  locationLng?: number;
  status: "Active" | "Accepted" | "Resolved";
  createdAt: Date;
  notifiedHeroIds: string[];
  acceptedById?: string;
  acceptedByName?: string;
  acceptedAt?: Date;
  acceptedHelperLocationAddress?: string;
  acceptedHelperLocationLat?: number;
  acceptedHelperLocationLng?: number;
  distanceKm?: number;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  pincode?: string;
  imageUrl: string;
  imageHint: string;
  submittedBy: string; // User ID
  submittedAt: Date;
  upvotes: number;
  updates: IssueUpdate[];
  blockchainTransaction?: BlockchainTransaction;
  isUrgent?: boolean;
  licensePlate?: string;
  violationType?: string;
  resolutionEvidence?: ResolutionEvidence;
};

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  imageHint: string;
  rewardPoints?: number;
  role?: 'admin' | 'user';
};
