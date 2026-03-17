export const POINTS_PER_RESOLUTION = 50;
export const SOS_HELP_REWARD_POINTS = 50;
export const POINTS_PER_REWARD_CLAIM = 150;
export const MATIC_PER_REWARD_CLAIM = 10;

export function calculateCommunityPoints(resolvedIssues: number, sosRewardPoints: number) {
  return (resolvedIssues * POINTS_PER_RESOLUTION) + sosRewardPoints;
}

export function calculateClaimableReward(totalPoints: number, reservedPoints: number) {
  const availablePoints = Math.max(totalPoints - reservedPoints, 0);
  const claimUnits = Math.floor(availablePoints / POINTS_PER_REWARD_CLAIM);
  const claimablePoints = claimUnits * POINTS_PER_REWARD_CLAIM;
  const maticAmount = claimUnits * MATIC_PER_REWARD_CLAIM;
  const pointsUntilNextClaim = claimUnits > 0
    ? 0
    : POINTS_PER_REWARD_CLAIM - (availablePoints % POINTS_PER_REWARD_CLAIM || 0);

  return {
    availablePoints,
    claimUnits,
    claimablePoints,
    maticAmount,
    pointsUntilNextClaim,
  };
}
