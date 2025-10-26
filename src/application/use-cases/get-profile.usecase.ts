import { Inject, Injectable, Logger } from '@nestjs/common';
import { GitHubProfile } from '@domain/models/github-profile.model';
import { CACHE_PORT, CachePort } from '@domain/ports/cache.port';
import { GITHUB_PORT, GitHubPort } from '@domain/ports/github.port';

@Injectable()
export class GetProfileUseCase {
  private readonly logger = new Logger(GetProfileUseCase.name);
  private static readonly TTL_SECONDS = 300;

  constructor(
    @Inject(GITHUB_PORT) private readonly githubPort: GitHubPort,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
  ) {}

  async getProfile(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubProfile> {
    return this.retrieveProfile(username, signal);
  }

  private async retrieveProfile(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubProfile> {
    const startedAt = Date.now();
    let status: 'success' | 'failure' = 'success';
    this.logger.log(`profile:start user=${username}`);

    try {
      const cacheKey = this.buildCacheKey(username);
      const cached = await this.cachePort.get<GitHubProfile>(cacheKey);
      if (cached) {
        this.logger.log(`profile:cache-hit user=${username}`);
        return cached;
      }

      const profile = await this.githubPort.getUserProfile(username, signal);

      await this.cachePort.set(
        cacheKey,
        profile,
        this.computeTtlWithJitter(GetProfileUseCase.TTL_SECONDS, 0.1),
      );

      return profile;
    } catch (err) {
      status = 'failure';
      this.logger.error(
        `profile:error user=${username} reason=${(err as Error)?.message ?? err}`,
      );
      throw err;
    } finally {
      const duration = Date.now() - startedAt;
      this.logger.log(
        `profile:end user=${username} status=${status} duration_ms=${duration}`,
      );
    }
  }

  private buildCacheKey(username: string): string {
    return `profile:${username.trim().toLowerCase()}`;
  }

  /*
   * Sirve para agregar “jitter” (variación aleatoria) al TTL del caché, evitando que muchas claves expiren exactamente al mismo tiempo y provoquen un aumento de tráfico (cache stampede).
   */
  private computeTtlWithJitter(baseSeconds: number, jitterRatio = 0.1): number {
    const jitter = Math.floor(baseSeconds * jitterRatio);
    return baseSeconds - jitter + Math.floor(Math.random() * (jitter * 2 + 1));
  }
}
