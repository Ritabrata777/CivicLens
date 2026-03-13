import type { LocalityScoreResult } from '@/lib/types';

type LocalitySourceIssue = {
  category?: string | null;
  status?: string | null;
  is_urgent?: number | boolean | null;
  location_address?: string | null;
  postal_code?: string | null;
};

const PINCODE_REGEX = /(?<!\d)(\d{3})[\s-]?(\d{3})(?!\d)/;

export function extractPincode(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  const match = normalizedValue.match(PINCODE_REGEX);
  if (!match) {
    return undefined;
  }

  return `${match[1]}${match[2]}`;
}

function getLocalityName(addresses: string[], pincode: string) {
  const match = addresses.find((address) => address.includes(pincode));
  if (!match) {
    return `Pincode ${pincode}`;
  }

  const cleaned = match.replace(/\s+/g, ' ').trim();
  const segments = cleaned.split(',').map((segment) => segment.trim()).filter(Boolean);
  const withoutPincode = segments.filter((segment) => !segment.includes(pincode));
  return withoutPincode.slice(0, 2).join(', ') || `Pincode ${pincode}`;
}

export function buildLocalityScore(pincode: string, issues: LocalitySourceIssue[]): LocalityScoreResult {
  const categoryMap = new Map<string, number>();
  const addresses: string[] = [];
  let resolvedIssues = 0;
  let urgentIssues = 0;

  for (const issue of issues) {
    const category = issue.category?.trim() || 'Other';
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);

    if (issue.status === 'Resolved') {
      resolvedIssues += 1;
    }

    if (issue.is_urgent === 1 || issue.is_urgent === true) {
      urgentIssues += 1;
    }

    if (issue.location_address) {
      addresses.push(issue.location_address);
    }
  }

  const totalIssues = issues.length;
  const openIssues = totalIssues - resolvedIssues;
  const issuePenalty = Math.min(100, totalIssues * 10);
  const baseScore = Math.max(0, 100 - issuePenalty);
  const momentum = Math.min(15, resolvedIssues * 2);
  const urgentPenalty = Math.min(10, urgentIssues * 2);
  const score = Math.max(0, Math.min(100, baseScore + momentum - urgentPenalty));

  const issueCounts = [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count);

  const localityName = getLocalityName(addresses, pincode);

  let grade = 'Excellent';
  if (score < 40) {
    grade = 'Critical';
  } else if (score < 60) {
    grade = 'Weak';
  } else if (score < 80) {
    grade = 'Fair';
  } else if (score < 90) {
    grade = 'Strong';
  }

  const topIssue = issueCounts[0];
  const summary = totalIssues === 0
    ? `No civic issues have been reported yet for ${pincode}.`
    : `${localityName} has ${totalIssues} reported issue${totalIssues === 1 ? '' : 's'}. ${topIssue ? `${topIssue.count} ${topIssue.category.toLowerCase()} complaint${topIssue.count === 1 ? '' : 's'} lead the list.` : ''}`;

  return {
    pincode,
    score,
    grade,
    totalIssues,
    resolvedIssues,
    openIssues,
    urgentIssues,
    issuePenalty,
    momentum,
    localityName,
    summary,
    issueCounts,
  };
}
