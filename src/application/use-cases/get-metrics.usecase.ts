import { Inject, Injectable, Logger } from '@nestjs/common';
import { GitHubMetrics } from '@domain/models/github-metrics.model';
import { CACHE_PORT, CachePort } from '@domain/ports/cache.port';
import { GITHUB_PORT, GitHubPort } from '@domain/ports/github.port';
import { GitHubRepository } from '@domain/models/github-repo.model';

@Injectable()
export class GetMetricsUseCase {
  private readonly logger = new Logger(GetMetricsUseCase.name);
  private static readonly TTL_SECONDS = 300;

  constructor(
    @Inject(GITHUB_PORT) private readonly githubPort: GitHubPort,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
  ) {}

  async getMetrics(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubMetrics> {
    return this.computeMetrics(username, signal);
  }

  private async computeMetrics(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubMetrics> {
    const startedAt = Date.now();
    let status: 'success' | 'failure' = 'success';
    this.logger.log(`metrics:start user=${username}`);

    try {
      const cacheKey = this.buildCacheKey(username);
      const cached = await this.cachePort.get<GitHubMetrics>(cacheKey);
      if (cached) {
        this.logger.log(`metrics:cache-hit user=${username}`);
        return cached;
      }

      const [profile, repositories] = await Promise.all([
        this.githubPort.getUserProfile(username, signal),
        this.githubPort.getUserRepositories(username, signal),
      ]);

      const metrics = this.composeMetrics({
        login: profile.login,
        followers: profile.followers,
        publicRepos: profile.public_repos,
        repositories,
      });

      await this.cachePort.set(
        cacheKey,
        metrics,
        GetMetricsUseCase.TTL_SECONDS,
      );
      return metrics;
    } catch (err) {
      status = 'failure';
      this.logger.error(
        `metrics:error user=${username} reason=${(err as Error)?.message ?? err}`,
      );
      throw err;
    } finally {
      const duration = Date.now() - startedAt;
      this.logger.log(
        `metrics:end user=${username} status=${status} duration_ms=${duration}`,
      );
    }
  }

  private composeMetrics(input: {
    login: string;
    followers: number;
    publicRepos: number;
    repositories: GitHubRepository[];
  }): GitHubMetrics {
    const totalStars = this.sumStars(input.repositories);
    const lastPushDaysAgo = this.computeLastPushDaysAgo(input.repositories);
    const followersToReposRatio = this.followersRatio(
      input.followers,
      input.publicRepos,
    );

    return {
      username: input.login,
      metrics: { totalStars, followersToReposRatio, lastPushDaysAgo },
    };
  }

  private buildCacheKey(username: string): string {
    return `metrics:${username}`;
  }

  private sumStars(repos: GitHubRepository[]): number {
    let total = 0;
    for (const repo of repos) total += repo.stars;
    return total;
  }

  private followersRatio(followers: number, publicRepos: number): number {
    if (!publicRepos) return 0;
    return this.roundTo(followers / publicRepos, 2);
  }

  private computeLastPushDaysAgo(
    repositories: GitHubRepository[],
  ): number | null {
    let latest = Number.NEGATIVE_INFINITY;
    for (const repo of repositories) {
      if (!repo.pushedAt) continue;
      const ts = new Date(repo.pushedAt).getTime();
      if (!Number.isNaN(ts) && ts > latest) latest = ts;
    }
    if (!Number.isFinite(latest)) return null;
    const ONE_DAY_MS = 86_400_000;
    return Math.floor((Date.now() - latest) / ONE_DAY_MS);
  }

  private roundTo(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
}
