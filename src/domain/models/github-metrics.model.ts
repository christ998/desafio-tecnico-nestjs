export interface GitHubMetrics {
  username: string;
  metrics: {
    totalStars: number;
    followersToReposRatio: number;
    lastPushDaysAgo: number | null;
  };
}
