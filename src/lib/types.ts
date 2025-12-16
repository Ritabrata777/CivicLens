
export type IssueStatus = "Pending" | "Seen" | "Accepted" | "In Progress" | "Resolved" | "Rejected";

export const issueCategories = ["Pothole", "Streetlight Failure", "Drainage Issue", "Garbage Dumping", "Traffic Violation", "Other"] as const;
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
};

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  imageHint: string;
  role?: 'admin' | 'user';
};
